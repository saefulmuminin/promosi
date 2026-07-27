"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CAMPAIGNS } from "@/config/campaigns";
import { LEAF_COLOR_MAP } from "@/config/leaves";
import { formatRupiah } from "@/lib/format";
import { youTubeId } from "@/lib/kiosk-settings";
import { useKioskVideos } from "@/hooks/useKioskVideos";
import type { CreateTransactionResponse } from "@/lib/types";

interface ThankYouProps {
  tx: CreateTransactionResponse;
  prayer?: string | null;
  onDone: () => void;
}

/** Video yang diputar setelah notifikasi pembayaran berhasil. */
const SUCCESS_VIDEO_ID = "I__kY0EXsEw"; // https://youtu.be/I__kY0EXsEw
const NOTIF_DURATION_MS = 13000; // halaman berhasil tampil 13 detik (cukup membaca doa)
const LOADER_MS = 1000; // loader singkat sebelum video
const DOA_ROTATE_MS = 4000; // ganti doa tiap 4 detik

/**
 * Doa-doa keberkahan yang ditampilkan bergantian untuk donatur.
 * (Doa umum untuk pemberi sedekah — bukan lafal terikat satu riwayat tertentu.)
 */
const DOAS: { ar: string; latin: string; id: string }[] = [
  {
    ar: "جَزَاكُمُ اللّٰهُ خَيْرًا",
    latin: "Jazākumullāhu khairā",
    id: "Semoga Allah membalas Anda dengan balasan yang terbaik.",
  },
  {
    ar: "بَارَكَ اللّٰهُ لَكَ فِيْ مَالِكَ وَأَهْلِكَ",
    latin: "Bārakallāhu laka fī mālika wa ahlik",
    id: "Semoga Allah memberkahi harta dan keluarga Anda.",
  },
  {
    ar: "اللّٰهُمَّ اجْعَلْهَا صَدَقَةً جَارِيَةً",
    latin: "Allāhummaj'alhā ṣadaqatan jāriyah",
    id: "Ya Allah, jadikanlah ia sedekah jariah yang pahalanya terus mengalir.",
  },
];

// --- YouTube IFrame Player API (tipe minimal) ------------------------------
interface YTPlayer {
  unMute: () => void;
  setVolume: (v: number) => void;
  playVideo: () => void;
  destroy: () => void;
}
interface YTPlayerOptions {
  videoId?: string;
  host?: string;
  width?: string | number;
  height?: string | number;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (e: { target: YTPlayer }) => void;
    onStateChange?: (e: { data: number }) => void;
    onError?: (e: { data: number }) => void;
  };
}
interface YTNamespace {
  Player: new (el: HTMLElement, opts: YTPlayerOptions) => YTPlayer;
  PlayerState: { ENDED: number; PLAYING: number };
}
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/**
 * Halaman setelah pembayaran: (1) notifikasi "Pembayaran Berhasil" ±2 dtk,
 * lalu otomatis (2) memutar video bersuara via YouTube IFrame API. Saat video
 * selesai (event ENDED) → loader lalu kembali ke idle.
 */
export function ThankYou({ tx, prayer, onDone }: ThankYouProps) {
  const [phase, setPhase] = useState<"notif" | "loading" | "video">("notif");
  const { settings } = useKioskVideos();

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("loading"), NOTIF_DURATION_MS);
    const t2 = setTimeout(
      () => setPhase("video"),
      NOTIF_DURATION_MS + LOADER_MS,
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Video terima kasih sesuai daun (warna). Fallback ke video bawaan.
  const campaign = CAMPAIGNS.find((c) => c.color === tx.leafColor);
  const configured = campaign ? settings.leafThankYouVideos[campaign.id] : "";
  const videoId = youTubeId(configured || "") || SUCCESS_VIDEO_ID;

  if (phase === "notif") return <SuccessNotif tx={tx} prayer={prayer} />;
  if (phase === "loading") return <LoaderScreen />;
  return <SuccessVideo onDone={onDone} videoId={videoId} />;
}

