"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { STANDALONE } from "@/lib/runtime";
import type { Transaction } from "@/lib/types";

/** Pantau status satu transaksi secara realtime (untuk kiosk saat menunggu QRIS). */
export function useTransactionStatus(id: string | null): Transaction | null {
  const [tx, setTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!id) {
      setTx(null);
      return;
    }

    if (STANDALONE) {
      let alive = true;
      const tick = async () => {
        try {
          const res = await fetch(`/api/transactions/${id}`, {
            cache: "no-store",
          });
          if (res.ok && alive) setTx((await res.json()) as Transaction);
        } catch {
          /* abaikan */
        }
      };
      tick();
      const timer = setInterval(tick, 1500);
      return () => {
        alive = false;
        clearInterval(timer);
      };
    }

    const unsub = onSnapshot(
      doc(db, "transactions", id),
      (snap) => setTx(snap.exists() ? (snap.data() as Transaction) : null),
      (err) => console.error("[useTransactionStatus]", err),
    );
    return () => unsub();
  }, [id]);

  return tx;
}
