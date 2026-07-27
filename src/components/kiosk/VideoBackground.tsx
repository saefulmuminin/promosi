"use client";

import { useEffect, useRef } from "react";

interface VideoBackgroundProps {
  videoIds: string[];
  /** Bisukan video. WAJIB true agar autoplay diizinkan browser. Default true. */
  muted?: boolean;
  /** Tampilkan kontrol player YouTube (play/volume/seek). Default false. */
  controls?: boolean;
  /** Izinkan klik/interaksi ke video. Default false (mode kiosk = latar saja). */
  interactive?: boolean;
  /** Unmute otomatis saat interaksi/sentuhan pertama di halaman. Default false. */
  unmuteOnFirstInteraction?: boolean;
}

/**
 * Latar video YouTube full-cover yang diputar berulang (loop) melewati beberapa
 * video bergantian. Dipakai di layar idle kiosk (pengganti visual pohon).
 *
 * Catatan penting:
 *  - Browser MEMBLOKIR autoplay bersuara. Jadi video mulai `muted`. Bila
 *    `unmuteOnFirstInteraction` aktif, video di-unmute begitu ada sentuhan/klik
 *    pertama (interaksi pengguna = izin browser untuk memutar suara).
 *  - Butuh koneksi internet. Untuk kiosk OFFLINE, ganti dengan <video> file MP4
 *    lokal dari folder `public/`.
 */
export function VideoBackground({
  videoIds,
  muted = true,
  controls = false,
  interactive = false,
  unmuteOnFirstInteraction = false,
}: VideoBackgroundProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [first, ...rest] = videoIds;
  // Loop seluruh daftar: video pertama di path, sisanya di playlist, lalu ulang.
  const playlist = (rest.length ? rest : [first]).join(",");

  const params = [
    "autoplay=1",
    `mute=${muted ? 1 : 0}`,
    `controls=${controls ? 1 : 0}`,
    "loop=1",
    `playlist=${playlist}`,
    "modestbranding=1",
    "rel=0",
    "iv_load_policy=3", // sembunyikan anotasi
    "cc_load_policy=0", // jangan tampilkan caption/subtitle otomatis
    "playsinline=1",
    "fs=0",
    ...(unmuteOnFirstInteraction ? ["enablejsapi=1"] : []),
  ].join("&");

  const src = `https://www.youtube-nocookie.com/embed/${first}?${params}`;

  // Unmute saat interaksi pertama (sentuhan/klik/keyboard) di mana pun di layar.
  useEffect(() => {
    if (!unmuteOnFirstInteraction) return;

    const send = (func: string, args: unknown[] = []) => {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func, args }),
        "*",
      );
    };

    const onFirst = () => {
      send("unMute");
      send("setVolume", [100]);
      send("playVideo");
      window.removeEventListener("pointerdown", onFirst);
      window.removeEventListener("touchstart", onFirst);
      window.removeEventListener("keydown", onFirst);
    };

    window.addEventListener("pointerdown", onFirst);
    window.addEventListener("touchstart", onFirst);
    window.addEventListener("keydown", onFirst);
    return () => {
      window.removeEventListener("pointerdown", onFirst);
      window.removeEventListener("touchstart", onFirst);
      window.removeEventListener("keydown", onFirst);
    };
  }, [unmuteOnFirstInteraction]);

  return (
    <div
      className={`absolute inset-0 z-0 overflow-hidden bg-black ${
        interactive ? "" : "pointer-events-none"
      }`}
    >
      <iframe
        ref={iframeRef}
        title="Video Latar BAZNAS"
        src={src}
        allow="autoplay; encrypted-media; picture-in-picture"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-0"
        style={{
          width: "100vw",
          height: "56.25vw", // rasio 16:9 terhadap lebar
          minWidth: "177.78vh", // rasio 16:9 terhadap tinggi (agar menutup penuh)
          minHeight: "100vh",
        }}
      />
    </div>
  );
}
