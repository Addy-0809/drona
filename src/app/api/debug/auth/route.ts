// src/app/api/debug/auth/route.ts
// Temporary debug endpoint to verify Auth.js v5 session resolution
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    await headers();
    const session = await auth();

    return NextResponse.json({
      authenticated: !!session,
      user: session?.user
        ? {
            id: session.user.id ?? "MISSING",
            email: session.user.email ?? "MISSING",
            name: session.user.name ?? "MISSING",
          }
        : null,
      env: {
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        hasAuthSecret: !!process.env.AUTH_SECRET,
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        hasFirebaseProjectId: !!(process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Auth check failed", details: (err as Error).message },
      { status: 500 }
    );
  }
}
