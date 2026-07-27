/** Agregasi statistik donasi (server, Admin SDK). */
import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { Transaction } from "@/lib/types";

function statsRef() {
  return adminDb.collection("stats").doc("summary");
}

/**
 * Perbarui statistik agregat saat sebuah transaksi terverifikasi LUNAS.
 * Aman dipanggil idempoten via pemanggil (webhook) yang mengecek status dulu.
 */
export async function applyPaidTransaction(tx: Transaction): Promise<void> {
  await statsRef().set(
    {
      totalDonation: FieldValue.increment(tx.amount),
      totalTransactions: FieldValue.increment(1),
      activeLeaves: FieldValue.increment(1),
      // Merge nested map -> increment hanya warna terkait.
      colorCounts: { [tx.leafColor]: FieldValue.increment(1) },
      updatedAt: Date.now(),
    },
    { merge: true },
  );
}
