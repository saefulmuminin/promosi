"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { STANDALONE } from "@/lib/runtime";
import type { StatsSummary } from "@/lib/types";

const EMPTY: StatsSummary = {
  totalDonation: 0,
  totalTransactions: 0,
  activeLeaves: 0,
  colorCounts: { green: 0, orange: 0, yellow: 0, blue: 0, purple: 0, red: 0 },
  updatedAt: 0,
};

/** Ringkasan statistik donasi realtime (untuk dashboard & layar pohon). */
export function useStatsSummary(): StatsSummary {
  const [stats, setStats] = useState<StatsSummary>(EMPTY);

  useEffect(() => {
    if (STANDALONE) {
      let alive = true;
      const tick = async () => {
        try {
          const res = await fetch("/api/stats", { cache: "no-store" });
          if (res.ok && alive) {
            const data = (await res.json()) as Partial<StatsSummary>;
            setStats({
              ...EMPTY,
              ...data,
              colorCounts: { ...EMPTY.colorCounts, ...(data.colorCounts ?? {}) },
            });
          }
        } catch {
          /* abaikan */
        }
      };
      tick();
      const timer = setInterval(tick, 2000);
      return () => {
        alive = false;
        clearInterval(timer);
      };
    }

    const unsub = onSnapshot(doc(db, "stats", "summary"), (snap) => {
      if (!snap.exists()) {
        setStats(EMPTY);
        return;
      }
      const data = snap.data() as Partial<StatsSummary>;
      setStats({
        ...EMPTY,
        ...data,
        colorCounts: { ...EMPTY.colorCounts, ...(data.colorCounts ?? {}) },
      });
    });
    return () => unsub();
  }, []);

  return stats;
}
