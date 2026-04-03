// src/app/api/profile/route.ts
// Profile API — aggregates progress + test history from Firestore
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    await headers();
    const session = await auth();
    const userId = session?.user?.id ?? session?.user?.email;
    const userEmail = session?.user?.email;
    if (!userId || !userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = adminDb();
    if (!db) {
      return NextResponse.json({ progress: {}, tests: [] });
    }

    const safeEmail = userEmail.replace(/[^a-zA-Z0-9]/g, "_");

    // 1) All subject progress docs for this user
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
      plan: unknown | null;
      totalTopicsInPlan: number;
    }> = {};

    progressSnap.docs.forEach((doc) => {
      const d = doc.data();
      const sid = d.subjectId as string;
      if (!sid) return;

      // Count total topics in plan for percentage
      let totalTopicsInPlan = 0;
      if (d.plan?.weeks) {
        for (const w of d.plan.weeks) {
          totalTopicsInPlan += (w.topics?.length || 0);
        }
      }

      // Determine which week the student is currently on
      let currentWeek = 1;
      if (d.plan?.weeks && d.completedTopicIds?.length > 0) {
        const completedSet = new Set(d.completedTopicIds as string[]);
        for (const w of d.plan.weeks) {
          const weekIds = (w.topics || []).map((t: { id: string }) => t.id);
          const weekDone = weekIds.every((id: string) => completedSet.has(id));
          if (weekDone) currentWeek = w.weekNumber + 1;
        }
      }

      progress[sid] = {
        completedTopics: d.completedTopics || [],
        totalStudied: (d.completedTopics || []).length,
        subjectName: d.subjectName || null,
        updatedAt: d.updatedAt || null,
        plan: d.plan || null,
        totalTopicsInPlan,
      };
      // Add currentWeek separately to avoid type issues
      (progress[sid] as Record<string, unknown>).currentWeek = Math.min(
        currentWeek,
        d.plan?.totalWeeks || currentWeek
      );
    });

    // 2) All test records for this user (sorted desc by creation)
    const testsSnap = await db
      .collection("tests")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    // 3) Fetch feedback/scores for each test (batch)
    const testIds = testsSnap.docs.map((d) => d.id);
    const feedbackMap: Record<string, { score?: number; grade?: string; percentage?: number }> = {};

    if (testIds.length > 0) {
      // Firestore `in` is limited to 30 at a time
      const chunks = [];
      for (let i = 0; i < testIds.length; i += 30) {
        chunks.push(testIds.slice(i, i + 30));
      }
      for (const chunk of chunks) {
        try {
          const fbSnap = await db
            .collection("testResults")
            .where("__name__", "in", chunk)
            .get();
          fbSnap.docs.forEach((doc) => {
            const fb = doc.data().feedback;
            if (fb) {
              feedbackMap[doc.id] = {
                score: fb.percentage,
                percentage: fb.percentage,
                grade: fb.grade,
              };
            }
          });
        } catch {
          // Non-fatal — feedback may not exist
        }
      }
    }

    const tests = testsSnap.docs.map((doc) => {
      const d = doc.data();
      const fb = feedbackMap[doc.id];
      // Determine if this is a week test or full syllabus
      const weekMatch = d.test?.title?.match(/week\s*(\d+)/i);
      const weekNumber = weekMatch ? parseInt(weekMatch[1]) : null;

      return {
        testId: doc.id,
        subjectId: d.subjectId || null,
        subjectName: d.subjectName || null,
        createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
        topicsCount: (d.completedTopics || []).length,
        totalMarks: d.test?.totalMarks || 50,
        weekNumber,
        hasFeedback: !!fb,
        score: fb?.score ?? null,
        percentage: fb?.percentage ?? null,
        grade: fb?.grade ?? null,
      };
    });

    return NextResponse.json({ progress, tests });
  } catch (err) {
    console.error("[profile] GET Error:", err);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
