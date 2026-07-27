/**
 * Helper server untuk mengirim perintah ke mesin pohon (ESP32/LD3D) via RTDB.
 * Mesin membaca `/tree/leaves/{leafId}` dan `/tree/command` secara realtime.
 * Lihat docs/ESP32_INTEGRATION.md untuk kontrak datanya.
 */
import "server-only";
import { adminRtdb } from "@/lib/firebase/admin";
import type { LeafColor, LeafEffect, LeafState, TreeCommand } from "@/lib/types";

export async function sendLeafCommand(params: {
  leafId: number;
  color: LeafColor;
  txId: string;
  effect?: LeafEffect;
}): Promise<void> {
  const { leafId, color, txId, effect = "flow" } = params;
  const now = Date.now();

  const leafState: LeafState = {
    on: true,
    color,
    effect,
    txId,
    updatedAt: now,
  };

  const command: TreeCommand = {
    id: `${leafId}-${now}`,
    leafId,
    color,
    effect,
    ts: now,
  };

  await Promise.all([
    adminRtdb.ref(`tree/leaves/${leafId}`).set(leafState),
    // /tree/command = pemicu efek sekali-jalan (energy-flow dari akar ke daun).
    adminRtdb.ref("tree/command").set(command),
  ]);
}

/** Matikan satu daun (mis. saat reset/maintenance). */
export async function turnOffLeaf(leafId: number): Promise<void> {
  const now = Date.now();
  await adminRtdb.ref(`tree/leaves/${leafId}`).update({
    on: false,
    effect: "off" as LeafEffect,
    updatedAt: now,
  });
}

/** Reset seluruh pohon (semua daun redup). */
export async function resetTree(): Promise<void> {
  await adminRtdb.ref("tree/leaves").remove();
}
