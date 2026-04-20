// src/app/api/agent/test/route.ts
// Examiner Agent — generates mock test questions from completed topics
// Uses LangGraph state graph for workflow orchestration and LangChain for LLM interaction
// Firestore is optional — test generation works without Admin SDK
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { testGraph } from "@/lib/langgraph";

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

    // Safety guard: topics must be provided (frontend always sends plan topics now)
    if (!completedTopics || completedTopics.length === 0) {
      return NextResponse.json(
        { error: "No topics available to generate a test. Please open the study plan first so a plan can be created." },
        { status: 400 }
      );
    }

    // ── LangGraph execution ──────────────────────────────────────────────
    // Invoke the test agent graph with subject and topic details
    console.log("[test] Invoking LangGraph test agent for:", subjectName);

    // Retry loop: try up to 2 times in case of JSON parse failure
    let test = null;
    let lastError = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const graphResult = await testGraph.invoke({
          subjectName,
          subjectId,
          userId,
          completedTopics,
        });

        if (graphResult.error) {
          throw new Error(graphResult.error);
        }

        test = graphResult.test;
        if (!test) {
          throw new Error("LangGraph test agent returned no test data");
        }
        break; // Parse succeeded
      } catch (parseErr) {
        lastError = parseErr instanceof Error ? parseErr.message : "Test generation failed";
        console.warn(`[test] Attempt ${attempt + 1} failed:`, lastError);
        if (attempt === 1) {
          throw new Error(`Failed to generate test after 2 attempts: ${lastError}`);
        }
      }
    }

    if (!test) {
      throw new Error("No test data generated");
    }

    // Save to Firestore — optional
    let testId = `local-${Date.now()}`;
    try {
      const db = adminDb();
      if (db) {
        const { FieldValue, Timestamp } = await import("firebase-admin/firestore");
        const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
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
          expiresAt: Timestamp.fromDate(new Date(Date.now() + SIXTY_DAYS_MS)),
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
      ? "Drona API quota exceeded — please wait a minute and try again."
      : errMsg.includes("404") || errMsg.includes("not found")
      ? "Drona AI model not found — the model may have been deprecated."
      : `Failed to generate test: ${errMsg}`;
    return NextResponse.json({ error: userMsg }, { status: 500 });
  }
}
