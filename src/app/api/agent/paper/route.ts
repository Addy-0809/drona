// src/app/api/agent/paper/route.ts
// Paper Analysis Agent — analyses university question paper and generates a similar mock paper
// Uses LangChain's ChatGoogleGenerativeAI for structured vision model interactions
// Firestore is optional — analysis always returned via AI
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { visionLLM } from "@/lib/langchain";
import { HumanMessage } from "@langchain/core/messages";

export async function POST(req: NextRequest) {
  try {
    await headers();
    const session = await auth();
    console.log("[paper] session resolved:", JSON.stringify({ hasSession: !!session, userId: session?.user?.id, email: session?.user?.email }));
    const userId = session?.user?.id ?? session?.user?.email;
    if (!userId) {
      console.error("[paper] Unauthorized — no user ID or email in session");
      return NextResponse.json({ error: "Unauthorized — please sign in again" }, { status: 401 });
    }

    const formData = await req.formData();
    const paperFile = formData.get("paper") as File;

    if (!paperFile) {
      return NextResponse.json({ error: "Paper file is required" }, { status: 400 });
    }

    const bytes = await paperFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = paperFile.type as "image/jpeg" | "image/png" | "image/webp" | "application/pdf";

    const promptText = `You are an expert academic who specialises in analysing university question papers.

Carefully examine this question paper image/document and:
1. Identify the subject, university/institution if visible
2. Analyse the paper structure, question types, marks distribution
3. Generate a completely new mock paper following the EXACT same pattern

Return ONLY valid JSON in this exact format:
{
  "paperAnalysis": {
    "subject": "Detected subject name",
    "institution": "University/institution name if visible",
    "totalMarks": 100,
    "duration": "3 hours",
    "sections": [
      {
        "sectionName": "Section A",
        "instructions": "Answer all questions",
        "questionType": "MCQ / Short Answer / Long Answer / Essay",
        "numberOfQuestions": 10,
        "marksPerQuestion": 2,
        "totalMarks": 20
      }
    ],
    "questionTypes": ["MCQ", "Short Answer", "Long Answer"],
    "difficultyLevel": "Moderate",
    "topicsCovered": ["topic1", "topic2"]
  },
  "mockPaper": {
    "title": "Mock Examination Paper",
    "subject": "Subject Name",
    "duration": "3 Hours",
    "totalMarks": 100,
    "instructions": ["General instruction 1", "General instruction 2"],
    "sections": [
      {
        "sectionName": "Section A",
        "instructions": "Answer all questions. Each question carries 2 marks.",
        "questions": [
          {
            "questionNumber": "1",
            "question": "Full question text here?",
            "marks": 2,
            "type": "MCQ",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "answer": "Option A"
          }
        ]
      }
    ]
  }
}

Make the mock paper comprehensive, realistic, and following the same difficulty level and pattern as the original.`;

    // ── LangChain multimodal message with vision model ───────────────────
    console.log("[paper] Invoking LangChain vision model for paper analysis");
    const message = new HumanMessage({
      content: [
        { type: "text", text: promptText },
        {
          type: "image_url",
          image_url: { url: `data:${mimeType};base64,${base64}` },
        },
      ],
    });

    const result = await visionLLM.invoke([message]);
    const text = typeof result.content === "string" ? result.content : JSON.stringify(result.content);
    const jsonText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const paperData = JSON.parse(jsonText);

    // Save to Firestore — optional
    let paperId = `local-${Date.now()}`;
    try {
      const db = adminDb();
      if (db) {
        const { FieldValue } = await import("firebase-admin/firestore");
        const paperRef = db.collection("uploadedPapers").doc();
        await paperRef.set({
          id: paperRef.id,
          userId,
          fileName: paperFile.name,
          paperData,
          createdAt: FieldValue.serverTimestamp(),
        });
        paperId = paperRef.id;
      }
    } catch (dbErr) {
      console.warn("Firestore write skipped (non-fatal):", dbErr);
    }

    return NextResponse.json({ ...paperData, paperId });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("Paper analysis agent error:", errMsg);
    const userMsg = errMsg.includes("429") || errMsg.includes("quota")
      ? "Drona API quota exceeded — please wait a minute and try again."
      : errMsg.includes("404") || errMsg.includes("not found")
      ? "Drona AI model not found — the model may have been deprecated."
      : `Failed to analyse paper: ${errMsg}`;
    return NextResponse.json({ error: userMsg }, { status: 500 });
  }
}
