// src/app/api/agent/grade/route.ts
// Grading Agent — evaluates uploaded handwritten answer sheets using LangChain + Drona AI Vision
// Enhanced with NLP Semantic Grading pipeline for fair, phrasing-independent scoring
// Uses concept decomposition + embedding similarity + keyword matching
// Firestore is optional — grading result is always returned even without DB
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { visionLLM, jsonParser } from "@/lib/langchain";
import { HumanMessage } from "@langchain/core/messages";
import { gradeAnswer, type GradeResult } from "@/lib/semantic-grader";

export async function POST(req: NextRequest) {
  try {
    await headers();
    const session = await auth();
    console.log("[grade] session resolved:", JSON.stringify({ hasSession: !!session, userId: session?.user?.id, email: session?.user?.email }));
    const userId = session?.user?.id ?? session?.user?.email;
    if (!userId) {
      console.error("[grade] Unauthorized — no user ID or email in session");
      return NextResponse.json({ error: "Unauthorized — please sign in again" }, { status: 401 });
    }

    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const testId = formData.get("testId") as string;
    const noImage = formData.get("noImage") === "true";

    // ── NO IMAGE PATH: student skipped upload — short answers all get 0 ──────
    if (noImage || !imageFile) {
      let testData: Record<string, unknown> | null = null;
      try {
        const db = adminDb();
        if (db && testId) {
          const snap = await db.collection("tests").doc(testId).get();
          if (snap.exists) testData = snap.data() as Record<string, unknown>;
        }
      } catch { /* non-fatal */ }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const test = (testData?.test as any) || null;
      const shortAnswers: Array<{ id: string; question: string; marks: number }> = test?.shortAnswers || [];

      const saResults = shortAnswers.map((q) => ({
        questionId: q.id,
        question: q.question,
        studentAnswer: "Not submitted",
        marksAwarded: 0,
        maxMarks: q.marks,
        feedback: "No handwritten answer sheet was uploaded. 0 marks awarded.",
      }));

      const maxScore = shortAnswers.reduce((s, q) => s + q.marks, 0) || 30;

      const grading = {
        totalScore: 0,
        maxScore,
        percentage: 0,
        questionResults: saResults,
        overallFeedback: "No answer sheet was submitted. All short-answer marks have been awarded 0. Please upload your handwritten answers next time.",
        strengths: [],
        improvements: ["Submit your handwritten answer sheet to receive a proper evaluation."],
        gradingMethod: "no-submission",
      };

      try {
        const db = adminDb();
        if (db && testId) {
          const { FieldValue, Timestamp } = await import("firebase-admin/firestore");
          const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
          await db.collection("testResults").doc(testId).set(
            { grading, gradedAt: FieldValue.serverTimestamp(), userId, status: "graded", noUpload: true, expiresAt: Timestamp.fromDate(new Date(Date.now() + SIXTY_DAYS_MS)) },
            { merge: true }
          );
        }
      } catch (dbErr) {
        console.warn("Firestore write skipped (non-fatal):", dbErr);
      }

      return NextResponse.json({ grading });
    }

    // ── NORMAL PATH: image uploaded — OCR via vision model, then NLP grading ──
    const answersJson = formData.get("expectedAnswers") as string;
    const expectedAnswers = JSON.parse(answersJson || "{}");
    const subjectId = formData.get("subjectId") as string || "";

    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = imageFile.type as "image/jpeg" | "image/png" | "image/webp" | "application/pdf";

    // Step 1: Extract student answers from handwritten image using vision model
    const ocrPrompt = `You are an expert at reading handwritten academic answer sheets.

Carefully read the handwritten answers in this image and extract the text for each question.

The expected questions are:
${JSON.stringify(expectedAnswers, null, 2)}

Return ONLY valid JSON in this exact format:
{
  "extractedAnswers": [
    {
      "questionId": "sa1",
      "question": "The question text",
      "studentAnswer": "What you read from the handwriting for this question"
    }
  ],
  "readabilityNotes": "Any notes about handwriting quality"
}

Be thorough — try to read everything the student wrote. If a question's answer is not found, set studentAnswer to "Not found in submission".`;

    console.log("[grade] Step 1: Invoking vision model for OCR extraction");
    const ocrMessage = new HumanMessage({
      content: [
        { type: "text", text: ocrPrompt },
        {
          type: "image_url",
          image_url: { url: `data:${mimeType};base64,${base64}` },
        },
      ],
    });

    const ocrResult = await visionLLM.invoke([ocrMessage]);
    const ocrText = typeof ocrResult.content === "string" ? ocrResult.content : JSON.stringify(ocrResult.content);
    const ocrJsonText = ocrText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const ocrData = JSON.parse(ocrJsonText);
    const extractedAnswers: Array<{ questionId: string; question: string; studentAnswer: string }> =
      ocrData.extractedAnswers || [];

    console.log(`[grade] OCR extracted ${extractedAnswers.length} answers`);

    // Step 2: NLP Semantic Grading for each short answer
    console.log("[grade] Step 2: NLP semantic grading pipeline");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expectedMap = new Map<string, any>();
    if (Array.isArray(expectedAnswers)) {
      for (const ea of expectedAnswers) {
        expectedMap.set(ea.id, ea);
      }
    }

    const questionResults: Array<{
      questionId: string;
      question: string;
      studentAnswer: string;
      marksAwarded: number;
      maxMarks: number;
      feedback: string;
      semanticScore?: number;
      keywordScore?: number;
      conceptsCovered?: string[];
      conceptsMissed?: string[];
    }> = [];

    let totalScore = 0;
    let maxScore = 0;

    // Grade answers 2 at a time to manage API rate limits
    const CONCURRENCY = 2;
    for (let i = 0; i < extractedAnswers.length; i += CONCURRENCY) {
      const batch = extractedAnswers.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map(async (extracted) => {
          const expected = expectedMap.get(extracted.questionId);
          if (!expected) {
            return {
              questionId: extracted.questionId,
              question: extracted.question,
              studentAnswer: extracted.studentAnswer,
              marksAwarded: 0,
              maxMarks: 5,
              feedback: "Question not found in expected answers.",
            };
          }

          // Use NLP semantic grading pipeline
          const gradeResult: GradeResult = await gradeAnswer({
            studentAnswer: extracted.studentAnswer,
            expectedAnswer: expected.expectedAnswer || "",
            keywords: expected.keywords || [],
            maxMarks: expected.marks || 5,
            question: expected.question || extracted.question,
            subjectId: subjectId || undefined,
          });

          return {
            questionId: extracted.questionId,
            question: expected.question || extracted.question,
            studentAnswer: extracted.studentAnswer,
            marksAwarded: gradeResult.marksAwarded,
            maxMarks: gradeResult.maxMarks,
            feedback: gradeResult.feedback,
            semanticScore: gradeResult.semanticScore,
            keywordScore: gradeResult.keywordScore,
            conceptsCovered: gradeResult.conceptsCovered,
            conceptsMissed: gradeResult.conceptsMissed,
          };
        })
      );

      questionResults.push(...batchResults);
    }

    // Calculate totals
    for (const qr of questionResults) {
      totalScore += qr.marksAwarded;
      maxScore += qr.maxMarks;
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    // Step 3: Generate overall feedback summary
    const strengths: string[] = [];
    const improvements: string[] = [];

    for (const qr of questionResults) {
      const pct = qr.maxMarks > 0 ? (qr.marksAwarded / qr.maxMarks) * 100 : 0;
      if (pct >= 80) {
        strengths.push(`Strong answer on: ${qr.question.slice(0, 60)}...`);
      } else if (pct < 50) {
        improvements.push(`Needs improvement: ${qr.question.slice(0, 60)}...`);
      }
    }

    const grading = {
      totalScore,
      maxScore,
      percentage,
      questionResults,
      overallFeedback: `You scored ${totalScore}/${maxScore} (${percentage}%) on the short answers. ${strengths.length > 0 ? `Strengths in ${strengths.length} areas. ` : ""}${improvements.length > 0 ? `${improvements.length} areas need more work.` : "Well done overall!"}`,
      strengths,
      improvements,
      gradingMethod: "nlp-semantic",
      readabilityNotes: ocrData.readabilityNotes || "",
    };

    // Save to Firestore — optional
    try {
      const db = adminDb();
      if (db && testId) {
        const { FieldValue, Timestamp } = await import("firebase-admin/firestore");
        const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
        await db.collection("testResults").doc(testId).set(
          { grading, gradedAt: FieldValue.serverTimestamp(), userId, status: "graded", expiresAt: Timestamp.fromDate(new Date(Date.now() + SIXTY_DAYS_MS)) },
          { merge: true }
        );
      }
    } catch (dbErr) {
      console.warn("Firestore write skipped (non-fatal):", dbErr);
    }

    return NextResponse.json({ grading });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("Grading agent error:", errMsg);
    const userMsg = errMsg.includes("429") || errMsg.includes("quota")
      ? "Drona API quota exceeded — please wait a minute and try again."
      : errMsg.includes("404") || errMsg.includes("not found")
      ? "Drona AI model not found — the model may have been deprecated."
      : `Failed to grade answer sheet: ${errMsg}`;
    return NextResponse.json({ error: userMsg }, { status: 500 });
  }
}
