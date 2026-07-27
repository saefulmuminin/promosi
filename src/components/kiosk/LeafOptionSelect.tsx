"use client";

import { CAMPAIGN_MAP, type Campaign } from "@/config/campaigns";

/**
 * Layar "Pohon Kehidupan" — opsi sedekah.
 * Muncul setelah pengunjung menyentuh layar idle. Menampilkan 6 tombol daun
 * (aset utuh leaf + label di `public/Asset Pohon Sedekah-05..10.png`). Satu
 * sentuh langsung membuka layar nominal untuk campaign terkait.
 *
 * Urutan tampil mengikuti poster resmi (2 baris × 3):
 *   Hijau/Pendidikan · Biru/Dakwah · Ungu/Kesehatan
 *   Jingga/Ekonomi   · Kuning/Sosial · Merah/Harapan-Doa
 */
const LEAF_ORDER = [
  "pendidikan",
  "dakwah",
  "kesehatan",
  "ekonomi",
  "sosial",
  "harapan",
] as const;

const LEAVES: Campaign[] = LEAF_ORDER.map((id) => CAMPAIGN_MAP[id]);

export function LeafOptionSelect({
  onSelect,
  onBack,
}: {
  onSelect: (campaign: Campaign) => void;
  onBack: () => void;
}) {
  return (
    <div className="kiosk-surface relative h-full w-full overflow-hidden">
      {/* Latar hijau berdaun (public/Asset Pohon Sedekah-04.png) */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/Asset%20Pohon%20Sedekah-04.png)" }}
      />
      {/* Scrim gelap tipis agar teks putih tetap terbaca */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/25 via-transparent to-black/30" />

      {/* Logo BAZNAS (kanan atas) — sudah memuat Garuda, jadi tidak perlu ganda */}
      <div className="absolute right-[3%] top-[4%] z-20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-baznas-putih-transparan.png"
          alt="BAZNAS — Badan Amil Zakat Nasional"
          className="h-[clamp(3rem,8vh,5rem)] w-auto object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)]"
        />
      </div>

      {/* Tombol kembali (kiri atas) */}
      <button
        onClick={onBack}
        aria-label="Kembali"
        className="absolute left-[3%] top-[5%] z-20 flex items-center gap-2 rounded-full bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/25 active:scale-95"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Kembali
      </button>

      {/* Konten utama */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-[4%] py-[9%]">
        {/* Judul */}
        <div className="animate-floatUp mb-1 text-center">
          <h1 className="text-[clamp(2rem,4.4vw,4rem)] font-black leading-[1.05] tracking-tight text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.45)]">
            Pohon Kehidupan
          </h1>
          <p className="mt-1 text-[clamp(0.85rem,1.5vw,1.4rem)] font-medium text-white/85 drop-shadow">
            Pilih kebaikan yang ingin Anda Hidupkan
          </p>
        </div>

        {/* Pill "Sentuh untuk Berdonasi" */}
        <div className="mb-[3%] mt-3 inline-flex items-center gap-2 rounded-full bg-black/35 px-5 py-2 text-[clamp(0.7rem,1.1vw,1rem)] font-semibold text-white ring-1 ring-white/20 backdrop-blur">
          <TouchIcon className="h-[1.1em] w-[1.1em]" />
          Sentuh untuk Berdonasi
        </div>

        {/* Grid 6 tombol daun (2 baris × 3) */}
        <div className="grid w-full max-w-[68rem] grid-cols-3 gap-x-[clamp(1rem,3vw,3rem)] gap-y-[clamp(0.75rem,2.5vh,2rem)]">
          {LEAVES.map((c, i) => (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              aria-label={`Hidupkan ${c.name}`}
              className="animate-floatUp group relative transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.03] active:scale-95"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.leafButton}
                alt={c.name}
                className="h-auto w-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)] transition-[filter] duration-200 group-hover:drop-shadow-[0_16px_28px_rgba(0,0,0,0.5)]"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Ikon telapak tangan menyentuh (garis putih). */
function TouchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12" />
      <path d="M11 11.5v-2a1.5 1.5 0 0 1 3 0V12" />
      <path d="M14 10.5a1.5 1.5 0 0 1 3 0V12" />
      <path d="M17 11.5a1.5 1.5 0 0 1 3 0V16a6 6 0 0 1-6 6h-2a6 6 0 0 1-5.2-3l-2.3-4a1.5 1.5 0 0 1 2.6-1.5L8 15" />
    </svg>
  );
}
