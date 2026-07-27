"use client";

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";
import { STANDALONE } from "@/lib/runtime";
import type { DeviceStatus, LeafState, TreeCommand } from "@/lib/types";

interface TreeSnapshot {
  leaves: Record<string, LeafState>;
  command: TreeCommand | null;
  devices: Record<string, DeviceStatus>;
}

/**
 * Satu sumber state pohon. Di standalone: polling /api/tree.
 * Di Firebase: listener RTDB terpisah per bagian.
 */
function useTree(): TreeSnapshot {
  const [tree, setTree] = useState<TreeSnapshot>({
    leaves: {},
    command: null,
    devices: {},
  });

  useEffect(() => {
    if (STANDALONE) {
      let alive = true;
      const tick = async () => {
        try {
          const res = await fetch("/api/tree", { cache: "no-store" });
          if (res.ok && alive) setTree((await res.json()) as TreeSnapshot);
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

    const unsubLeaves = onValue(ref(rtdb, "tree/leaves"), (snap) =>
      setTree((t) => ({ ...t, leaves: (snap.val() as TreeSnapshot["leaves"]) ?? {} })),
    );
    const unsubCmd = onValue(ref(rtdb, "tree/command"), (snap) =>
      setTree((t) => ({ ...t, command: (snap.val() as TreeCommand) ?? null })),
    );
    const unsubStatus = onValue(ref(rtdb, "tree/status"), (snap) =>
      setTree((t) => ({
        ...t,
        devices: (snap.val() as TreeSnapshot["devices"]) ?? {},
      })),
    );
    return () => {
      unsubLeaves();
      unsubCmd();
      unsubStatus();
    };
  }, []);

  return tree;
}

/** State semua daun (map leafId -> LeafState). */
export function useTreeLeaves(): Record<string, LeafState> {
  return useTree().leaves;
}

/** Perintah efek terakhir (untuk memicu animasi energy-flow sekali). */
export function useTreeCommand(): TreeCommand | null {
  return useTree().command;
}

/** Status semua perangkat (heartbeat ESP32/LD3D). */
export function useDeviceStatuses(): Record<string, DeviceStatus> {
  return useTree().devices;
}
