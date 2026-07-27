"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CAMPAIGNS } from "@/config/campaigns";
import type { Campaign } from "@/config/campaigns";
import { leafColorInfo } from "@/config/leaves";

interface CampaignSelectProps {
  onSelect: (campaign: Campaign) => void;
}

/**
 * Langkah "Pilih Daun Kebaikanmu". Kartu menampilkan banner UTUH (16:9, tanpa
 * crop). Info (nama + pill warna daun) tampil sebagai card yang muncul saat
 * hover (slide-up) — juga tampil saat kartu terpilih (untuk layar sentuh).
 */
export function CampaignSelect({ onSelect }: CampaignSelectProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = CAMPAIGNS.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CAMPAIGNS.map((c, i) => (
          <CampaignCard
            key={c.id}
            campaign={c}
            index={i}
            selected={c.id === selectedId}
            onClick={() => setSelectedId(c.id)}
          />
        ))}
      </div>

      <button
        disabled={!selected}
        onClick={() => selected && onSelect(selected)}
        className="mx-auto w-full max-w-md rounded-2xl bg-gradient-to-r from-[#3DAE4B] to-[#1F8A3B] px-8 py-5 text-2xl font-black text-white shadow-[0_10px_30px_rgba(45,140,60,0.4)] transition hover:brightness-105 active:scale-[0.98] disabled:opacity-30 disabled:shadow-none"
      >
        {selected ? "Lanjut" : "Pilih daun kebaikanmu dulu"}
      </button>
    </div>
  );
}

function CampaignCard({
  campaign,
  index,
  selected,
  onClick,
}: {
  campaign: Campaign;
  index: number;
  selected: boolean;
  onClick: () => void;
}) {
  const leaf = leafColorInfo(campaign.color);

  return (
    <button
      onClick={onClick}
      className="group relative aspect-video animate-floatUp overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/10 transition-transform duration-300 active:scale-[0.98]"
      style={{
        animationDelay: `${index * 70}ms`,
        ...(selected
          ? { boxShadow: `0 0 0 3px ${leaf.hex}, 0 0 26px 2px ${leaf.hex}80` }
          : {}),
      }}
    >
      {/* Banner UTUH (16:9, tanpa crop) */}
      <CampaignBanner campaign={campaign} />

      {/* Centang saat terpilih */}
      {selected && (
        <div
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-lg"
          style={{ backgroundColor: leaf.hex }}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="white"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
      )}

      {/* Card info: muncul saat hover / terpilih (slide-up + fade) */}
      <div
        className={`absolute inset-x-0 bottom-0 transition-all duration-300 ease-out ${
          selected
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
        }`}
      >
        <div
          className="p-4"
          style={{
            background: `linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.72) 55%, rgba(0,0,0,0) 100%), linear-gradient(to top, ${leaf.hex}55 0%, transparent 60%)`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: leaf.hex,
                boxShadow: `0 0 16px ${leaf.glow}`,
              }}
            >
              <CampaignIcon id={campaign.id} />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-black leading-tight text-white drop-shadow">
                {campaign.name}
              </div>
              <div className="line-clamp-1 text-xs text-white/75">
                {campaign.title}
              </div>
            </div>
          </div>

          <div className="mt-2 flex w-fit items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 backdrop-blur">
            <span className="text-xs text-white/70">Daun akan berwarna</span>
            <span
              className="flex items-center gap-1 text-xs font-bold"
              style={{ color: leaf.hex }}
            >
              <LeafGlyph hex={leaf.hex} />
              {leaf.name}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

/** Banner campaign (dari public/campaigns) dengan fallback placeholder berwarna. */
function CampaignBanner({ campaign }: { campaign: Campaign }) {
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const leaf = leafColorInfo(campaign.color);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setError(true);
  }, []);

  if (error) {
    return (
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${leaf.hex} 0%, rgba(0,0,0,0.6) 100%)`,
        }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={campaign.banner}
      alt={campaign.title}
      className="absolute inset-0 h-full w-full object-cover"
      onError={() => setError(true)}
    />
  );
}

/** Ikon garis putih per campaign. */
function CampaignIcon({ id }: { id: string }) {
  return <Svg>{ICON_PATHS[id] ?? null}</Svg>;
}

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const ICON_PATHS: Record<string, ReactNode> = {
  pendidikan: (
    <>
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </>
  ),
  ekonomi: (
    <>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </>
  ),
  kesehatan: (
    <>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
      <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
    </>
  ),
  dakwah: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  sosial: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  harapan: (
    <>
      <path d="M12 2v8" />
      <path d="m4.93 10.93 1.41 1.41" />
      <path d="M2 18h20" />
      <path d="m19.07 10.93-1.41 1.41" />
      <path d="M22 22H2" />
      <path d="m8 6 4-4 4 4" />
      <path d="M16 18a4 4 0 0 0-8 0" />
    </>
  ),
};

/** Daun mini untuk pill warna. */
function LeafGlyph({ hex }: { hex: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill={hex}>
      <path d="M12 3C7 8 6 14 12 21C18 14 17 8 12 3Z" />
    </svg>
  );
}
