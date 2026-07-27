"use client";

import type { ReactNode } from "react";

interface StepShellProps {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** True bila latar gelap (mis. step dengan video) → teks header dibuat putih. */
  onDark?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Kerangka umum untuk langkah-langkah kiosk. Judul + subjudul berada di header
 * (BAZNAS dihilangkan) agar konten lebih naik. `onDark` untuk latar gelap/video.
 */
export function StepShell({
  step,
  total,
  title,
  subtitle,
  onBack,
  onDark = false,
  children,
  footer,
}: StepShellProps) {
  return (
    <div className="kiosk-surface flex h-full w-full flex-col">
      <header className="flex items-start justify-between gap-6 px-10 pt-8">
        {onBack ? (
          <button
            onClick={onBack}
            className={`flex shrink-0 items-center gap-3 rounded-full border px-6 py-3 text-lg font-medium transition-all active:scale-95 ${
              onDark
                ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
                : "border-black/10 bg-black/[0.04] text-gray-700 hover:bg-black/[0.08]"
            }`}
          >
            <span className="text-xl">←</span> Kembali
          </button>
        ) : (
          <span className="w-32 shrink-0" />
        )}

        <div className="flex-1 animate-fade-in-up text-center">
          <h2
            className={`text-[clamp(1.5rem,2.3vw,2.3rem)] font-black leading-tight tracking-tight ${
              onDark ? "text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]" : ""
            }`}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className={`mt-1 text-[clamp(0.8rem,1.05vw,1.1rem)] font-light ${
                onDark ? "text-white/85 drop-shadow" : "text-gray-500"
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>

        <span
          className={`w-32 shrink-0 text-right text-lg font-semibold tracking-wide ${
            onDark ? "text-white/80" : "text-gray-400"
          }`}
        >
          LANGKAH {step}{" "}
          <span className={onDark ? "mx-1 text-white/40" : "mx-1 text-gray-300"}>
            /
          </span>{" "}
          {total}
        </span>
      </header>

      {/* Progress bar */}
      <div className="mt-5 px-10">
        <div
          className={`h-2 w-full overflow-hidden rounded-full ${
            onDark ? "bg-white/25" : "bg-black/10"
          }`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#3DAE4B] to-[#1F8A3B] transition-all duration-700 ease-out"
            style={{ width: `${(step / total) * 100}%` }}
          />
        </div>
      </div>

      <main className="no-scrollbar flex-1 overflow-y-auto px-10 py-6">
        {children}
      </main>

      {footer && (
        <footer className="border-t border-black/10 bg-black/[0.03] px-10 py-6">
          {footer}
        </footer>
      )}
    </div>
  );
}
