// src/lib/profile-client.ts
// Client-side Firestore queries for profile data (bypasses broken Admin SDK)
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, limit } from "firebase/firestore";

export interface TestRecord {
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
}

export interface SubjectProgress {
  completedTopics: string[];
  totalStudied: number;
  subjectName: string | null;
  updatedAt: string | null;
  totalTopicsInPlan: number;
  currentWeek: number;
}

function calcGrade(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
}

export async function fetchProfileData(userId: string, userEmail: string) {
  const progress: Record<string, SubjectProgress> = {};
  const tests: TestRecord[] = [];

  // 1. Query tests by userId, fallback to email
  let testsSnap = await getDocs(query(collection(db, "tests"), where("userId", "==", userId), limit(50)));
  if (testsSnap.empty && userId !== userEmail) {
    testsSnap = await getDocs(query(collection(db, "tests"), where("userId", "==", userEmail), limit(50)));
  }

  // 2. Get test results for scores
  const feedbackMap: Record<string, { percentage?: number; grade?: string }> = {};
  const testIds = testsSnap.docs.map(d => d.id);
  for (const tid of testIds) {
    try {
      const trSnap = await getDoc(doc(db, "testResults", tid));
      if (trSnap.exists()) {
        const data = trSnap.data();
        const g = data?.grading as { percentage?: number } | undefined;
        const f = data?.feedback as { percentage?: number; grade?: string } | undefined;
        if (g?.percentage !== undefined) {
          feedbackMap[tid] = { percentage: g.percentage };
        } else if (f?.percentage !== undefined) {
          feedbackMap[tid] = { percentage: f.percentage, grade: f.grade };
        }
      }
    } catch { /* non-fatal */ }
  }

  // 3. Build test records
  for (const docSnap of testsSnap.docs) {
    const d = docSnap.data();
    const fb = feedbackMap[docSnap.id];
    const title = (d.test as { title?: string })?.title ?? "";
    const weekMatch = title.match(/week\s*(\d+)/i);

    let createdAt: string | null = null;
    if (d.createdAt?.toDate) createdAt = d.createdAt.toDate().toISOString();
    else if (typeof d.createdAt === "string") createdAt = d.createdAt;

    const pct = fb?.percentage ?? null;
    const grade = fb?.grade ?? (pct !== null ? calcGrade(pct) : null);

    tests.push({
      testId: docSnap.id,
      subjectId: d.subjectId || null,
      subjectName: d.subjectName || null,
      createdAt,
      topicsCount: (d.completedTopics || []).length,
      totalMarks: d.test?.totalMarks ?? 50,
      weekNumber: weekMatch ? parseInt(weekMatch[1]) : null,
      hasFeedback: !!fb,
      score: pct,
      percentage: pct,
      grade,
    });
  }

  tests.sort((a, b) => {
    if (!a.createdAt && !b.createdAt) return 0;
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  // 4. Query progress + weekly plans
  let progressSnap = await getDocs(query(collection(db, "progress"), where("userId", "==", userId), limit(50)));
  if (progressSnap.empty && userId !== userEmail) {
    progressSnap = await getDocs(query(collection(db, "progress"), where("userId", "==", userEmail), limit(50)));
  }

  let plansSnap = await getDocs(query(collection(db, "weeklyPlans"), where("userId", "==", userId), limit(50)));
  if (plansSnap.empty && userId !== userEmail) {
    plansSnap = await getDocs(query(collection(db, "weeklyPlans"), where("userId", "==", userEmail), limit(50)));
  }

  // Build progress from docs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allDocs = [...progressSnap.docs, ...plansSnap.docs];
  for (const docSnap of allDocs) {
    const d = docSnap.data();
    const sid = d.subjectId as string;
    if (!sid || progress[sid]) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plan = d.plan as any;
    let totalTopicsInPlan = 0;
    if (plan?.weeks) {
      for (const w of plan.weeks) totalTopicsInPlan += w.topics?.length || 0;
    }

    const completedTopics: string[] = d.completedTopics || d.completedTopicIds || [];
    let currentWeek = 1;
    if (plan?.weeks && completedTopics.length > 0) {
      const completedSet = new Set(completedTopics);
      for (const w of plan.weeks) {
        const weekIds = (w.topics || []).map((t: { id: string }) => t.id);
        if (weekIds.length > 0 && weekIds.every((id: string) => completedSet.has(id))) {
          currentWeek = w.weekNumber + 1;
        }
      }
      if (plan.totalWeeks) currentWeek = Math.min(currentWeek, plan.totalWeeks);
    }

    let updatedAt: string | null = null;
    if (d.updatedAt?.toDate) updatedAt = d.updatedAt.toDate().toISOString();
    else if (d.createdAt?.toDate) updatedAt = d.createdAt.toDate().toISOString();

    progress[sid] = {
      completedTopics,
      totalStudied: completedTopics.length,
      subjectName: d.subjectName || null,
      updatedAt,
      totalTopicsInPlan,
      currentWeek,
    };
  }

  return { progress, tests };
}
