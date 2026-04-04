// src/app/api/profile/route.ts
// Profile API — aggregates progress + test history from Firestore
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    await headers();

    // Wrap auth() in its own try/catch — if it throws (e.g. token mis-match,
    // middleware timeout) we return a clean 401 instead of a 500 that the
    // profile page displays as "Try Again".
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let session: any;
    try {
      session = await auth();
    } catch (authErr) {
      console.warn("[profile] auth() threw — returning 401:", authErr);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session?.user?.id ?? session?.user?.email;
    const userEmail = session?.user?.email;
    if (!userId || !userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = adminDb();
    if (!db) {
      // Return empty profile rather than crashing
      return NextResponse.json({ progress: {}, tests: [] });
    }

    const safeEmail = userEmail.replace(/[^a-zA-Z0-9]/g, "_");

    // ── 1. All subject progress docs (same proven query pattern as /api/progress) ──
    const progressSnap = await db
      .collection("progress")
      .where("__name__", ">=", safeEmail + "_")
      .where("__name__", "<", safeEmail + "_\uf8ff")
      .get();

    const progress: Record<string, {
      completedTopics: string[];
      totalStudied: number;
      subjectName: string | null;
      updatedAt: string | null;
      plan: unknown;
      totalTopicsInPlan: number;
      currentWeek: number;
    }> = {};

    progressSnap.docs.forEach((doc) => {
      const d = doc.data();
      const sid = d.subjectId as string;
      if (!sid) return;

      // Count total topics in plan
      let totalTopicsInPlan = 0;
      if (d.plan?.weeks) {
        for (const w of d.plan.weeks) {
          totalTopicsInPlan += (w.topics?.length || 0);
        }
      }

      // Determine current week
      let currentWeek = 1;
      const completedIds: string[] = d.completedTopicIds || [];
      if (d.plan?.weeks && completedIds.length > 0) {
        const completedSet = new Set(completedIds);
        for (const w of d.plan.weeks) {
          const weekIds = (w.topics || []).map((t: { id: string }) => t.id);
          const weekDone = weekIds.length > 0 && weekIds.every((id: string) => completedSet.has(id));
          if (weekDone) currentWeek = (w.weekNumber as number) + 1;
        }
        if (d.plan?.totalWeeks) currentWeek = Math.min(currentWeek, d.plan.totalWeeks as number);
      }

      progress[sid] = {
        completedTopics: d.completedTopics || [],
        totalStudied: (d.completedTopics || []).length,
        subjectName: d.subjectName || null,
        updatedAt: d.updatedAt || null,
        plan: d.plan || null,
        totalTopicsInPlan,
        currentWeek,
      };
    });

    // ── 2. Test records — simple where query, no orderBy (avoids missing composite index) ──
    let tests: Array<{
      testId: string;
      subjectId: string | null;
      subjectName: string | null;
      createdAt: string | null;
      topicsCount: number;
      totalMarks: number;
      weekNumber: number | null;
      hasFeedback: boolean;
      score: number | null;
      percentage: number | null;
      grade: string | null;
    }> = [];

    try {
      const testsSnap = await db
        .collection("tests")
        .where("userId", "==", userId)
        .limit(50)
        .get();

      // ── 3. Fetch feedback scores (batch, no index needed) ──
      const testIds = testsSnap.docs.map((d) => d.id);
      const feedbackMap: Record<string, { percentage?: number; grade?: string }> = {};

      if (testIds.length > 0) {
        // Chunk into ≤30 for Firestore `in` limit
        for (let i = 0; i < testIds.length; i += 30) {
          const chunk = testIds.slice(i, i + 30);
          try {
            const fbSnap = await db
              .collection("testResults")
              .where("__name__", "in", chunk)
              .get();
            fbSnap.docs.forEach((doc) => {
              const fb = doc.data()?.feedback;
              if (fb) feedbackMap[doc.id] = { percentage: fb.percentage, grade: fb.grade };
            });
          } catch {
            // Non-fatal — feedback collection may not exist yet
          }
        }
      }

      tests = testsSnap.docs.map((doc) => {
        const d = doc.data();
        const fb = feedbackMap[doc.id];
        const weekMatch = (d.test?.title as string | undefined)?.match(/week\s*(\d+)/i);
        const weekNumber = weekMatch ? parseInt(weekMatch[1]) : null;
        // createdAt may be a Firestore Timestamp or ISO string
        const createdAtRaw = d.createdAt;
        let createdAt: string | null = null;
        if (createdAtRaw?.toDate) {
          createdAt = (createdAtRaw.toDate() as Date).toISOString();
        } else if (typeof createdAtRaw === "string") {
          createdAt = createdAtRaw;
        }

        return {
          testId: doc.id,
          subjectId: d.subjectId || null,
          subjectName: d.subjectName || null,
          createdAt,
          topicsCount: (d.completedTopics || []).length,
          totalMarks: d.test?.totalMarks || 50,
          weekNumber,
          hasFeedback: !!fb,
          score: fb?.percentage ?? null,
          percentage: fb?.percentage ?? null,
          grade: fb?.grade ?? null,
        };
      });

      // Sort by createdAt desc in JS (avoids composite index requirement)
      tests.sort((a, b) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.localeCompare(a.createdAt);
      });
    } catch (testErr) {
      // If tests collection doesn't exist yet, just return empty
      console.warn("[profile] tests query failed (non-fatal):", testErr);
    }

    return NextResponse.json({ progress, tests });
  } catch (err) {
    console.error("[profile] GET Error:", err);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
