// src/app/api/agent/save-mcq-score/route.ts
// Saves MCQ scores to testResults collection so feedback page can access them
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    await headers();
    const session = await auth();
    const userId = session?.user?.id ?? session?.user?.email;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { testId, mcqScore, mcqMax, mcqCorrect, mcqTotal } = await req.json();
    if (!testId) {
      return NextResponse.json({ error: "testId required" }, { status: 400 });
    }

    const db = adminDb();
    if (db) {
      await db.collection("testResults").doc(testId).set(
        { mcqScore, mcqMax, mcqCorrect, mcqTotal, userId },
        { merge: true }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[save-mcq-score] error:", err);
    return NextResponse.json({ error: "Failed to save MCQ score" }, { status: 500 });
  }
}
