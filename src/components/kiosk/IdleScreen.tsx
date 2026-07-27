"use client";

import { VideoBackground } from "@/components/kiosk/VideoBackground";
import {
  IDLE_VIDEO_CONTROLS,
  IDLE_VIDEO_IDS,
  IDLE_VIDEO_INTERACTIVE,
  IDLE_VIDEO_MUTED,
  IDLE_VIDEO_UNMUTE_ON_TOUCH,
} from "@/config/videos";
import { useKioskVideos } from "@/hooks/useKioskVideos";
import { youTubeId } from "@/lib/kiosk-settings";

/**
 * Layar publik / idle (signage lobi BAZNAS) - tema terang.
 * Panel kiri putih (landing) membaur ke video di kanan. Sentuh layar = suara.
 *
 * Tanpa daftar campaign: SENTUH DI MANA SAJA untuk mulai berdonasi — pengunjung
 * lalu memilih daun kebaikan di layar "Pohon Kehidupan".
 */
export function IdleScreen({ onStart }: { onStart: () => void }) {
  const { settings } = useKioskVideos();
  // ID video dari pengaturan (fallback ke konfigurasi kode bila kosong/invalid).
  const idleIds = settings.idleVideos.map(youTubeId).filter(Boolean);
  const videoIds = idleIds.length ? idleIds : IDLE_VIDEO_IDS;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onStart}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onStart();
        }
      }}
      className="kiosk-surface relative h-full w-full cursor-pointer overflow-hidden outline-none"
      style={{ background: "#ffffff" }}
    >
      {/* Latar video (loop beberapa video YouTube) */}
      <VideoBackground
        videoIds={videoIds}
        muted={IDLE_VIDEO_MUTED}
        controls={IDLE_VIDEO_CONTROLS}
        interactive={IDLE_VIDEO_INTERACTIVE}
        unmuteOnFirstInteraction={IDLE_VIDEO_UNMUTE_ON_TOUCH}
      />

      {/* Scrim putih: panel kiri terang untuk landing, membaur ke video di kanan. */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background: [
            "linear-gradient(180deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0) 12%)",
            "linear-gradient(0deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0) 16%)",
            "linear-gradient(90deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 30%, rgba(255,255,255,0.72) 41%, rgba(255,255,255,0.28) 52%, rgba(255,255,255,0) 64%)",
          ].join(","),
        }}
      />

      {/* Header BAZNAS (kiri atas) */}
      <header className="pointer-events-none absolute left-[3.5%] top-[4%] z-10 flex flex-col items-start gap-1.5">
        <BaznasLogo />
        <div className="pl-1 text-[clamp(0.45rem,0.6vw,0.7rem)] font-bold tracking-[0.25em] text-[#1F8A3B]/80">
          — CAHAYA ZAKAT · KESEJAHTERAAN UMAT —
        </div>
      </header>

      {/* Konten kiri (mulai di bawah logo agar hero tidak menabrak header) */}
      <div className="pointer-events-none absolute left-[3.5%] top-[26%] z-10 flex w-[46%] flex-col gap-6">
        <div className="animate-fade-in-up shrink-0">
          <p className="mb-2 text-[clamp(0.85rem,1.2vw,1.1rem)] font-bold uppercase tracking-[0.2em] text-[#1F8A3B]/90">
            Mari Hidupkan
          </p>
          <h1 className="bg-gradient-to-br from-[#1F8A3B] to-[#0d4a1c] bg-clip-text text-[clamp(2.6rem,4.6vw,5.4rem)] font-black leading-[1.05] tracking-tight text-transparent drop-shadow-sm">
            Pohon Harapan
            <br />
            BAZNAS
          </h1>
          <p className="mt-4 text-[clamp(0.95rem,1.3vw,1.35rem)] font-medium leading-relaxed text-gray-500">
            Setiap donasi menyalakan satu daun harapan.
          </p>
        </div>
      </div>

      {/* Notifikasi (tengah bawah): teks bersih, tanpa tombol & tanpa ikon */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[8%] z-10 flex justify-center px-6">
        <p className="animate-pulse text-center text-[clamp(1.05rem,1.9vw,1.9rem)] font-semibold tracking-[0.03em] text-[#0d4a1c] [text-shadow:0_1px_12px_rgba(255,255,255,0.85)]">
          Sentuh di mana saja untuk berdonasi
        </p>
      </div>

      {/* Hashtag (kanan bawah) - di area video, beri drop-shadow agar terbaca */}
      <div className="pointer-events-none absolute bottom-[4%] right-[3%] z-10 text-right text-[clamp(1.1rem,1.8vw,2rem)] font-black leading-[1.1] tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
        <span className="text-[#F1C40F] drop-shadow-md">#</span>Berzakat
        <br />
        Tumbuhkan
        <br />
        Harapan
      </div>
    </div>
  );
}

/** Logo resmi BAZNAS (public/logo.png) - versi berwarna, cocok di latar terang. */
function BaznasLogo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="BAZNAS — Badan Amil Zakat Nasional"
      className="h-[clamp(3rem,7vh,5.5rem)] w-auto object-contain"
    />
  );
}
