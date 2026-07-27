"use client";

import { useState } from "react";
import { TreeCanvas } from "@/components/tree/TreeCanvas";
import { LEAF_COLORS } from "@/config/leaves";
import { TOTAL_LEAVES } from "@/config/constants";
import { useTreeLeaves } from "@/hooks/useTreeState";
import { useStatsSummary } from "@/hooks/useStats";
import type { LeafColor } from "@/lib/types";

interface LeafColorSelectProps {
  onConfirm: (color: LeafColor) => void;
}

/** Langkah 4: Pilih warna daun. Daun terpilih berdenyut di pohon. */
export function LeafColorSelect({ onConfirm }: LeafColorSelectProps) {
  const [selected, setSelected] = useState<LeafColor | null>(null);
  const leaves = useTreeLeaves();
  const stats = useStatsSummary();

  // Daun pratinjau = perkiraan daun berikutnya (ilustratif; final di server).
  const previewLeafId = Math.min(stats.activeLeaves + 1, TOTAL_LEAVES);

  return (
    <div className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-2">
      <div className="rounded-3xl bg-black/20 p-4">
        <TreeCanvas
          leaves={leaves}
          highlightLeafId={selected ? previewLeafId : null}
          highlightColor={selected}
          className="mx-auto h-[42vh] w-full"
        />
      </div>

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          {LEAF_COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`group flex items-center gap-4 rounded-3xl border p-5 transition-all duration-300 active:scale-[0.98] ${
                selected === c.id
                  ? "border-baznas-gold bg-baznas-gold/10 shadow-[0_0_20px_rgba(248,220,138,0.15)]"
                  : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
              }`}
            >
              <span
                className={`h-12 w-12 rounded-full transition-transform duration-300 ${selected === c.id ? "scale-110" : "group-hover:scale-110"}`}
                style={{
                  backgroundColor: c.hex,
                  boxShadow: `0 0 ${selected === c.id ? "24px" : "16px"} ${c.glow}`,
                }}
              />
              <span className="text-[1.35rem] font-bold drop-shadow-sm">{c.name}</span>
            </button>
          ))}
        </div>

        <button
          disabled={!selected}
          onClick={() => selected && onConfirm(selected)}
          className="mt-4 rounded-3xl bg-gradient-to-r from-baznas-gold to-[#e0a62e] px-8 py-5 text-[1.4rem] font-black text-baznas-navy shadow-[0_10px_25px_rgba(248,220,138,0.3)] transition-all duration-300 active:scale-[0.98] disabled:opacity-30 disabled:shadow-none hover:shadow-[0_15px_35px_rgba(248,220,138,0.4)] disabled:hover:shadow-none"
        >
          Konfirmasi Warna
        </button>
      </div>
    </div>
  );
}
