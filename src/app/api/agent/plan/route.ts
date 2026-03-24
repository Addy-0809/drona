// src/app/api/agent/plan/route.ts
// Planning Agent — generates a 4-week study plan using Gemini
// Firestore caching is optional — app works without Admin SDK
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { textModel } from "@/lib/gemini";
import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    // Auth.js v5: ensure cookie context is available for session resolution
    await headers();
    const session = await auth();
    console.log("[plan] session resolved:", JSON.stringify({ hasSession: !!session, userId: session?.user?.id, email: session?.user?.email }));
    const userId = session?.user?.id ?? session?.user?.email;
    if (!userId) {
      console.error("[plan] Unauthorized — no user ID or email in session");
      return NextResponse.json({ error: "Unauthorized — please sign in again" }, { status: 401 });
    }

    const { subjectId, subjectName } = await req.json();

    // Try to load cached plan from Firestore (optional)
    try {
      const db = adminDb();
      if (db) {
        const existingPlan = await db
          .collection("weeklyPlans")
          .where("userId", "==", userId)
          .where("subjectId", "==", subjectId)
          .limit(1)
          .get();
        if (!existingPlan.empty) {
          return NextResponse.json({ plan: existingPlan.docs[0].data().plan, cached: true });
        }
      }
    } catch (dbErr) {
      console.warn("Firestore read skipped:", dbErr);
    }

    const prompt = `You are an expert academic tutor. Create a detailed 4-week study plan for a university student learning "${subjectName}".

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "subject": "${subjectName}",
  "totalWeeks": 4,
  "weeks": [
    {
      "weekNumber": 1,
      "title": "Week title here",
      "goal": "What student will achieve this week",
      "topics": [
        {
          "id": "topic-id-slug",
          "name": "Topic Name",
          "description": "Brief description of the topic",
          "estimatedHours": 2,
          "day": 1
        }
      ]
    }
  ]
}

Requirements:
- 4 weeks total, each with 5-7 topics
- Topics from beginner → advanced progressively
- estimatedHours between 1 and 4
- day between 1 and 7 (spread across the week)
- topic IDs must be lowercase with hyphens (slugs)
- Make it realistic for a university student`;

    const result = await textModel.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const plan = JSON.parse(jsonText);

    // Try to save to Firestore (optional — works without it)
    let planId = `local-${Date.now()}`;
    try {
      const db = adminDb();
      if (db) {
        const { FieldValue } = await import("firebase-admin/firestore");
        const planRef = db.collection("weeklyPlans").doc();
        await planRef.set({
          id: planRef.id,
          userId,
          subjectId,
          subjectName,
          plan,
          createdAt: FieldValue.serverTimestamp(),
          completedTopics: [],
        });
        planId = planRef.id;
      }
    } catch (dbErr) {
      console.warn("Firestore write skipped (non-fatal):", dbErr);
    }

    return NextResponse.json({ plan, planId, cached: false });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("Planning agent error:", errMsg);
    // Surface specific Gemini errors for debugging
    const userMsg = errMsg.includes("429") || errMsg.includes("quota")
      ? "Gemini API quota exceeded — please wait a minute and try again, or check your API key billing."
      : errMsg.includes("404") || errMsg.includes("not found")
      ? "Gemini model not found — the model may have been deprecated."
      : `Failed to generate plan: ${errMsg}`;
    return NextResponse.json({ error: userMsg }, { status: 500 });
  }
}
