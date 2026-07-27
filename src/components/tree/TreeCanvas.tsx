"use client";

import { useMemo } from "react";
import { LEAF_LAYOUT, LEAF_COLOR_MAP } from "@/config/leaves";
import type { LeafColor, LeafState } from "@/lib/types";

interface TreeCanvasProps {
  /** State daun aktual dari RTDB (map leafId -> LeafState). */
  leaves?: Record<string, LeafState>;
  /** Daun yang sedang dipratinjau/berdenyut (kiosk saat pilih warna). */
  highlightLeafId?: number | null;
  highlightColor?: LeafColor | null;
  /** Tampilkan efek cahaya mengalir dari akar ke daun. */
  energyFlow?: boolean;
  /** Tanpa latar (agar menyatu dengan halaman, mis. layar idle). */
  transparent?: boolean;
  className?: string;
}

const VIEW = 1000;
// Pusat kanopi (untuk arah daun & glow).
const CX = 0.5 * VIEW;
const CY = 0.28 * VIEW;

// Dua nuansa hijau daun redup (foliage) agar kanopi terlihat bervolume.
const GREEN_A = "#2f6b3a";
const GREEN_B = "#245730";

export function TreeCanvas({
  leaves = {},
  highlightLeafId = null,
  highlightColor = null,
  energyFlow = false,
  transparent = false,
  className,
}: TreeCanvasProps) {
  // Cabang deterministik dari pangkal menuju kanopi (kesan ranting).
  const branches = useMemo(() => {
    const baseX = 0.5 * VIEW;
    const baseY = 0.6 * VIEW;
    return LEAF_LAYOUT.filter((_, i) => i % 9 === 0).map((leaf) => {
      const lx = leaf.x * VIEW;
      const ly = leaf.y * VIEW;
      const midX = baseX + (lx - baseX) * 0.4;
      const midY = baseY + (ly - baseY) * 0.35;
      return {
        id: leaf.id,
        d: `M ${baseX} ${VIEW} L ${baseX} ${baseY} Q ${midX} ${midY} ${lx} ${ly}`,
      };
    });
  }, []);

  return (
    <svg
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      className={className}
      role="img"
      aria-label="Pohon Donasi BAZNAS"
    >
      <defs>
        <radialGradient id="ground" cx="50%" cy="95%" r="60%">
          <stop offset="0%" stopColor="#0b3b6f" />
          <stop offset="100%" stopColor="#032447" />
        </radialGradient>
        <linearGradient id="trunk" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#2c2013" />
          <stop offset="100%" stopColor="#5b4326" />
        </linearGradient>
        <radialGradient id="canopy" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1f5c30" stopOpacity="0.75" />
          <stop offset="70%" stopColor="#123a1f" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#0c2414" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="flow" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ffe9b0" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffe9b0" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Latar (opsional) */}
      {!transparent && (
        <rect x="0" y="0" width={VIEW} height={VIEW} fill="url(#ground)" />
      )}

      {/* Batang pohon */}
      <path
        d={`M ${0.43 * VIEW} ${VIEW} C ${0.47 * VIEW} ${0.82 * VIEW}, ${
          0.475 * VIEW
        } ${0.72 * VIEW}, ${0.5 * VIEW} ${0.58 * VIEW} C ${0.525 * VIEW} ${
          0.72 * VIEW
        }, ${0.53 * VIEW} ${0.82 * VIEW}, ${0.57 * VIEW} ${VIEW} Z`}
        fill="url(#trunk)"
      />

      {/* Ranting (di belakang kanopi) */}
      <g fill="none" stroke="#3a2a1a" strokeWidth={5} strokeLinecap="round">
        {branches.map((b) => (
          <path key={b.id} d={b.d} />
        ))}
      </g>

      {/* Massa kanopi hijau (memberi volume walau belum ada donasi) */}
      <ellipse cx={CX} cy={CY} rx={0.44 * VIEW} ry={0.3 * VIEW} fill="url(#canopy)" />

      {/* Efek cahaya mengalir dari akar (energy flow) */}
      {energyFlow && (
        <rect
          x={0.46 * VIEW}
          y={0.55 * VIEW}
          width={0.08 * VIEW}
          height={0.45 * VIEW}
          fill="url(#flow)"
          className="origin-bottom animate-pulse"
        />
      )}

      {/* Daun */}
      {LEAF_LAYOUT.map((leaf) => {
        const state = leaves[String(leaf.id)];
        const isHighlight = highlightLeafId === leaf.id;
        const on = Boolean(state?.on) || isHighlight;
        const color = isHighlight
          ? highlightColor ?? state?.color ?? "green"
          : state?.color ?? "green";
        // Fallback bila warna tidak dikenal (mis. data lama gold/white).
        const info = LEAF_COLOR_MAP[color] ?? LEAF_COLOR_MAP.green;
        const cx = leaf.x * VIEW;
        const cy = leaf.y * VIEW;
        const r = 9 * leaf.scale;
        // Orientasi daun mengarah keluar dari pusat kanopi.
        const rot = (Math.atan2(cy - CY, cx - CX) * 180) / Math.PI + 90;
        const foliage = leaf.id % 3 === 0 ? GREEN_B : GREEN_A;

        return (
          <g key={leaf.id}>
            {on && (
              <circle cx={cx} cy={cy} r={r * 3} fill={info.glow} opacity={0.28} />
            )}
            <ellipse
              cx={cx}
              cy={cy}
              rx={r * 0.82}
              ry={r * 1.5}
              transform={`rotate(${rot} ${cx} ${cy})`}
              fill={on ? info.hex : foliage}
              opacity={on ? 1 : 0.92}
              style={
                on
                  ? { filter: `drop-shadow(0 0 ${r * 1.2}px ${info.glow})` }
                  : undefined
              }
              className={isHighlight ? "animate-pulseLeaf" : undefined}
            />
          </g>
        );
      })}
    </svg>
  );
}
