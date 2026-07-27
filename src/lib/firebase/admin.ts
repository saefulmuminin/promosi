/**
 * Firebase Admin SDK (server only).
 * Dipakai API routes & webhook untuk menulis transaksi, statistik, dan
 * perintah ke Realtime Database (bypass security rules).
 *
 * Mode:
 *  - Emulator  : cukup projectId; env FIRESTORE_EMULATOR_HOST & FIREBASE_DATABASE_EMULATOR_HOST
 *                di-set otomatis di bawah bila NEXT_PUBLIC_USE_EMULATOR=true.
 *  - Produksi  : FIREBASE_SERVICE_ACCOUNT_KEY (JSON string) atau GOOGLE_APPLICATION_CREDENTIALS.
 */
import "server-only";
import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getDatabase, type Database } from "firebase-admin/database";

const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_EMULATOR === "true";
const projectId =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "pohon-baznas";
const databaseURL =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  `https://${projectId}-default-rtdb.firebaseio.com`;

// Untuk emulator, arahkan Admin SDK ke host emulator (sekali saja).
if (USE_EMULATOR) {
  process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
  process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= "127.0.0.1:9000";
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
}

function initAdmin(): App {
  if (getApps().length) return getApp();

  if (USE_EMULATOR) {
    // Emulator tidak butuh kredensial asli.
    return initializeApp({ projectId, databaseURL });
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (raw) {
    const serviceAccount = JSON.parse(raw);
    return initializeApp({
      credential: cert(serviceAccount),
      databaseURL,
    });
  }

  // Fallback: GOOGLE_APPLICATION_CREDENTIALS / Application Default Credentials.
  return initializeApp({ databaseURL });
}

const app = initAdmin();

export const adminDb: Firestore = getFirestore(app);
export const adminRtdb: Database = getDatabase(app);
