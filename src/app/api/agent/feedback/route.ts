// src/app/api/agent/feedback/route.ts
// Feedback Agent — generates detailed performance analysis after test
// Uses LangGraph state graph for workflow orchestration and LangChain for LLM interaction
// Firestore is optional — feedback is always returned via AI
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { feedbackGraph } from "@/lib/langgraph";

export async function POST(req: NextRequest) {
  try {
    await headers();
    const session = await auth();
    console.log("[feedback] session resolved:", JSON.stringify({ hasSession: !!session, userId: session?.user?.id, email: session?.user?.email }));
    const userId = session?.user?.id ?? session?.user?.email;
    if (!userId) {
      console.error("[feedback] Unauthorized — no user ID or email in session");
      return NextResponse.json({ error: "Unauthorized — please sign in again" }, { status: 401 });
    }

    const { testId, subjectName, testResults } = await req.json();

    // ── LangGraph execution ──────────────────────────────────────────────
    // Invoke the feedback agent graph with test results
    console.log("[feedback] Invoking LangGraph feedback agent for:", subjectName);
    const graphResult = await feedbackGraph.invoke({
      subjectName,
      subjectId: "",
      userId,
      completedTopics: [],
      testResults,
    });

    if (graphResult.error) {
      throw new Error(graphResult.error);
    }

    const feedback = graphResult.feedback;
    if (!feedback) {
      throw new Error("LangGraph feedback agent returned no feedback data");
    }

    // Save to Firestore — optional
    try {
      const db = adminDb();
      if (db && testId) {
        const { FieldValue, Timestamp } = await import("firebase-admin/firestore");
        const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
        await db.collection("testResults").doc(testId).set(
          { feedback, feedbackGeneratedAt: FieldValue.serverTimestamp(), expiresAt: Timestamp.fromDate(new Date(Date.now() + SIXTY_DAYS_MS)) },
          { merge: true }
        );
      }
    } catch (dbErr) {
      console.warn("Firestore write skipped (non-fatal):", dbErr);
    }

    return NextResponse.json({ feedback });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("Feedback agent error:", errMsg);
    const userMsg = errMsg.includes("429") || errMsg.includes("quota")
      ? "Drona API quota exceeded — please wait a minute and try again."
      : errMsg.includes("404") || errMsg.includes("not found")
      ? "Drona AI model not found — the model may have been deprecated."
      : `Failed to generate feedback: ${errMsg}`;
    return NextResponse.json({ error: userMsg }, { status: 500 });
  }
}
