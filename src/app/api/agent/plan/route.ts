// src/app/api/agent/plan/route.ts
// Planning Agent — generates a 4-week study plan using LangGraph + LangChain
// Uses LangGraph state graph for workflow orchestration and LangChain for LLM interaction
// Firestore caching is optional — app works without Admin SDK
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { planGraph } from "@/lib/langgraph";

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

    // ── LangGraph execution ──────────────────────────────────────────────
    // Invoke the plan agent graph with the subject details
    console.log("[plan] Invoking LangGraph plan agent for:", subjectName);
    const graphResult = await planGraph.invoke({
      subjectName,
      subjectId,
      userId,
      completedTopics: [],
    });

    if (graphResult.error) {
      throw new Error(graphResult.error);
    }

    const plan = graphResult.plan;
    if (!plan) {
      throw new Error("LangGraph plan agent returned no plan data");
    }

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
    // Surface specific Drona errors for debugging
    const userMsg = errMsg.includes("429") || errMsg.includes("quota")
      ? "Drona API quota exceeded — please wait a minute and try again, or check your API key billing."
      : errMsg.includes("404") || errMsg.includes("not found")
      ? "Drona AI model not found — the model may have been deprecated."
      : `Failed to generate plan: ${errMsg}`;
    return NextResponse.json({ error: userMsg }, { status: 500 });
  }
}
