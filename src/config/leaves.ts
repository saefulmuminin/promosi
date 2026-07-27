import type { LeafColor } from "@/lib/types";
import { TOTAL_LEAVES } from "./constants";

export interface LeafColorInfo {
  id: LeafColor;
  name: string;
  /** Warna isi daun (hex) untuk UI & simulator. */
  hex: string;
  /** Warna glow/halo saat menyala. */
  glow: string;
}

/** Palet warna daun resmi BAZNAS (urutan sesuai poster "Pilih Daun Kebaikanmu"). */
export const LEAF_COLORS: LeafColorInfo[] = [
  { id: "green", name: "Hijau", hex: "#4CAF50", glow: "#9BE6A0" },
  { id: "orange", name: "Jingga", hex: "#E8792E", glow: "#FFB870" },
  { id: "yellow", name: "Kuning", hex: "#F2C230", glow: "#FFE08A" },
  { id: "blue", name: "Biru", hex: "#2F8FEB", glow: "#8FC4FF" },
  { id: "purple", name: "Ungu", hex: "#8E44AD", glow: "#C89BE6" },
  { id: "red", name: "Merah", hex: "#E5484D", glow: "#FF9A9D" },
];

export const LEAF_COLOR_MAP: Record<LeafColor, LeafColorInfo> =
  LEAF_COLORS.reduce(
    (acc, c) => {
      acc[c.id] = c;
      return acc;
    },
    {} as Record<LeafColor, LeafColorInfo>,
  );

export function leafColorInfo(color: LeafColor): LeafColorInfo {
  return LEAF_COLOR_MAP[color];
}

/** Posisi satu daun pada kanvas pohon (koordinat ternormalisasi 0..1). */
export interface LeafPosition {
  id: number;
  x: number;
  y: number;
  /** Faktor ukuran relatif (variasi visual). */
  scale: number;
}

/**
 * Susun posisi daun secara deterministik membentuk kanopi pohon.
 * Deterministik penting: kiosk, simulator, dan mapping ESP32 harus konsisten.
 * (Tanpa Math.random supaya urutan/posisi selalu sama.)
 */
export function generateLeafLayout(total: number = TOTAL_LEAVES): LeafPosition[] {
  const leaves: LeafPosition[] = [];
  // Sebar daun pada beberapa "lapisan" kanopi berbentuk elips.
  const rings = 6;
  const perRing = Math.ceil(total / rings);
  let id = 1;
  for (let r = 0; r < rings && id <= total; r++) {
    // Ring luar lebih lebar & lebih rendah; ring dalam lebih tinggi & rapat.
    const ringRadiusX = 0.42 - r * 0.045;
    const ringRadiusY = 0.26 - r * 0.028;
    const cy = 0.34 - r * 0.028;
    const count = r === rings - 1 ? total - id + 1 : perRing;
    for (let i = 0; i < count && id <= total; i++) {
      // Sudut tersebar merata, digeser tiap ring (golden-angle-like) agar rapi.
      const angle = (i / count) * Math.PI * 2 + r * 1.2 + ((id * 13) % 7) * 0.09;
      // Jitter radial deterministik -> daun mengisi interior kanopi (bukan cincin).
      const radial = 0.68 + (((id * 29) % 13) / 13) * 0.5; // 0.68..1.18
      const jitterX = (((id * 37) % 11) / 11 - 0.5) * 0.05;
      const jitterY = (((id * 17) % 9) / 9 - 0.5) * 0.05;
      const x = 0.5 + Math.cos(angle) * ringRadiusX * radial + jitterX;
      const y = cy + Math.sin(angle) * ringRadiusY * radial + jitterY;
      const scale = 0.85 + (((id * 53) % 7) / 7) * 0.5;
      leaves.push({ id, x, y, scale });
      id++;
    }
  }
  return leaves;
}

export const LEAF_LAYOUT: LeafPosition[] = generateLeafLayout();
