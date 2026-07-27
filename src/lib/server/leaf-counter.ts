/** Penetapan nomor daun berikutnya secara aman (atomic) via Firestore. */
import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { TOTAL_LEAVES } from "@/config/constants";

/**
 * Ambil Leaf ID berikutnya (1..TOTAL_LEAVES, memutar/wrap).
 * Menggunakan transaksi Firestore agar tidak ada dua donatur mendapat daun sama.
 */
export async function assignNextLeafId(): Promise<number> {
  const ref = adminDb.collection("counters").doc("leaves");
  return adminDb.runTransaction(async (t) => {
    const snap = await t.get(ref);
    const current = (snap.data()?.value as number | undefined) ?? 0;
    const next = (current % TOTAL_LEAVES) + 1; // 1..TOTAL_LEAVES
    t.set(ref, { value: current + 1 }, { merge: true });
    return next;
  });
}