/** Loader singkat sebelum video diputar. */
function LoaderScreen() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden">
      {/* Background: samakan dengan layar nominal & sukses. */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/Asset%20Pohon%20Sedekah-04.png)" }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/25 via-transparent to-black/40" />
      <div className="relative z-10 h-14 w-14 animate-spin rounded-full border-4 border-white/25 border-t-white" />
      <p className="relative z-10 text-white/85">Menyiapkan video…</p>
    </div>
  );
}

/** Notifikasi pembayaran berhasil + doa keberkahan (latar hijau senada nominal). */
function SuccessNotif({
  tx,
  prayer,
}: {
  tx: CreateTransactionResponse;
  prayer?: string | null;
}) {
  const color = LEAF_COLOR_MAP[tx.leafColor] ?? LEAF_COLOR_MAP.green;
  const [doaIdx, setDoaIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setDoaIdx((i) => (i + 1) % DOAS.length),
      DOA_ROTATE_MS,
    );
    return () => clearInterval(t);
  }, []);

  const doa = DOAS[doaIdx];

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-6 py-8 text-center">
      {/* Background: senada layar nominal (public/Asset Pohon Sedekah-04.png). */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/Asset%20Pohon%20Sedekah-04.png)" }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/30 via-black/10 to-black/45" />

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-5">
        {/* Medali centang */}
        <div className="relative flex h-24 w-24 items-center justify-center">
          <span
            className="absolute inset-0 rounded-full bg-white/70"
            style={{ animation: "successRing 1.6s ease-out infinite" }}
          />
          <span
            className="absolute inset-0 rounded-full bg-white/70"
            style={{ animation: "successRing 1.6s ease-out 0.8s infinite" }}
          />
          <div
            className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#3DAE4B] to-[#1F8A3B] shadow-[0_12px_45px_rgba(0,0,0,0.45)] ring-4 ring-white/80"
            style={{
              animation: "successPop 0.5s cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-14 w-14"
              fill="none"
              stroke="white"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M20 6 9 17l-5-5"
                style={{
                  strokeDasharray: 32,
                  strokeDashoffset: 32,
                  animation: "successCheck 0.45s ease-out 0.35s forwards",
                }}
              />
            </svg>
          </div>
        </div>

        {/* Judul + nominal */}
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-[clamp(1.9rem,3.6vw,3.2rem)] font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            Pembayaran Berhasil!
          </h1>
          <p className="text-[clamp(1.5rem,2.4vw,2.3rem)] font-black text-[#FCE38A] drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
            {formatRupiah(tx.amount)}
          </p>
        </div>

        {/* Kalimat terima kasih */}
        <p className="max-w-xl text-[clamp(0.9rem,1.25vw,1.2rem)] leading-relaxed text-white/90 drop-shadow">
          Terima kasih! Donasi Anda telah menghidupkan satu{" "}
          <span
            className="rounded-md bg-white/90 px-1.5 py-0.5 font-bold"
            style={{ color: color.hex }}
          >
            daun {color.name.toLowerCase()}
          </span>{" "}
          harapan bagi sesama.
        </p>

        {/* Kartu doa (tampil bergantian) */}
        <div className="w-full rounded-3xl border border-white/25 bg-white/10 px-6 py-6 shadow-xl backdrop-blur-md">
          <p className="mb-3 text-[clamp(0.7rem,0.95vw,0.85rem)] font-bold uppercase tracking-[0.25em] text-[#FCE38A]">
            Doa untuk Anda
          </p>
          <div
            key={doaIdx}
            className="flex animate-floatUp flex-col items-center gap-2"
          >
            <p
              dir="rtl"
              lang="ar"
              className="text-[clamp(1.6rem,3vw,2.6rem)] font-semibold leading-[1.9] text-white drop-shadow"
            >
              {doa.ar}
            </p>
            <p className="text-[clamp(0.8rem,1.05vw,1rem)] italic text-white/70">
              {doa.latin}
            </p>
            <p className="max-w-lg text-[clamp(0.9rem,1.2vw,1.15rem)] text-white/90">
              {doa.id}
            </p>
          </div>
          {/* Indikator titik doa */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {DOAS.map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === doaIdx ? "w-6 bg-[#FCE38A]" : "w-2 bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Doa dari donatur (bila mengisi) */}
        {prayer && (
          <div className="w-full max-w-xl rounded-2xl border border-white/25 bg-white/95 px-6 py-4 text-left shadow-lg backdrop-blur">
            <p className="text-sm text-gray-500">
              Doa Anda telah kami aamiin-kan
            </p>
            <p className="mt-1 text-lg italic text-gray-800">
              &ldquo;{prayer}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Video full-screen bersuara via YouTube IFrame API.
 *
 * Andal terhadap "layar hitam": YouTube API yang MEMBUAT iframe di dalam div
 * (bukan attach ke <iframe> milik React yang rapuh), plus watchdog + retry —
 * jika video tak mulai PLAYING dalam beberapa detik, iframe dimuat ulang; bila
 * tetap gagal, kiosk tidak dibiarkan terjebak di layar hitam (langsung selesai).
 * Interaksi diblok overlay agar tampilan tetap bersih. Saat video selesai
 * (ENDED) → loader lalu kembali ke idle.
 */
const MAX_VIDEO_RETRIES = 2;
const VIDEO_START_TIMEOUT_MS = 6000; // batas menunggu video benar-benar jalan

function SuccessVideo({
  onDone,
  videoId,
}: {
  onDone: () => void;
  videoId: string;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const finished = useRef(false);
  const started = useRef(false); // true saat state PLAYING pernah tercapai

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    setLoading(true);
    setTimeout(onDone, 1200);
  }, [onDone]);

  useEffect(() => {
    let cancelled = false;
    started.current = false;

    const create = () => {
      if (cancelled || !hostRef.current || !window.YT?.Player) return;
      // Wadah baru agar YouTube membuat iframe segar setiap percobaan.
      const mount = document.createElement("div");
      mount.style.width = "100%";
      mount.style.height = "100%";
      hostRef.current.replaceChildren(mount);
      try {
        playerRef.current = new window.YT.Player(mount, {
          videoId,
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            mute: 1, // mulai muted agar autoplay dijamin; di-unmute saat onReady
            controls: 0,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (e) => {
              e.target.unMute();
              e.target.setVolume(100);
              e.target.playVideo();
            },
            onStateChange: (e) => {
              if (e.data === window.YT?.PlayerState.PLAYING) {
                started.current = true;
              }
              if (e.data === window.YT?.PlayerState.ENDED) finish();
            },
            // Video tak bisa dimuat (embed dilarang, jaringan, dll.) → jangan
            // biarkan kiosk terjebak; langsung selesai.
            onError: () => finish(),
          },
        });
      } catch {
        /* abaikan; watchdog akan menangani */
      }
    };

    if (window.YT?.Player) {
      create();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        create();
      };
      if (!document.getElementById("yt-iframe-api")) {
        const s = document.createElement("script");
        s.id = "yt-iframe-api";
        s.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(s);
      }
    }

    // Watchdog: jika video belum PLAYING (layar hitam), coba muat ulang; setelah
    // beberapa kali gagal, selesaikan agar kiosk tak terjebak di layar hitam.
    const watchdog = setTimeout(() => {
      if (cancelled || started.current || finished.current) return;
      if (attempt < MAX_VIDEO_RETRIES) setAttempt((a) => a + 1);
      else finish();
    }, VIDEO_START_TIMEOUT_MS);

    // Pengaman bila event ENDED tak terkirim: kembali otomatis setelah 5 menit.
    const maxTimeout = setTimeout(finish, 300_000);

    return () => {
      cancelled = true;
      clearTimeout(watchdog);
      clearTimeout(maxTimeout);
      try {
        playerRef.current?.destroy();
      } catch {
        /* abaikan */
      }
    };
  }, [finish, attempt, videoId]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* Wadah video (YouTube membuat iframe di sini). Sizing "cover" fullscreen. */}
      <div
        ref={hostRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 [&>div]:h-full [&>div]:w-full [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0"
        style={{
          width: "100vw",
          height: "56.25vw",
          minWidth: "177.78vh",
          minHeight: "100vh",
        }}
      />

      {/* Overlay penutup: blokir interaksi agar UI YouTube tak muncul (bersih). */}
      <div className="absolute inset-0 z-10" />

      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/80 backdrop-blur">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/25 border-t-white" />
          <p className="text-lg text-white/80">Kembali ke halaman utama…</p>
        </div>
      )}
    </div>
  );
}
