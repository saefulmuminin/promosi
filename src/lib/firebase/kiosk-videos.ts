/**
 * Firebase app TERPISAH khusus pengaturan video kiosk
 * (daftar video awal & video terima kasih per daun).
 *
 * Sengaja dipisah dari `client.ts` supaya:
 *  - selalu terhubung ke Cloud Firestore (tidak ikut mode emulator / STANDALONE);
 *  - konfigurasi proyek "pohon-harapan" berdiri sendiri.
 *
 * Catatan: konfigurasi web Firebase memang bersifat publik (bukan rahasia).
 * Keamanan data ditegakkan lewat Firestore Security Rules di sisi server.
 */
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

const config = {
  apiKey:
    process.env.NEXT_PUBLIC_KIOSK_FB_API_KEY ||
    "AIzaSyAPkALtZFRO4mE9k_t36G8qtA9Su-bP2dU",
  authDomain:
    process.env.NEXT_PUBLIC_KIOSK_FB_AUTH_DOMAIN ||
    "pohon-harapan-69dfd.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_KIOSK_FB_PROJECT_ID || "pohon-harapan-69dfd",
  storageBucket:
    process.env.NEXT_PUBLIC_KIOSK_FB_STORAGE_BUCKET ||
    "pohon-harapan-69dfd.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_KIOSK_FB_SENDER_ID || "862282578804",
  appId:
    process.env.NEXT_PUBLIC_KIOSK_FB_APP_ID ||
    "1:862282578804:web:e6c41d3ecfb3e4fd9f8a21",
};

const APP_NAME = "kiosk-videos";

const app: FirebaseApp =
  getApps().find((a) => a.name === APP_NAME) ?? initializeApp(config, APP_NAME);

export const kioskVideosDb: Firestore = getFirestore(app);
