/**
 * Pengaturan video kiosk yang dikelola dari halaman manajemen dan dibaca
 * langsung oleh kiosk (realtime via Firestore).
 *
 * Dokumen: `kioskSettings/videos` pada proyek Firebase "pohon-harapan".
 */
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type FirestoreError,
} from "firebase/firestore";
import { kioskVideosDb } from "./firebase/kiosk-videos";
import { CAMPAIGNS } from "@/config/campaigns";
import { IDLE_VIDEO_IDS } from "@/config/videos";

export interface KioskVideoSettings {
  /** Daftar video latar layar awal (URL atau ID YouTube). */
  idleVideos: string[];
  /** Video terima kasih per campaign: `campaignId` -> URL/ID YouTube. */
  leafThankYouVideos: Record<string, string>;
}

/** Nilai bawaan bila belum ada data tersimpan (mengikuti konfigurasi kode). */
export const DEFAULT_KIOSK_SETTINGS: KioskVideoSettings = {
  idleVideos: [...IDLE_VIDEO_IDS],
  leafThankYouVideos: CAMPAIGNS.reduce<Record<string, string>>((acc, c) => {
    acc[c.id] = "";
    return acc;
  }, {}),
};

const settingsRef = doc(kioskVideosDb, "kioskSettings", "videos");

/** Gabungkan data Firestore dengan default (mengisi field yang belum ada). */
function normalize(data: Partial<KioskVideoSettings> | undefined): KioskVideoSettings {
  const idle = Array.isArray(data?.idleVideos)
    ? data!.idleVideos.filter((v): v is string => typeof v === "string")
    : [];
  return {
    idleVideos: idle.length ? idle : [...IDLE_VIDEO_IDS],
    leafThankYouVideos: {
      ...DEFAULT_KIOSK_SETTINGS.leafThankYouVideos,
      ...(data?.leafThankYouVideos ?? {}),
    },
  };
}

/** Baca sekali (untuk halaman manajemen). */
export async function loadKioskSettings(): Promise<KioskVideoSettings> {
  const snap = await getDoc(settingsRef);
  return normalize(
    snap.exists() ? (snap.data() as Partial<KioskVideoSettings>) : undefined,
  );
}

/** Langganan realtime (untuk kiosk). Mengembalikan fungsi unsubscribe. */
export function subscribeKioskSettings(
  onData: (s: KioskVideoSettings) => void,
  onError?: (e: FirestoreError) => void,
): () => void {
  return onSnapshot(
    settingsRef,
    (snap) =>
      onData(
        normalize(
          snap.exists() ? (snap.data() as Partial<KioskVideoSettings>) : undefined,
        ),
      ),
    (e) => onError?.(e),
  );
}

/** Simpan pengaturan (dari halaman manajemen). */
export async function saveKioskSettings(s: KioskVideoSettings): Promise<void> {
  await setDoc(
    settingsRef,
    { ...s, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/**
 * Ambil ID video YouTube dari berbagai bentuk URL, atau kembalikan input
 * apa adanya bila sudah berupa ID 11 karakter.
 */
export function youTubeId(input: string): string {
  const s = (input || "").trim();
  if (!s) return "";
  if (/^[\w-]{11}$/.test(s)) return s; // sudah berupa ID
  const patterns = [
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:[?&]v=)([\w-]{11})/,
    /(?:embed\/)([\w-]{11})/,
    /(?:shorts\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = s.match(p);
    if (m) return m[1];
  }
  return s; // fallback: biarkan apa adanya
}
