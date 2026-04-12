// src/app/api/agent/test-data/route.ts
// Returns stored test document by testId (for results page to reconstruct MCQ breakdown)
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

    const testId = req.nextUrl.searchParams.get("testId");
    if (!testId) {
      return NextResponse.json({ error: "testId required" }, { status: 400 });
    }

    // Try Admin SDK first
    const db = adminDb();
    if (db) {
      const snap = await db.collection("tests").doc(testId).get();
      if (snap.exists) {
        const data = snap.data()!;
        // Security: only return data to the user who owns the test
        if (data.userId && data.userId !== userId) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        return NextResponse.json({ test: data.test, subjectId: data.subjectId, subjectName: data.subjectName });
      }
      return NextResponse.json({ test: null });
    }

    // Fallback: Firestore REST
    const PROJECT_ID = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
    const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/tests/${testId}${API_KEY ? `?key=${API_KEY}` : ""}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ test: null });
    const doc = await res.json();
    if (!doc.fields) return NextResponse.json({ test: null });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function fromVal(v: any): any {
      if (!v) return null;
      if ("stringValue" in v) return v.stringValue;
      if ("integerValue" in v) return parseInt(v.integerValue);
      if ("doubleValue" in v) return v.doubleValue;
      if ("booleanValue" in v) return v.booleanValue;
      if ("nullValue" in v) return null;
      if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromVal);
      if ("mapValue" in v) {
        const f = v.mapValue.fields || {};
        const out: Record<string, unknown> = {};
        for (const k of Object.keys(f)) out[k] = fromVal(f[k]);
        return out;
      }
      return null;
    }

    const fields = doc.fields;
    const data: Record<string, unknown> = {};
    for (const k of Object.keys(fields)) data[k] = fromVal(fields[k]);

    if (data.userId && data.userId !== userId) {
      return NextResponse.json({ test: null });
    }

    return NextResponse.json({ test: data.test, subjectId: data.subjectId, subjectName: data.subjectName });
  } catch (err) {
    console.error("[test-data] GET error:", err);
    return NextResponse.json({ test: null });
  }
}
