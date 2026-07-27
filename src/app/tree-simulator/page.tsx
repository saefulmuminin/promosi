"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TreeCanvas } from "@/components/tree/TreeCanvas";
import { useTreeCommand, useTreeLeaves } from "@/hooks/useTreeState";
import { useStatsSummary } from "@/hooks/useStats";
import { LEAF_COLOR_MAP } from "@/config/leaves";
import { formatNumber, formatRupiah } from "@/lib/format";
import type { LeafColor } from "@/lib/types";

/**
 * Simulator visual pohon LED. Mirror state RTDB `/tree/leaves` secara realtime.
 * Ini PENGGANTI mesin LD3D/ESP32 untuk uji coba end-to-end tanpa hardware.
 */
export default function TreeSimulatorPage() {
  const leaves = useTreeLeaves();
  const command = useTreeCommand();
  const stats = useStatsSummary();

  const [flowLeaf, setFlowLeaf] = useState<number | null>(null);
  const [flowColor, setFlowColor] = useState<LeafColor | null>(null);
  const lastCmdId = useRef<string | null>(null);

  // Saat ada perintah baru -> mainkan animasi energy-flow sebentar.
  useEffect(() => {
    if (!command || command.id === lastCmdId.current) return;
    lastCmdId.current = command.id;
    setFlowLeaf(command.leafId);
    setFlowColor(command.color);
    const t = setTimeout(() => {
      setFlowLeaf(null);
      setFlowColor(null);
    }, 4000);
    return () => clearTimeout(t);
  }, [command]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#021a35] to-black">
      <div className="absolute inset-0">
        <TreeCanvas
          leaves={leaves}
          highlightLeafId={flowLeaf}
          highlightColor={flowColor}
          energyFlow={flowLeaf !== null}
          className="h-full w-full"
        />
      </div>

      <div className="relative z-10 flex items-start justify-between p-6">
        <div className="rounded-2xl bg-black/40 px-5 py-3 backdrop-blur">
          <p className="text-baznas-gold text-sm font-semibold tracking-widest">
            SIMULATOR POHON LED
          </p>
          <p className="text-xs text-white/50">
            Mirror realtime dari Firebase RTDB /tree/leaves
          </p>
        </div>
        <Link
          href="/"
          className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/70"
        >
          ← Menu
        </Link>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-6 rounded-2xl bg-black/40 px-8 py-4 backdrop-blur">
        <Stat label="Daun menyala" value={formatNumber(stats.activeLeaves)} />
        <Stat label="Total donasi" value={formatRupiah(stats.totalDonation)} />
        {command && (
          <Stat
            label="Perintah terakhir"
            value={
              <span className="flex items-center gap-2">
                #{command.leafId}
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: LEAF_COLOR_MAP[command.color].hex }}
                />
              </span>
            }
          />
        )}
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-baznas-gold">{value}</div>
      <div className="text-xs text-white/50">{label}</div>
    </div>
  );
}
