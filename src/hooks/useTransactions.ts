"use client";

import { useEffect, useState } from "react";
import {
  collection,
  limit as fbLimit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { STANDALONE } from "@/lib/runtime";
import type { Transaction } from "@/lib/types";

/** Daftar transaksi terbaru (realtime) untuk dashboard admin. */
export function useRecentTransactions(max = 20): Transaction[] {
  const [txs, setTxs] = useState<Transaction[]>([]);

  useEffect(() => {
    if (STANDALONE) {
      let alive = true;
      const tick = async () => {
        try {
          const res = await fetch(`/api/transactions?limit=${max}`, {
            cache: "no-store",
          });
          if (res.ok && alive) {
            const data = (await res.json()) as { transactions: Transaction[] };
            setTxs(data.transactions ?? []);
          }
        } catch {
          /* abaikan */
        }
      };
      tick();
      const timer = setInterval(tick, 3000);
      return () => {
        alive = false;
        clearInterval(timer);
      };
    }

    const q = query(
      collection(db, "transactions"),
      orderBy("createdAt", "desc"),
      fbLimit(max),
    );
    const unsub = onSnapshot(
      q,
      (snap) => setTxs(snap.docs.map((d) => d.data() as Transaction)),
      (err) => console.error("[useRecentTransactions]", err),
    );
    return () => unsub();
  }, [max]);

  return txs;
}
