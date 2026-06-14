"use client";
// src/components/FirebaseAuthBridge.tsx
// Bridges the NextAuth (Google) session into Firebase Auth so client-side
// Firestore reads/writes are authenticated. We reuse the Google id_token from
// the NextAuth session — no second sign-in popup. Once Firebase establishes a
// session it persists and self-refreshes, so this only does real work on the
// first load after login (or on a new device).
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { auth as fbAuth } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

export default function FirebaseAuthBridge() {
  const { data: session, status } = useSession();

  // Sign IN to Firebase when NextAuth is authenticated and Firebase is not.
  useEffect(() => {
    if (status !== "authenticated") return;
    const idToken = (session as unknown as { idToken?: string } | null)?.idToken;
    let cancelled = false;

    const unsub = onAuthStateChanged(fbAuth, (user) => {
      if (cancelled || user) return; // already signed in (persisted) → done
      if (!idToken) {
        console.warn(
          "[firebase-auth] No Google id_token in session — cannot sign in to Firebase. A re-login may be required."
        );
        return;
      }
      signInWithCredential(fbAuth, GoogleAuthProvider.credential(idToken))
        .then(() => console.log("[firebase-auth] Signed in to Firebase"))
        .catch((e) =>
          console.error(
            "[firebase-auth] signInWithCredential failed:",
            e?.code,
            e?.message,
            "— check that Google sign-in is enabled in Firebase Auth and the OAuth client ID is whitelisted."
          )
        );
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [status, session]);

  // Sign OUT of Firebase when the NextAuth session ends.
  useEffect(() => {
    if (status === "unauthenticated" && fbAuth.currentUser) {
      signOut(fbAuth).catch(() => {});
    }
  }, [status]);

  return null;
}
