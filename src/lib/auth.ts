// src/lib/auth.ts
// NextAuth configuration
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      try {
        const { adminDb } = await import("@/lib/firebase-admin");
        const { FieldValue } = await import("firebase-admin/firestore");
        const db = adminDb();
        if (!db) return true; // No admin credentials — skip Firestore, still allow sign-in
        const userRef = db.collection("users").doc(user.id!);
        const snap = await userRef.get();
        if (!snap.exists) {
          await userRef.set({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            createdAt: FieldValue.serverTimestamp(),
          });
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
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
  },
  pages: {
    signIn: "/",
  },
});
