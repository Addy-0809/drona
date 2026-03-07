// src/lib/firebase-admin.ts
// Firebase Admin SDK — works WITHOUT a service account key.
// Uses FIREBASE_ADMIN_PROJECT_ID only. All operations return null if unavailable.
// The app works fully without this — AI features run on Gemini, data via client SDK.

let _app: unknown = null;
let _initialized = false;

function getAdminApp() {
  if (_initialized) return _app;
  _initialized = true;

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId) {
    console.warn("[firebase-admin] No projectId found — Firestore persistence disabled.");
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const adminApp = require("firebase-admin/app");
    const existingApps = adminApp.getApps();
    if (existingApps.length > 0) {
      _app = existingApps[0];
      return _app;
    }

    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    const privateKey = rawKey?.replace(/\\n/g, "\n");

    if (clientEmail && privateKey) {
      // Full service account credentials available
      _app = adminApp.initializeApp({
        credential: adminApp.cert({ projectId, clientEmail, privateKey }),
      });
    } else {
      // Project-only init (works for some operations without a service account key)
      _app = adminApp.initializeApp({ projectId });
    }
    return _app;
  } catch (e) {
    console.warn("[firebase-admin] Initialization failed (non-fatal):", (e as Error).message);
    return null;
  }
}

/**
 * Returns a Firestore Admin instance, or null if credentials aren't available.
 * Always wrap calls in try/catch — graceful degradation keeps the app running.
 */
export function adminDb() {
  const app = getAdminApp();
  if (!app) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getFirestore } = require("firebase-admin/firestore");
    return getFirestore(app) as import("firebase-admin/firestore").Firestore;
  } catch (e) {
    console.warn("[firebase-admin] Firestore unavailable:", (e as Error).message);
    return null;
  }
}

/**
 * Returns a Storage Admin instance, or null if unavailable.
 */
export function adminStorage() {
  const app = getAdminApp();
  if (!app) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getStorage } = require("firebase-admin/storage");
    return getStorage(app);
  } catch (e) {
    console.warn("[firebase-admin] Storage unavailable:", (e as Error).message);
    return null;
  }
}
