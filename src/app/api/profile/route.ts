// src/app/api/profile/route.ts
// Profile API — aggregates progress + test history from Firestore
// Queries both "progress" and "weeklyPlans" collections for study data,
// and "tests" + "testResults" for test history.
// Uses Admin SDK as fast-path; falls back to Firestore REST API.
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

const PROJECT_ID =
  process.env.FIREBASE_ADMIN_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  "";

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
// API key added to REST calls so Firebase rules can evaluate authenticated requests
const KEY_PARAM = FIREBASE_API_KEY ? `?key=${FIREBASE_API_KEY}` : "";

// ─── Firestore REST helpers ────────────────────────────────────────────────

/** Convert a Firestore REST value to a plain JS value */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRestValue(v: any): any {
  if (!v) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return parseInt(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue; // ISO string
  if ("arrayValue" in v)
    return (v.arrayValue.values || []).map(fromRestValue);
  if ("mapValue" in v) {
    const fields = v.mapValue.fields || {};
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(fields)) out[k] = fromRestValue(fields[k]);
    return out;
  }
  return null;
}

/** Convert a Firestore REST document fields object to a plain JS object */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRestDoc(fields: Record<string, any>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(fields)) out[k] = fromRestValue(fields[k]);
  return out;
}

/** Run a Firestore structured query via REST (no auth needed for rules-free collections) */
async function runQuery(
  collectionId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Array<{ id: string; data: Record<string, unknown> }>> {
  const url = `${FIRESTORE_BASE}:runQuery${KEY_PARAM}`;
  const body = {
    structuredQuery: {
      from: [{ collectionId }],
      where:
        filters.length === 1
          ? filters[0]
          : { compositeFilter: { op: "AND", filters } },
      limit: 100,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Firestore REST query failed (${res.status}): ${txt}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows
    .filter((r: any) => r.document)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((r: any) => ({
      id: r.document.name.split("/").pop() as string,
      data: fromRestDoc(r.document.fields || {}),
    }));
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function buildProgressFromDocs(
  progressDocs: Array<{ id: string; data: Record<string, unknown> }>,
  planDocs: Array<{ id: string; data: Record<string, unknown> }>
) {
  const progress: Record<
    string,
    {
      completedTopics: string[];
      totalStudied: number;
      subjectName: string | null;
      updatedAt: string | null;
      plan: unknown;
      totalTopicsInPlan: number;
      currentWeek: number;
    }
  > = {};

  // First, populate from the progress collection
  for (const { data: d } of progressDocs) {
    const sid = d.subjectId as string;
    if (!sid) continue;

    // Count total topics in plan
    let totalTopicsInPlan = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plan = d.plan as any;
    if (plan?.weeks) {
      for (const w of plan.weeks as Array<{ topics?: unknown[] }>) {
        totalTopicsInPlan += w.topics?.length || 0;
      }
    }

    // Determine current week from completed topic IDs
    let currentWeek = 1;
    const completedIds: string[] = (d.completedTopicIds as string[]) || [];
    if (plan?.weeks && completedIds.length > 0) {
      const completedSet = new Set(completedIds);
      for (const w of plan.weeks as Array<{
        weekNumber: number;
        topics?: Array<{ id: string }>;
      }>) {
        const weekIds = (w.topics || []).map((t) => t.id);
        const weekDone =
          weekIds.length > 0 && weekIds.every((id) => completedSet.has(id));
        if (weekDone) currentWeek = w.weekNumber + 1;
      }
      if (plan?.totalWeeks)
        currentWeek = Math.min(currentWeek, plan.totalWeeks as number);
    }

    progress[sid] = {
      completedTopics: (d.completedTopics as string[]) || [],
      totalStudied: ((d.completedTopics as string[]) || []).length,
      subjectName: (d.subjectName as string) || null,
      updatedAt: (d.updatedAt as string) || null,
      plan: d.plan || null,
      totalTopicsInPlan,
      currentWeek,
    };
  }

  // Then, merge from weeklyPlans collection (may have plans not in progress)
  for (const { data: d } of planDocs) {
    const sid = d.subjectId as string;
    if (!sid) continue;

    // If already in progress from the progress collection, merge plan data if missing
    if (progress[sid]) {
      if (!progress[sid].plan && d.plan) {
        progress[sid].plan = d.plan;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const plan = d.plan as any;
        let totalTopics = 0;
        if (plan?.weeks) {
          for (const w of plan.weeks as Array<{ topics?: unknown[] }>) {
            totalTopics += w.topics?.length || 0;
          }
        }
        progress[sid].totalTopicsInPlan = totalTopics;
      }
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plan = d.plan as any;
    let totalTopicsInPlan = 0;
    if (plan?.weeks) {
      for (const w of plan.weeks as Array<{ topics?: unknown[] }>) {
        totalTopicsInPlan += w.topics?.length || 0;
      }
    }

    const completedTopics: string[] = (d.completedTopics as string[]) || [];

    // Determine current week
    let currentWeek = 1;
    if (plan?.weeks && completedTopics.length > 0) {
      const completedSet = new Set(completedTopics);
      for (const w of plan.weeks as Array<{
        weekNumber: number;
        topics?: Array<{ id: string }>;
      }>) {
        const weekIds = (w.topics || []).map((t) => t.id);
        const weekDone =
          weekIds.length > 0 && weekIds.every((id) => completedSet.has(id));
        if (weekDone) currentWeek = w.weekNumber + 1;
      }
      if (plan?.totalWeeks)
        currentWeek = Math.min(currentWeek, plan.totalWeeks as number);
    }

    // Extract a createdAt for updatedAt
    let updatedAt: string | null = null;
    const createdAtRaw = d.createdAt;
    if (typeof createdAtRaw === "string") {
      updatedAt = createdAtRaw;
    } else if (createdAtRaw && typeof (createdAtRaw as { toDate?: () => Date }).toDate === "function") {
      updatedAt = (createdAtRaw as { toDate: () => Date }).toDate().toISOString();
    } else if (createdAtRaw && typeof (createdAtRaw as { seconds?: number }).seconds === "number") {
      updatedAt = new Date((createdAtRaw as { seconds: number }).seconds * 1000).toISOString();
    }

    progress[sid] = {
      completedTopics,
      totalStudied: completedTopics.length,
      subjectName: (d.subjectName as string) || null,
      updatedAt,
      plan: d.plan || null,
      totalTopicsInPlan,
      currentWeek,
    };
  }

  return progress;
}

// Derive letter grade from percentage (grade route doesn't compute this)
function calcGrade(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildTestsFromDocs(docs: Array<{ id: string; data: Record<string, unknown> }>, feedbackMap: Record<string, { percentage?: number; grade?: string }>) {
  return docs.map(({ id: docId, data: d }) => {
    const fb = feedbackMap[docId];
    const title = (d.test as { title?: string } | undefined)?.title ?? "";
    const weekMatch = title.match(/week\s*(\d+)/i);
    const weekNumber = weekMatch ? parseInt(weekMatch[1]) : null;

    // createdAt can be a Firestore Timestamp (Admin SDK) or ISO string (REST)
    const createdAtRaw = d.createdAt;
    let createdAt: string | null = null;
    if (typeof createdAtRaw === "string") {
      createdAt = createdAtRaw;
    } else if (createdAtRaw && typeof (createdAtRaw as { toDate?: () => Date }).toDate === "function") {
      createdAt = (createdAtRaw as { toDate: () => Date }).toDate().toISOString();
    } else if (createdAtRaw && typeof (createdAtRaw as { seconds?: number }).seconds === "number") {
      createdAt = new Date((createdAtRaw as { seconds: number }).seconds * 1000).toISOString();
    }

    const pct = fb?.percentage ?? null;
    const grade = fb?.grade ?? (pct !== null ? calcGrade(pct) : null);
    return {
      testId: docId,
      subjectId: (d.subjectId as string) || null,
      subjectName: (d.subjectName as string) || null,
      createdAt,
      topicsCount: ((d.completedTopics as string[]) || []).length,
      totalMarks: (d.test as { totalMarks?: number } | undefined)?.totalMarks ?? 50,
      weekNumber,
      hasFeedback: !!fb,
      score: pct,
      percentage: pct,
      grade,
    };
  });
}

// ─── Route handler ─────────────────────────────────────────────────────────

export async function GET() {
  try {
    await headers();

    let session;
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

    const safeEmail = userEmail.replace(/[^a-zA-Z0-9]/g, "_");

    // ── Try Admin SDK path first (fastest, works when credentials are available) ──
    const db = adminDb();
    if (db) {
      try {
        // Query all relevant collections in parallel
        const [progressSnap, plansSnap, testsSnap] = await Promise.all([
          db
            .collection("progress")
            .where("__name__", ">=", safeEmail + "_")
            .where("__name__", "<", safeEmail + "_\uf8ff")
            .get(),
          db
            .collection("weeklyPlans")
            .where("userId", "==", userId)
            .limit(50)
            .get(),
          db.collection("tests").where("userId", "==", userId).limit(50).get(),
        ]);

        // Build feedbackMap from testResults
        const testIds = testsSnap.docs.map((d) => d.id);
        const feedbackMap: Record<string, { percentage?: number; grade?: string }> = {};
        if (testIds.length > 0) {
          for (let i = 0; i < testIds.length; i += 30) {
            const chunk = testIds.slice(i, i + 30);
            try {
              const fbSnap = await db
                .collection("testResults")
                .where("__name__", "in", chunk)
                .get();
              fbSnap.docs.forEach((doc) => {
                // Grade route saves results under 'grading', not 'feedback'
                const g = doc.data()?.grading as { percentage?: number } | undefined;
                const f = doc.data()?.feedback as { percentage?: number; grade?: string } | undefined;
                if (g?.percentage !== undefined) {
                  feedbackMap[doc.id] = { percentage: g.percentage };
                } else if (f?.percentage !== undefined) {
                  feedbackMap[doc.id] = { percentage: f.percentage, grade: f.grade };
                }
              });
            } catch { /* non-fatal */ }
          }
        }

        const progressDocs = progressSnap.docs.map((doc) => ({ id: doc.id, data: doc.data() as Record<string, unknown> }));
        const planDocs = plansSnap.docs.map((doc) => ({ id: doc.id, data: doc.data() as Record<string, unknown> }));
        const testDocs = testsSnap.docs.map((doc) => ({ id: doc.id, data: doc.data() as Record<string, unknown> }));

        const progress = buildProgressFromDocs(progressDocs, planDocs);
        let tests = buildTestsFromDocs(testDocs, feedbackMap);
        tests.sort((a, b) => {
          if (!a.createdAt && !b.createdAt) return 0;
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return b.createdAt.localeCompare(a.createdAt);
        });

        console.log("[profile] Served via Admin SDK — progress:", Object.keys(progress).length, "subjects, tests:", tests.length);
        return NextResponse.json({ progress, tests });
      } catch (adminErr) {
        // Admin SDK failed (likely no credentials) — fall through to REST
        console.warn("[profile] Admin SDK failed, falling back to REST:", (adminErr as Error).message);
      }
    }

    // ── Firestore REST API fallback (works with project ID only, no service account) ──
    if (!PROJECT_ID) {
      console.warn("[profile] No Firebase project ID — returning empty profile");
      return NextResponse.json({ progress: {}, tests: [] });
    }

    try {
      // 1. Progress docs — query by userId field
      let progressDocs: Array<{ id: string; data: Record<string, unknown> }> = [];
      try {
        progressDocs = await runQuery("progress", [
          {
            fieldFilter: {
              field: { fieldPath: "userId" },
              op: "EQUAL",
              value: { stringValue: userId },
            },
          },
        ]);
      } catch (e) {
        console.warn("[profile] REST progress query failed:", (e as Error).message);
      }

      // 2. Weekly plans — query by userId
      let planDocs: Array<{ id: string; data: Record<string, unknown> }> = [];
      try {
        planDocs = await runQuery("weeklyPlans", [
          {
            fieldFilter: {
              field: { fieldPath: "userId" },
              op: "EQUAL",
              value: { stringValue: userId },
            },
          },
        ]);
      } catch (e) {
        console.warn("[profile] REST weeklyPlans query failed:", (e as Error).message);
      }

      // 3. Test docs
      let testDocs: Array<{ id: string; data: Record<string, unknown> }> = [];
      try {
        testDocs = await runQuery("tests", [
          {
            fieldFilter: {
              field: { fieldPath: "userId" },
              op: "EQUAL",
              value: { stringValue: userId },
            },
          },
        ]);
      } catch (e) {
        console.warn("[profile] REST tests query failed:", (e as Error).message);
      }

      // 4. Feedback (best-effort per-test lookup)
      const feedbackMap: Record<string, { percentage?: number; grade?: string }> = {};
      if (testDocs.length > 0) {
        const fbPromises = testDocs.slice(0, 30).map(async ({ id }) => {
          try {
            const url = `${FIRESTORE_BASE}/testResults/${id}${KEY_PARAM}`;
            const r = await fetch(url, { cache: "no-store" });
            if (!r.ok) return;
            const doc = await r.json();
            const data = fromRestDoc(doc.fields || {});
            // Grade route saves under 'grading' field
            const g = data?.grading as { percentage?: number } | undefined;
            const f = data?.feedback as { percentage?: number; grade?: string } | undefined;
            if (g?.percentage !== undefined) {
              feedbackMap[id] = { percentage: g.percentage as number };
            } else if (f?.percentage !== undefined) {
              feedbackMap[id] = { percentage: f.percentage as number, grade: f.grade as string };
            }
          } catch { /* non-fatal */ }
        });
        await Promise.allSettled(fbPromises);
      }

      const progress = buildProgressFromDocs(progressDocs, planDocs);
      let tests = buildTestsFromDocs(testDocs, feedbackMap);

      tests.sort((a, b) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.localeCompare(a.createdAt);
      });

      console.log("[profile] Served via REST — progress:", Object.keys(progress).length, "subjects, tests:", tests.length);
      return NextResponse.json({ progress, tests });
    } catch (restErr) {
      console.error("[profile] REST API also failed:", restErr);
      // Last resort — return empty profile so the page renders instead of erroring
      return NextResponse.json({ progress: {}, tests: [] });
    }
  } catch (err) {
    console.error("[profile] GET Error:", err);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
