// src/app/api/teacher/upload/route.ts
// Teacher Upload API — accepts file uploads (PDF, TXT, images)
// Extracts text content using Gemini vision model, stores in Firestore
// Invalidates RAG vector store cache so next query includes new material
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { visionLLM } from "@/lib/langchain";
import { HumanMessage } from "@langchain/core/messages";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
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
        { error: "Only teachers can upload materials" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const subjectId = formData.get("subjectId") as string;
    const description = (formData.get("description") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!subjectId) {
      return NextResponse.json(
        { error: "Subject ID is required" },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    const mimeType = file.type;
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: "Unsupported file type. Allowed: PDF, TXT, JPEG, PNG, WebP" },
        { status: 400 }
      );
    }

    console.log(
      `[teacher/upload] Processing ${file.name} (${(file.size / 1024).toFixed(1)}KB, ${mimeType}) for subject ${subjectId}`
    );

    // Step 1: Extract text from the file
    let extractedText = "";
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (mimeType === "text/plain") {
      // Plain text — read directly
      extractedText = buffer.toString("utf-8");
    } else {
      // PDF or Image — use Gemini vision model for text extraction
      const base64 = buffer.toString("base64");

      const extractionPrompt =
        mimeType === "application/pdf"
          ? `You are an expert academic document reader. Extract ALL text content from this PDF document.
Preserve the structure: headings, paragraphs, lists, formulas, code blocks, and tables.
Return ONLY the extracted text content — no commentary, no JSON wrapping, no markdown fences.
If there are diagrams or figures, describe them briefly in [brackets].
Capture every piece of educational content accurately.`
          : `You are an expert at reading academic handwritten and printed notes.
Extract ALL text content from this image. Preserve the structure and formatting.
Return ONLY the extracted text — no commentary, no JSON wrapping.
If there are diagrams, describe them briefly in [brackets].`;

      const message = new HumanMessage({
        content: [
          { type: "text", text: extractionPrompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
            },
          },
        ],
      });

      const result = await visionLLM.invoke([message]);
      extractedText =
        typeof result.content === "string"
          ? result.content
          : JSON.stringify(result.content);
    }

    if (!extractedText || extractedText.length < 10) {
      return NextResponse.json(
        {
          error:
            "Could not extract meaningful text from the file. Please try a different file.",
        },
        { status: 422 }
      );
    }

    console.log(
      `[teacher/upload] Extracted ${extractedText.length} characters from ${file.name}`
    );

    // Step 2: Store metadata + extracted text in Firestore
    const db = adminDb();
    if (!db) {
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 }
      );
    }

    const { FieldValue, Timestamp } = await import("firebase-admin/firestore");
    const docId = `${userId}_${subjectId}_${Date.now()}`;
    const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

    await db
      .collection("teacherMaterials")
      .doc(docId)
      .set({
        userId,
        teacherName: session?.user?.name || "Unknown Teacher",
        teacherEmail: session?.user?.email || "",
        subjectId,
        fileName: file.name,
        fileSize: file.size,
        mimeType,
        description,
        extractedText,
        textLength: extractedText.length,
        uploadedAt: FieldValue.serverTimestamp(),
        expiresAt: Timestamp.fromDate(
          new Date(Date.now() + SIXTY_DAYS_MS)
        ),
      });

    // Step 3: Invalidate the RAG vector store cache for this subject
    try {
      const { invalidateSubjectCache } = await import("@/lib/rag");
      invalidateSubjectCache(subjectId);
      console.log(
        `[teacher/upload] Invalidated RAG cache for subject: ${subjectId}`
      );
    } catch {
      // non-fatal — cache will rebuild on next query anyway
    }

    return NextResponse.json({
      success: true,
      materialId: docId,
      fileName: file.name,
      textLength: extractedText.length,
      message: `Successfully uploaded "${file.name}" — ${extractedText.length.toLocaleString()} characters extracted and indexed for RAG.`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    console.error("[teacher/upload] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
