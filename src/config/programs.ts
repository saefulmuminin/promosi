import type { ProgramId } from "@/lib/types";

export interface Cause {
  id: string;
  label: string;
  url: string;
}

export interface Program {
  id: ProgramId;
  name: string;
  tagline: string;
  /** Emoji/ikon sederhana untuk kiosk. */
  icon: string;
  /** Kegiatan spesifik (opsional) - sumber: cintazakat.baznas.go.id. */
  causes: Cause[];
}

/** Kegiatan/kampanye BAZNAS (referensi dari dokumen flow). */
export const CAUSES: Cause[] = [
  {
    id: "pendidikan",
    label: "Dukung Pendidikan Anak Indonesia",
    url: "https://cintazakat.baznas.go.id/kegiatan/detail/Dukung-Pendidikan-Anak-Indonesia-75",
  },
  {
    id: "ekonomi",
    label: "Dukung Mustahik Berdaya",
    url: "https://cintazakat.baznas.go.id/kegiatan/detail/Dukung-Mustahik-Berdaya-74",
  },
  {
    id: "kesehatan",
    label: "Dukung Mustahik Tetap Sehat",
    url: "https://cintazakat.baznas.go.id/kegiatan/detail/Dukung-Mustahik-Tetap-Sehat-73",
  },
  {
    id: "dakwah",
    label: "Infak Dakwah, Alirkan Pahala",
    url: "https://cintazakat.baznas.go.id/kegiatan/detail/Infak-Dakwah-Alirkan-Pahala-76",
  },
  {
    id: "bencana",
    label: "Solidaritas Peduli Bencana & Kemanusiaan",
    url: "https://cintazakat.baznas.go.id/kegiatan/detail/Solidaritas-Peduli-Bencana-78",
  },
  {
    id: "sedekah-subuh",
    label: "Sedekah Subuh",
    url: "https://cintazakat.baznas.go.id/kegiatan/detail/Sedekah-Subuh-23",
  },
];

function pickCauses(...ids: string[]): Cause[] {
  return CAUSES.filter((c) => ids.includes(c.id));
}

export const PROGRAMS: Program[] = [
  {
    id: "zakat",
    name: "Zakat",
    tagline: "Tunaikan zakat, sucikan harta",
    icon: "🕌",
    causes: pickCauses("ekonomi", "kesehatan", "pendidikan"),
  },
  {
    id: "infaq",
    name: "Infaq",
    tagline: "Infak terbaik untuk sesama",
    icon: "🤲",
    causes: pickCauses("dakwah", "pendidikan", "bencana"),
  },
  {
    id: "sedekah",
    name: "Sedekah",
    tagline: "Sedekah menghidupkan harapan",
    icon: "💚",
    causes: pickCauses("sedekah-subuh", "bencana", "kesehatan"),
  },
];

export const PROGRAM_MAP: Record<ProgramId, Program> = PROGRAMS.reduce(
  (acc, p) => {
    acc[p.id] = p;
    return acc;
  },
  {} as Record<ProgramId, Program>,
);

export function getProgram(id: ProgramId): Program {
  return PROGRAM_MAP[id];
}
