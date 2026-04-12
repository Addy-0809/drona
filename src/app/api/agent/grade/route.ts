// src/app/api/agent/grade/route.ts
// Grading Agent — evaluates uploaded handwritten answer sheets using Gemini Vision
// Firestore is optional — grading result is always returned even without DB
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { visionModel } from "@/lib/gemini";
import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

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

    // ── NORMAL PATH: image uploaded ────────────────────────────────────────
    const answersJson = formData.get("expectedAnswers") as string;
    const expectedAnswers = JSON.parse(answersJson || "{}");

    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = imageFile.type as "image/jpeg" | "image/png" | "image/webp" | "application/pdf";

    const prompt = `You are a university professor evaluating a student's handwritten answer sheet.

The expected answers and marking scheme are:
${JSON.stringify(expectedAnswers, null, 2)}

Please carefully read the handwritten answers in the image and evaluate them.

Return ONLY valid JSON in this exact format:
{
  "totalScore": 85,
  "maxScore": 100,
  "percentage": 85,
  "questionResults": [
    {
      "questionId": "sa1",
      "question": "Question text",
      "studentAnswer": "What you read from the handwriting",
      "marksAwarded": 4,
      "maxMarks": 5,
      "feedback": "Specific feedback for this answer",
      "keywordsCovered": ["keyword1"],
      "keywordsMissed": ["keyword2"]
    }
  ],
  "overallFeedback": "Overall assessment of the student's performance",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["area to improve 1", "area to improve 2"]
}

Be fair and constructive. If handwriting is unclear, give benefit of the doubt.`;

    const result = await visionModel.generateContent([
      prompt,
      { inlineData: { mimeType, data: base64 } },
    ]);

    const text = result.response.text().trim();
    const jsonText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const grading = JSON.parse(jsonText);

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
      ? "Gemini API quota exceeded — please wait a minute and try again."
      : errMsg.includes("404") || errMsg.includes("not found")
      ? "Gemini model not found — the model may have been deprecated."
      : `Failed to grade answer sheet: ${errMsg}`;
    return NextResponse.json({ error: userMsg }, { status: 500 });
  }
}
