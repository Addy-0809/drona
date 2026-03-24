// src/proxy.ts — Next.js 16 route protection
// NOTE: Function MUST be named "proxy" (not "middleware") for Next.js 16
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/api/auth", "/api/debug"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Allow static assets and public files
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/kalpvriksh") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/icon-") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for NextAuth session cookie
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value;

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)" ],
};
