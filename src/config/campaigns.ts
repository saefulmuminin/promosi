import type { LeafColor, ProgramId } from "@/lib/types";

/**
 * Campaign (kegiatan) BAZNAS - "Pilih Daun Kebaikanmu".
 * Sesuai dokumentasi resmi: SATU campaign = SATU warna daun. Memilih campaign
 * otomatis menentukan warna lampu daun yang menyala (tanpa langkah pilih warna).
 *
 * Pemetaan warna (poster resmi):
 *   Hijau  = Pendidikan   | Jingga = Ekonomi | Kuning = Sosial
 *   Biru   = Dakwah       | Ungu   = Kesehatan | Merah = Harapan/Doa
 *
 * `program` = jenis dana yang dicatat pada transaksi (zakat / infaq / sedekah).
 */
export interface Campaign {
  id: string;
  /** Label kategori singkat. */
  name: string;
  /** Judul kegiatan. */
  title: string;
  description: string;
  url: string;
  /**
   * Banner/poster campaign. Taruh file gambar di `public/campaigns/`.
   * Jika file belum ada, kartu otomatis menampilkan placeholder berwarna.
   */
  banner: string;
  /**
   * Tombol daun (pill "Hidupkan …") untuk layar "Pohon Kehidupan".
   * Aset gambar utuh (leaf + label) di `public/`.
   */
  leafButton: string;
  /** Warna daun yang menyala untuk campaign ini. */
  color: LeafColor;
  /** Jenis dana (dicatat di transaksi). */
  program: ProgramId;
  /** Ikon sederhana (dipakai pada placeholder bila banner belum ada). */
  icon: string;
}

export const CAMPAIGNS: Campaign[] = [
  {
    id: "pendidikan",
    name: "Pendidikan",
    title: "Dukung Pendidikan Anak Indonesia",
    description: "Bantu anak Indonesia tetap bersekolah dan meraih cita-cita.",
    url: "https://cintazakat.baznas.go.id/kegiatan/detail/Dukung-Pendidikan-Anak-Indonesia-75",
    banner: "/campaigns/Dukung%20Pendidikan%20Anak%20Indonesia.png",
    leafButton: "/Asset%20Pohon%20Sedekah-05.png",
    color: "green",
    program: "zakat",
    icon: "📚",
  },
  {
    id: "ekonomi",
    name: "Ekonomi",
    title: "Dukung Mustahik Berdaya",
    description: "Berdayakan ekonomi mustahik agar mandiri dan sejahtera.",
    url: "https://cintazakat.baznas.go.id/kegiatan/detail/Dukung-Mustahik-Berdaya-74",
    banner: "/campaigns/Dukung%20Mustahik%20Berdaya.png",
    leafButton: "/Asset%20Pohon%20Sedekah-08.png",
    color: "orange",
    program: "zakat",
    icon: "🌾",
  },
  {
    id: "sosial",
    name: "Bencana & Kemanusiaan",
    title: "Solidaritas Peduli Bencana",
    description: "Ulurkan bantuan bagi korban bencana dan sesama yang terdampak.",
    url: "https://cintazakat.baznas.go.id/kegiatan/detail/Solidaritas-Peduli-Bencana-78",
    banner: "/campaigns/Solidaritas%20Peduli%20Bencana.png",
    leafButton: "/Asset%20Pohon%20Sedekah-09.png",
    color: "yellow",
    program: "sedekah",
    icon: "🤝",
  },
  {
    id: "dakwah",
    name: "Dakwah",
    title: "Infak Dakwah, Alirkan Pahala",
    description: "Dukung syiar dan dakwah, alirkan pahala tiada henti.",
    url: "https://cintazakat.baznas.go.id/kegiatan/detail/Infak-Dakwah-Alirkan-Pahala-76",
    banner: "/campaigns/Infak%20Dakwah%20Alirkan%20Pahala.png",
    leafButton: "/Asset%20Pohon%20Sedekah-06.png",
    color: "blue",
    program: "infaq",
    icon: "🕌",
  },
  {
    id: "kesehatan",
    name: "Kesehatan",
    title: "Dukung Mustahik Tetap Sehat",
    description: "Hadirkan layanan kesehatan bagi mustahik yang membutuhkan.",
    url: "https://cintazakat.baznas.go.id/kegiatan/detail/Dukung-Mustahik-Tetap-Sehat-73",
    banner: "/campaigns/Dukung%20Mustahik%20Tetap%20Sehat.png",
    leafButton: "/Asset%20Pohon%20Sedekah-07.png",
    color: "purple",
    program: "zakat",
    icon: "🏥",
  },
  {
    id: "harapan",
    name: "Sedekah Subuh",
    title: "Sedekah Subuh, Panjatkan Harapan",
    description: "Awali hari dengan sedekah subuh dan panjatkan harapan terbaik.",
    url: "https://cintazakat.baznas.go.id/kegiatan/detail/Sedekah-Subuh-23",
    banner: "/campaigns/sedekah%20shubuh.png",
    leafButton: "/Asset%20Pohon%20Sedekah-10.png",
    color: "red",
    program: "sedekah",
    icon: "🤲",
  },
];

export const CAMPAIGN_MAP: Record<string, Campaign> = CAMPAIGNS.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<string, Campaign>,
);

export function getCampaign(id: string): Campaign | undefined {
  return CAMPAIGN_MAP[id];
}
