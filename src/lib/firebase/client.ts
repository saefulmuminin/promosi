/**
 * Firebase Client SDK (browser).
 * Dipakai kiosk, dashboard, dan tree-simulator untuk listener realtime.
 */
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from "firebase/firestore";
import {
  connectDatabaseEmulator,
  getDatabase,
  type Database,
} from "firebase/database";
import {
  connectAuthEmulator,
  getAuth,
  type Auth,
} from "firebase/auth";

// Fallback aman agar init tidak crash saat build tanpa .env.local.
// Saat runtime, nilai env NEXT_PUBLIC_* yang sebenarnya tetap dipakai.
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "pohon-baznas";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    `${projectId}.firebaseapp.com`,
  projectId,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    `${projectId}.appspot.com`,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:000000000000:web:0000000000000000000000",
  databaseURL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    `https://${projectId}-default-rtdb.firebaseio.com`,
};

const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_EMULATOR === "true";

// Guard agar emulator hanya dikoneksikan sekali (HMR / re-render).
let emulatorsConnected = false;

function createApp(): FirebaseApp {
  // Cari app DEFAULT secara spesifik: kini ada app bernama lain
  // ("kiosk-videos") sehingga getApps().length bisa >0 tanpa app default.
  const existing = getApps().find((a) => a.name === "[DEFAULT]");
  return existing ?? initializeApp(firebaseConfig);
}

export const firebaseApp: FirebaseApp = createApp();

export const db: Firestore = getFirestore(firebaseApp);
export const rtdb: Database = getDatabase(firebaseApp);
export const auth: Auth = getAuth(firebaseApp);

if (USE_EMULATOR && typeof window !== "undefined" && !emulatorsConnected) {
  emulatorsConnected = true;
  const host = "127.0.0.1";
  try {
    connectFirestoreEmulator(db, host, 8080);
    connectDatabaseEmulator(rtdb, host, 9000);
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    // eslint-disable-next-line no-console
    console.info("[firebase] Terhubung ke Emulator Suite");
  } catch {
    // Sudah terkoneksi sebelumnya - abaikan.
  }
}
