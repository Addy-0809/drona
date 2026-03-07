// src/app/api/agent/feedback/route.ts
// Feedback Agent — generates detailed performance analysis after test
// Firestore is optional — feedback is always returned via AI
import { NextRequest, NextResponse } from "next/server";
import { textModel } from "@/lib/gemini";
import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { testId, subjectName, testResults } = await req.json();

    const prompt = `You are an expert educational coach. Analyse this student's test performance and provide detailed constructive feedback.

Subject: ${subjectName}
Test Results: ${JSON.stringify(testResults, null, 2)}

Return ONLY valid JSON in this exact format:
{
  "summary": "2-3 sentence overall assessment",
  "percentage": 75,
  "grade": "B+",
  "topicAnalysis": [
    {
      "topic": "Topic Name",
      "score": 80,
      "status": "strong",
      "recommendation": "What to do next with this topic"
    }
  ],
  "strengths": [
    { "area": "Area name", "description": "Why this is a strength" }
  ],
  "improvements": [
    {
      "area": "Area name",
      "description": "What needs work",
      "tips": ["Specific tip 1", "Specific tip 2"]
    }
  ],
  "studyRecommendations": [
    {
      "priority": "high",
      "topic": "Topic name",
      "action": "Specific action to take",
      "resources": ["Resource suggestion"]
    }
  ],
  "nextSteps": "What the student should focus on in the next week"
}

topic status: "strong" (>= 80%), "moderate" (50-79%), "weak" (<50%)
grade: standard letter grade A+/A/B+/B/C+/C/D/F
Be encouraging but honest.`;

    const result = await textModel.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const feedback = JSON.parse(jsonText);

    // Save to Firestore — optional
    try {
      const db = adminDb();
      if (db && testId) {
        const { FieldValue } = await import("firebase-admin/firestore");
        await db.collection("testResults").doc(testId).set(
          { feedback, feedbackGeneratedAt: FieldValue.serverTimestamp() },
          { merge: true }
        );
      }
    } catch (dbErr) {
      console.warn("Firestore write skipped (non-fatal):", dbErr);
    }

    return NextResponse.json({ feedback });
  } catch (err) {
    console.error("Feedback agent error:", err);
    return NextResponse.json({ error: "Failed to generate feedback" }, { status: 500 });
  }
}
