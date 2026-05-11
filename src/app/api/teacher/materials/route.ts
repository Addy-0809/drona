// src/app/api/teacher/materials/route.ts
// Teacher Materials API — list and delete uploaded materials
// GET: list all materials (filterable by subjectId)
// DELETE: remove a specific material (teacher only, own uploads)
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    await headers();
    const session = await auth();
    const userId = session?.user?.id ?? session?.user?.email;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = adminDb();
    if (!db) {
      return NextResponse.json({ materials: [] });
    }

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    const teacherOnly = searchParams.get("teacherOnly") === "true";

    let query: FirebaseFirestore.Query = db.collection("teacherMaterials");

    if (subjectId) {
      query = query.where("subjectId", "==", subjectId);
    }

    // If teacherOnly, filter to current user's uploads
    if (teacherOnly) {
      query = query.where("userId", "==", userId);
    }

    query = query.orderBy("uploadedAt", "desc").limit(100);

    const snap = await query.get();
    const materials = snap.docs.map((doc) => {
      const d = doc.data();
      // Don't send extracted text in list (too large)
      return {
        id: doc.id,
        subjectId: d.subjectId,
        fileName: d.fileName,
        fileSize: d.fileSize,
        mimeType: d.mimeType,
        description: d.description || "",
        textLength: d.textLength || 0,
        teacherName: d.teacherName || "Unknown",
        teacherEmail: d.teacherEmail || "",
        uploadedAt: d.uploadedAt?.toDate?.()?.toISOString() || null,
      };
    });

    return NextResponse.json({ materials });
  } catch (err) {
    console.error("[teacher/materials] GET error:", err);
    return NextResponse.json({ materials: [] });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await headers();
    const session = await auth();
    const userId = session?.user?.id ?? session?.user?.email;
    const role = (session?.user as Record<string, unknown> | undefined)?.role;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (role !== "teacher") {
      return NextResponse.json(
        { error: "Only teachers can delete materials" },
        { status: 403 }
      );
    }

    const { materialId } = await req.json();
    if (!materialId) {
      return NextResponse.json(
        { error: "materialId is required" },
        { status: 400 }
      );
    }

    const db = adminDb();
    if (!db) {
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 }
      );
    }

    // Verify ownership
    const docRef = db.collection("teacherMaterials").doc(materialId);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }
    if (snap.data()?.userId !== userId) {
      return NextResponse.json(
        { error: "You can only delete your own uploads" },
        { status: 403 }
      );
    }

    const subjectId = snap.data()?.subjectId;
    await docRef.delete();

    // Invalidate RAG cache
    try {
      const { invalidateSubjectCache } = await import("@/lib/rag");
      if (subjectId) invalidateSubjectCache(subjectId);
    } catch { /* non-fatal */ }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[teacher/materials] DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to delete material" },
      { status: 500 }
    );
  }
}
