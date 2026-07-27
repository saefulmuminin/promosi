"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CAMPAIGNS } from "@/config/campaigns";
import { leafColorInfo } from "@/config/leaves";
import { useManajemenAuth } from "@/hooks/useManajemenAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  DEFAULT_KIOSK_SETTINGS,
  loadKioskSettings,
  saveKioskSettings,
  youTubeId,
  type KioskVideoSettings,
} from "@/lib/kiosk-settings";

type Tab = "idle" | "thankyou";
type SaveState = "idle" | "saving" | "saved" | "error";

/** Halaman Manajemen: kelola video awal & video terima kasih per daun. */
export default function ManajemenPage() {
  const router = useRouter();
  const { authed, loading: authLoading } = useManajemenAuth();

  const [settings, setSettings] =
    useState<KioskVideoSettings>(DEFAULT_KIOSK_SETTINGS);
  const [tab, setTab] = useState<Tab>("idle");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Gerbang login.
  useEffect(() => {
    if (!authLoading && !authed) router.replace("/manajemen/login");
  }, [authLoading, authed, router]);

  // Muat pengaturan dari Firestore (sekali).
  useEffect(() => {
    if (!authed) return;
    let alive = true;
    loadKioskSettings()
      .then((s) => {
        if (alive) setSettings(s);
      })
      .catch((e: unknown) => {
        if (alive)
          setLoadError(
            e instanceof Error ? e.message : "Gagal memuat pengaturan.",
          );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [authed]);

  if (authLoading || !authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-on-surface-variant">
        Memuat…
      </main>
    );
  }

  // --- Editor video awal (idle) ---
  const setIdleAt = (i: number, v: string) =>
    setSettings((s) => ({
      ...s,
      idleVideos: s.idleVideos.map((x, j) => (j === i ? v : x)),
    }));
  const addIdle = () =>
    setSettings((s) => ({ ...s, idleVideos: [...s.idleVideos, ""] }));
  const removeIdle = (i: number) =>
    setSettings((s) => ({
      ...s,
      idleVideos: s.idleVideos.filter((_, j) => j !== i),
    }));
  const moveIdle = (i: number, dir: -1 | 1) =>
    setSettings((s) => {
      const arr = [...s.idleVideos];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return s;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...s, idleVideos: arr };
    });

  const setThankYou = (id: string, v: string) =>
    setSettings((s) => ({
      ...s,
      leafThankYouVideos: { ...s.leafThankYouVideos, [id]: v },
    }));

  const onSave = async () => {
    setSave("saving");
    setSaveError(null);
    try {
      const cleaned: KioskVideoSettings = {
        idleVideos: settings.idleVideos.map((v) => v.trim()).filter(Boolean),
        leafThankYouVideos: Object.fromEntries(
          Object.entries(settings.leafThankYouVideos).map(([k, v]) => [
            k,
            v.trim(),
          ]),
        ),
      };
      await saveKioskSettings(cleaned);
      setSettings(cleaned);
      setSave("saved");
      setTimeout(() => setSave("idle"), 2500);
    } catch (e) {
      setSave("error");
      setSaveError(e instanceof Error ? e.message : "Gagal menyimpan.");
    }
  };

  return (
    <DashboardShell
      title="Manajemen Video Kiosk"
      subtitle="Kelola video awal & video terima kasih per daun"
      actionBar={
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 p-4">
          <span className="text-sm text-white/50">
            {save === "saved" && (
              <span className="text-green-300">✓ Tersimpan</span>
            )}
            {save === "error" && (
              <span className="text-red-300">Gagal: {saveError}</span>
            )}
          </span>
          <button
            onClick={onSave}
            disabled={save === "saving"}
            className="rounded-xl bg-baznas-gold px-8 py-3 font-bold text-baznas-navy transition hover:brightness-105 disabled:opacity-50"
          >
            {save === "saving" ? "Menyimpan…" : "Simpan Perubahan"}
          </button>
        </div>
      }
    >
      <div className="mx-auto max-w-4xl">
      {/* Tab menu */}
      <nav className="flex gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5">
        <TabButton active={tab === "idle"} onClick={() => setTab("idle")}>
          Video Awal
        </TabButton>
        <TabButton
          active={tab === "thankyou"}
          onClick={() => setTab("thankyou")}
        >
          Video Terima Kasih
        </TabButton>
      </nav>

      {loadError && (
        <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          Gagal memuat data tersimpan ({loadError}). Menampilkan nilai bawaan —
          perubahan tetap bisa disimpan bila koneksi/izin Firestore tersedia.
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-white/50">Memuat pengaturan…</p>
      ) : tab === "idle" ? (
        <section className="mt-6">
          <p className="text-sm text-white/60">
            Video latar yang diputar bergantian di layar awal (idle). Tempel URL
            atau ID YouTube.
          </p>
          <ul className="mt-4 space-y-3">
            {settings.idleVideos.map((v, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
              >
                <VideoThumb value={v} />
                <input
                  value={v}
                  onChange={(e) => setIdleAt(i, e.target.value)}
                  placeholder="https://youtu.be/xxxxxxxxxxx atau ID"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-baznas-gold"
                />
                <div className="flex shrink-0 items-center gap-1">
                  <IconBtn label="Naik" onClick={() => moveIdle(i, -1)}>
                    ↑
                  </IconBtn>
                  <IconBtn label="Turun" onClick={() => moveIdle(i, 1)}>
                    ↓
                  </IconBtn>
                  <IconBtn
                    label="Hapus"
                    onClick={() => removeIdle(i)}
                    danger
                  >
                    ✕
                  </IconBtn>
                </div>
              </li>
            ))}
            {settings.idleVideos.length === 0 && (
              <li className="rounded-2xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-white/40">
                Belum ada video. Tambahkan minimal satu.
              </li>
            )}
          </ul>
          <button
            onClick={addIdle}
            className="mt-4 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10"
          >
            + Tambah Video
          </button>
        </section>
      ) : (
        <section className="mt-6">
          <p className="text-sm text-white/60">
            Video yang diputar di halaman &ldquo;Pembayaran Berhasil&rdquo; untuk
            setiap daun. Kosongkan untuk memakai video bawaan.
          </p>
          <ul className="mt-4 space-y-3">
            {CAMPAIGNS.map((c) => {
              const leaf = leafColorInfo(c.color);
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
                >
                  <VideoThumb value={settings.leafThankYouVideos[c.id] ?? ""} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{
                          backgroundColor: leaf.hex,
                          boxShadow: `0 0 8px ${leaf.glow}`,
                        }}
                      />
                      <span className="text-sm font-semibold">
                        {c.name}{" "}
                        <span className="font-normal text-white/40">
                          · Daun {leaf.name}
                        </span>
                      </span>
                    </div>
                    <input
                      value={settings.leafThankYouVideos[c.id] ?? ""}
                      onChange={(e) => setThankYou(c.id, e.target.value)}
                      placeholder="URL / ID YouTube (opsional)"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-baznas-gold"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      </div>
    </DashboardShell>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-baznas-gold text-baznas-navy"
          : "text-white/70 hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  danger = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition ${
        danger
          ? "border-red-400/30 text-red-300 hover:bg-red-500/15"
          : "border-white/15 text-white/70 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

/** Pratinjau thumbnail YouTube dari URL/ID (atau kotak kosong bila tidak valid). */
function VideoThumb({ value }: { value: string }) {
  const id = youTubeId(value);
  const valid = /^[\w-]{11}$/.test(id);
  return (
    <div className="relative aspect-video h-14 shrink-0 overflow-hidden rounded-lg bg-black/40 ring-1 ring-white/10">
      {valid ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-white/25">
          ▶
        </div>
      )}
    </div>
  );
}
