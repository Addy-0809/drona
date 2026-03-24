// src/app/api/agent/test/route.ts
// Examiner Agent — generates mock test questions from completed topics
// Firestore is optional — test generation works without Admin SDK
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { textModel } from "@/lib/gemini";
import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    await headers();
    const session = await auth();
    console.log("[test] session resolved:", JSON.stringify({ hasSession: !!session, userId: session?.user?.id, email: session?.user?.email }));
    const userId = session?.user?.id ?? session?.user?.email;
    if (!userId) {
      console.error("[test] Unauthorized — no user ID or email in session");
      return NextResponse.json({ error: "Unauthorized — please sign in again" }, { status: 401 });
    }

    const { subjectId, subjectName, completedTopics } = await req.json();
    const topicList = completedTopics.join(", ");

    const prompt = `You are a university exam paper setter. Create a comprehensive mock test for a student who has studied the following topics in ${subjectName}: ${topicList}.

Return ONLY valid JSON in this exact format:
{
  "title": "Mock Test: ${subjectName}",
  "duration": 60,
  "totalMarks": 50,
  "mcqs": [
    {
      "id": "q1",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of the correct answer",
      "marks": 2,
      "topic": "Relevant topic name"
    }
  ],
  "shortAnswers": [
    {
      "id": "sa1",
      "question": "Short answer question here?",
      "expectedAnswer": "Model answer that the evaluator should look for",
      "marks": 5,
      "topic": "Relevant topic name",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}

Requirements:
- Exactly 10 MCQs (each 2 marks = 20 marks total)
- Exactly 6 short answer questions (each 5 marks = 30 marks total)
- Cover all the provided topics evenly
- MCQ correctAnswer is the 0-indexed position in options array
- Questions should be university-level difficulty
- Short answers should have clear expected answers with key concepts listed`;

    const result = await textModel.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const test = JSON.parse(jsonText);

    // Save to Firestore — optional
    let testId = `local-${Date.now()}`;
    try {
      const db = adminDb();
      if (db) {
        const { FieldValue } = await import("firebase-admin/firestore");
        const testRef = db.collection("tests").doc();
        await testRef.set({
          id: testRef.id,
          userId,
          subjectId,
          subjectName,
          completedTopics,
          test,
          status: "pending",
          createdAt: FieldValue.serverTimestamp(),
        });
        testId = testRef.id;
      }
    } catch (dbErr) {
      console.warn("Firestore write skipped (non-fatal):", dbErr);
    }

    return NextResponse.json({ test, testId });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("Examiner agent error:", errMsg);
    const userMsg = errMsg.includes("429") || errMsg.includes("quota")
      ? "Gemini API quota exceeded — please wait a minute and try again."
      : errMsg.includes("404") || errMsg.includes("not found")
      ? "Gemini model not found — the model may have been deprecated."
      : `Failed to generate test: ${errMsg}`;
    return NextResponse.json({ error: userMsg }, { status: 500 });
  }
}
