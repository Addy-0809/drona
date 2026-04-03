// src/app/api/progress/route.ts
// Progress API — reads and writes student progress via Firestore Admin SDK
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    await headers();
    const session = await auth();
    const userId = session?.user?.id ?? session?.user?.email;
    const userEmail = session?.user?.email;
    if (!userId || !userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subjectId = req.nextUrl.searchParams.get("subjectId");
    const db = adminDb();
    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const safeEmail = userEmail.replace(/[^a-zA-Z0-9]/g, "_");

    if (subjectId) {
      // Return progress for a single subject (include plan data for cache)
      const docId = `${safeEmail}_${subjectId}`;
      const snap = await db.collection("progress").doc(docId).get();
      if (!snap.exists) {
        return NextResponse.json({ completedTopics: [], subjectId });
      }
      const data = snap.data()!;
      return NextResponse.json({
        completedTopics: data.completedTopics || [],
        completedTopicIds: data.completedTopicIds || [],
        subjectId: data.subjectId || subjectId,
        subjectName: data.subjectName || null,
        updatedAt: data.updatedAt || null,
        plan: data.plan || null,
        planId: data.planId || null,
        topicNameMap: data.topicNameMap || null,
      });
    }

    // Return progress for ALL subjects
    const snapshot = await db
      .collection("progress")
      .where("__name__", ">=", safeEmail + "_")
      .where("__name__", "<", safeEmail + "_\uf8ff")
      .get();

    const progressMap: Record<string, { completedTopics: string[]; completedTopicIds: string[]; totalStudied: number; subjectName: string | null; updatedAt: string | null }> = {};
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const sid = data.subjectId as string;
      if (sid) {
        progressMap[sid] = {
          completedTopics: data.completedTopics || [],
          completedTopicIds: data.completedTopicIds || [],
          totalStudied: (data.completedTopics || []).length,
          subjectName: data.subjectName || null,
          updatedAt: data.updatedAt || null,
        };
      }
    });

    return NextResponse.json({ progress: progressMap });
  } catch (err) {
    console.error("[progress] GET Error:", err);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const body = await req.json();
    const { subjectId, subjectName, completedTopics, completedTopicIds, plan, planId, topicNameMap } = body;

    if (!subjectId) {
      return NextResponse.json({ error: "subjectId is required" }, { status: 400 });
    }

    const safeEmail = userEmail.replace(/[^a-zA-Z0-9]/g, "_");
    const docId = `${safeEmail}_${subjectId}`;

    const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
    const payload: Record<string, unknown> = {
      subjectId,
      subjectName: subjectName || subjectId,
      completedTopics: completedTopics || [],
      completedTopicIds: completedTopicIds || [],
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + SIXTY_DAYS_MS).toISOString(),
      userId,
    };

    if (plan) payload.plan = plan;
    if (planId) payload.planId = planId;
    if (topicNameMap) payload.topicNameMap = topicNameMap;

    await db.collection("progress").doc(docId).set(payload, { merge: true });
    console.log("[progress] POST saved:", docId, "| topics:", (completedTopicIds || []).length);

    return NextResponse.json({ success: true, docId });
  } catch (err) {
    console.error("[progress] POST Error:", err);
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}
