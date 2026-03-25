// src/app/api/progress/route.ts
// Progress API — reads student progress from Firestore (client-readable collection)
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
      // Return progress for a single subject
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
    console.error("[progress] Error:", err);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}
