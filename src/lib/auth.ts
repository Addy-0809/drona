// src/lib/auth.ts
// NextAuth / Auth.js v5 configuration
// Supports role-based access: teacher emails configured via TEACHER_EMAILS env variable
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

/**
 * Teacher email whitelist — comma-separated list in env.
 * Example: TEACHER_EMAILS="prof@university.edu,dr.smith@college.ac.in"
 */
function getTeacherEmails(): Set<string> {
  const raw = process.env.TEACHER_EMAILS || "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true, // Required for Vercel / non-localhost deployments
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // Auth.js v5 auto-reads AUTH_SECRET — do NOT pass `secret` here manually
  callbacks: {
    async signIn({ user }) {
      try {
        const { adminDb } = await import("@/lib/firebase-admin");
        const { FieldValue } = await import("firebase-admin/firestore");
        const db = adminDb();
        if (!db) return true; // No admin credentials — still allow sign-in
        const userRef = db.collection("users").doc(user.id!);
        const snap = await userRef.get();

        // Determine role — teacher if email is in the whitelist
        const teacherEmails = getTeacherEmails();
        const isTeacher = user.email
          ? teacherEmails.has(user.email.toLowerCase())
          : false;

        if (!snap.exists) {
          await userRef.set({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: isTeacher ? "teacher" : "student",
            createdAt: FieldValue.serverTimestamp(),
          });
        } else {
          // If user already exists, update role if they're now in the teacher list
          // (or were removed from it)
          const existingRole = snap.data()?.role;
          if (isTeacher && existingRole !== "teacher") {
            await userRef.update({ role: "teacher" });
          }
        }
        return true;
      } catch (e) {
        console.error("Error saving user to Firestore (non-fatal):", e);
        return true;
      }
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        // Attach role to the session
        (session.user as unknown as Record<string, unknown>).role =
          (token as Record<string, unknown>).role || "student";
      }
      return session;
    },
    async jwt({ token, user, trigger }) {
      if (user) token.sub = user.id;

      // Fetch role from Firestore on sign-in or token refresh
      if (user || trigger === "update") {
        try {
          const { adminDb } = await import("@/lib/firebase-admin");
          const db = adminDb();
          if (db && token.sub) {
            const snap = await db.collection("users").doc(token.sub).get();
            (token as Record<string, unknown>).role =
              snap.data()?.role || "student";
          }
        } catch {
          // non-fatal
        }
      }
      return token;
    },
  },
  pages: {
    signIn: "/",
  },
});
