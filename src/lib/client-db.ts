// src/lib/client-db.ts
// Client-side Firestore reads/writes, authenticated via Firebase Auth.
//
// The Firestore Admin SDK on the server has no service-account credentials, and
// the security rules block all unauthenticated access (REST reads/writes return
// 403). So all persistence runs here, on the client, as the signed-in Firebase
// user (see FirebaseAuthBridge). Reads mirror src/lib/profile-client.ts.
import { db, auth as fbAuth } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

/** Firestore doc-id-safe form of an email (matches the server's scheme). */
function safe(email: string): string {
  return email.replace(/[^a-zA-Z0-9]/g, "_");
}

/**
 * Resolve the current Firebase user, waiting briefly for the auth bridge to
 * finish signing in on first load. Returns null if sign-in never completes.
 */
export function ensureFirebaseAuth(timeoutMs = 6000): Promise<User | null> {
  if (fbAuth.currentUser) return Promise.resolve(fbAuth.currentUser);
  return new Promise((resolve) => {
    let done = false;
    const finish = (u: User | null) => {
      if (done) return;
      done = true;
      unsub();
      resolve(u);
    };
    const unsub = onAuthStateChanged(fbAuth, (u) => {
      if (u) finish(u);
    });
    setTimeout(() => finish(fbAuth.currentUser), timeoutMs);
  });
}

async function requireAuth(): Promise<User> {
  const user = await ensureFirebaseAuth();
  if (!user) {
    throw new Error(
      "Not signed in to Firebase — data could not be saved. Try signing out and back in."
    );
  }
  return user;
}

function tsToIso(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === "string") return v;
  if (typeof (v as { toDate?: () => Date }).toDate === "function") {
    return (v as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

// ── Progress ────────────────────────────────────────────────────────────────

export interface SaveProgressInput {
  subjectId: string;
  subjectName: string;
  completedTopics: string[];
  completedTopicIds: string[];
  userId: string;
  userEmail: string;
  plan?: unknown;
  planId?: string | null;
  topicNameMap?: Record<string, string>;
}

/** Write (merge) a subject's progress for the signed-in user. */
export async function saveProgressClient(input: SaveProgressInput): Promise<void> {
  await requireAuth();
  const docId = `${safe(input.userEmail)}_${input.subjectId}`;
  const payload: Record<string, unknown> = {
    subjectId: input.subjectId,
    subjectName: input.subjectName,
    completedTopics: input.completedTopics,
    completedTopicIds: input.completedTopicIds,
    userId: input.userId,
    userEmail: input.userEmail,
    updatedAt: serverTimestamp(),
    expiresAt: new Date(Date.now() + SIXTY_DAYS_MS).toISOString(),
  };
  if (input.plan) payload.plan = input.plan;
  if (input.planId) payload.planId = input.planId;
  if (input.topicNameMap) payload.topicNameMap = input.topicNameMap;

  await setDoc(doc(db, "progress", docId), payload, { merge: true });
}

export interface SubjectProgressDoc {
  completedTopics: string[];
  completedTopicIds: string[];
  topicNameMap: Record<string, string> | null;
  plan: unknown;
  planId: string | null;
  subjectName: string | null;
}

/** Read one subject's progress for the signed-in user, or null if none. */
export async function getSubjectProgressClient(
  userEmail: string,
  subjectId: string
): Promise<SubjectProgressDoc | null> {
  await requireAuth();
  const docId = `${safe(userEmail)}_${subjectId}`;
  const snap = await getDoc(doc(db, "progress", docId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    completedTopics: d.completedTopics || [],
    completedTopicIds: d.completedTopicIds || [],
    topicNameMap: d.topicNameMap || null,
    plan: d.plan || null,
    planId: d.planId || null,
    subjectName: d.subjectName || null,
  };
}

export interface AllSubjectProgress {
  completedTopics: string[];
  totalStudied: number;
  subjectName: string | null;
  updatedAt: string | null;
}

/** Read all subjects' progress for the dashboard. Keyed by subjectId. */
export async function getAllProgressClient(
  userId: string,
  userEmail: string
): Promise<Record<string, AllSubjectProgress>> {
  await requireAuth();
  let snap = await getDocs(
    query(collection(db, "progress"), where("userId", "==", userId), limit(50))
  );
  if (snap.empty && userId !== userEmail) {
    snap = await getDocs(
      query(collection(db, "progress"), where("userId", "==", userEmail), limit(50))
    );
  }
  const out: Record<string, AllSubjectProgress> = {};
  snap.docs.forEach((s) => {
    const d = s.data();
    const sid = d.subjectId as string;
    if (!sid) return;
    const completedTopics: string[] = d.completedTopics || [];
    out[sid] = {
      completedTopics,
      totalStudied: completedTopics.length,
      subjectName: d.subjectName || null,
      updatedAt: tsToIso(d.updatedAt) ?? tsToIso(d.createdAt),
    };
  });
  return out;
}

// ── Tests ─────────────────────────────────────────────────────────────────

export interface CreateTestInput {
  subjectId: string;
  subjectName: string;
  completedTopics: string[];
  test: unknown;
  userId: string;
  userEmail: string;
}

/** Create a `tests` doc for the signed-in user; returns the new doc id. */
export async function createTestClient(input: CreateTestInput): Promise<string> {
  await requireAuth();
  const ref = await addDoc(collection(db, "tests"), {
    subjectId: input.subjectId,
    subjectName: input.subjectName,
    completedTopics: input.completedTopics,
    test: input.test,
    userId: input.userId,
    userEmail: input.userEmail,
    status: "pending",
    createdAt: serverTimestamp(),
    expiresAt: new Date(Date.now() + SIXTY_DAYS_MS).toISOString(),
  });
  return ref.id;
}

export interface McqScoreInput {
  mcqScore: number;
  mcqMax: number;
  mcqCorrect: number;
  mcqTotal: number;
  userId: string;
  userEmail: string;
}

/** Persist MCQ scores onto the test's result doc (merged). */
export async function saveMcqScoreClient(testId: string, input: McqScoreInput): Promise<void> {
  await requireAuth();
  await setDoc(
    doc(db, "testResults", testId),
    {
      mcqScore: input.mcqScore,
      mcqMax: input.mcqMax,
      mcqCorrect: input.mcqCorrect,
      mcqTotal: input.mcqTotal,
      userId: input.userId,
      userEmail: input.userEmail,
    },
    { merge: true }
  );
}

/** Persist short-answer grading onto the test's result doc (merged). */
export async function saveGradingClient(
  testId: string,
  grading: unknown,
  owner: { userId: string; userEmail: string }
): Promise<void> {
  await requireAuth();
  await setDoc(
    doc(db, "testResults", testId),
    {
      grading,
      gradedAt: serverTimestamp(),
      status: "graded",
      userId: owner.userId,
      userEmail: owner.userEmail,
      expiresAt: new Date(Date.now() + SIXTY_DAYS_MS).toISOString(),
    },
    { merge: true }
  );
}
