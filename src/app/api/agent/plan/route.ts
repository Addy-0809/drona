// src/app/api/agent/plan/route.ts
// Planning Agent — generates a 4-week study plan using Gemini
// Firestore caching is optional — app works without Admin SDK
import { NextRequest, NextResponse } from "next/server";
import { textModel } from "@/lib/gemini";
import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subjectId, subjectName } = await req.json();

    // Try to load cached plan from Firestore (optional)
    try {
      const db = adminDb();
      if (db) {
        const existingPlan = await db
          .collection("weeklyPlans")
          .where("userId", "==", session.user.id)
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
          userId: session.user.id,
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
    console.error("Planning agent error:", err);
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}
