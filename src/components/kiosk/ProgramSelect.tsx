"use client";

import { PROGRAMS } from "@/config/programs";
import type { Cause, Program } from "@/config/programs";
import type { ProgramId } from "@/lib/types";

interface ProgramSelectProps {
  onSelect: (program: ProgramId, cause: Cause | null) => void;
}

/** Langkah 2: Pilih program donasi (Zakat / Infaq / Sedekah). */
export function ProgramSelect({ onSelect }: ProgramSelectProps) {
  return (
    <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
      {PROGRAMS.map((program) => (
        <ProgramCard key={program.id} program={program} onSelect={onSelect} />
      ))}
    </div>
  );
}

function ProgramCard({
  program,
  onSelect,
}: {
  program: Program;
  onSelect: ProgramSelectProps["onSelect"];
}) {
  return (
    <button
      onClick={() => onSelect(program.id, null)}
      className="group flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-10 text-center transition-all duration-300 active:scale-[0.98] active:border-baznas-gold active:bg-white/20 hover:-translate-y-2 hover:bg-white/10 hover:shadow-[0_15px_30px_rgba(0,0,0,0.3)] hover:border-white/20"
    >
      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-baznas-gold/20 to-transparent text-6xl shadow-[inset_0_0_20px_rgba(248,220,138,0.2)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
        {program.icon}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[1.75rem] font-black tracking-tight drop-shadow-sm">{program.name}</span>
        <span className="text-[1.1rem] font-medium text-white/60">{program.tagline}</span>
      </div>
    </button>
  );
}
