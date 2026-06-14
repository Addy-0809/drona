// src/app/api/agent/plan/route.ts
// Planning Agent — generates a 4-week study plan using LangGraph + LangChain
// Uses LangGraph state graph for workflow orchestration and LangChain for LLM interaction
// Firestore caching is optional — app works without Admin SDK
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { planGraph } from "@/lib/langgraph";
import { getStaticPlan } from "@/lib/static-plans";

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

    // 1) Serve the pre-generated static plan — identical for every user.
    // No LLM call, no DB dependency: instant and Vercel-safe. This is the
    // primary path; the Firestore + LLM branches below are fallbacks only
    // for a subject that hasn't been seeded yet (run `npm run seed:plans`).
    const staticPlan = getStaticPlan(subjectId);
    if (staticPlan) {
      return NextResponse.json({ plan: staticPlan, planId: subjectId, cached: true, source: "static" });
    }

    // 2) Try to load shared plan from Firestore — same plan for all users
    try {
      const db = adminDb();
      if (db) {
        const sharedPlan = await db.collection("subjectPlans").doc(subjectId).get();
        if (sharedPlan.exists) {
          return NextResponse.json({ plan: sharedPlan.data()!.plan, cached: true });
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

    // Save shared plan to Firestore keyed by subjectId — one plan for all users
    let planId = `local-${subjectId}`;
    try {
      const db = adminDb();
      if (db) {
        const { FieldValue } = await import("firebase-admin/firestore");
        await db.collection("subjectPlans").doc(subjectId).set({
          subjectId,
          subjectName,
          plan,
          createdAt: FieldValue.serverTimestamp(),
        });
        planId = subjectId;
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
