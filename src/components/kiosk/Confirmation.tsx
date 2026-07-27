"use client";

import { PROGRAM_MAP } from "@/config/programs";
import { LEAF_COLOR_MAP } from "@/config/leaves";
import { ANONYMOUS_DONOR_NAME } from "@/config/constants";
import { formatRupiah } from "@/lib/format";
import type { Campaign } from "@/config/campaigns";
import type { DonorData } from "@/lib/types";
import type { ReactNode } from "react";

interface ConfirmationProps {
  campaign: Campaign;
  amount: number;
  donor?: DonorData;
  loading: boolean;
  error: string | null;
  onConfirm: () => void;
}

/** Langkah: Konfirmasi pilihan sebelum generate QRIS. */
export function Confirmation({
  campaign,
  amount,
  donor,
  loading,
  error,
  onConfirm,
}: ConfirmationProps) {
  const color = LEAF_COLOR_MAP[campaign.color];

  const rows: { label: string; value: ReactNode }[] = [
    { label: "Kegiatan", value: campaign.name },
    { label: "Program", value: PROGRAM_MAP[campaign.program].name },
    { label: "Nominal", value: formatRupiah(amount) },
    { label: "Nama", value: donor?.name?.trim() || ANONYMOUS_DONOR_NAME },
    {
      label: "Daun",
      value: (
        <span className="flex items-center justify-end gap-2">
          <span
            className="h-6 w-6 rounded-full"
            style={{ backgroundColor: color.hex, boxShadow: `0 0 12px ${color.glow}` }}
          />
          Daun {color.name}
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
        <p className="mb-4 text-center text-gray-500">Anda memilih:</p>
        <dl className="divide-y divide-black/10">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between py-4 text-xl"
            >
              <dt className="text-gray-500">{r.label}</dt>
              <dd className="font-semibold">{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {error && (
        <p className="rounded-xl bg-red-100 px-4 py-3 text-center text-red-600">
          {error}
        </p>
      )}

      <button
        disabled={loading}
        onClick={onConfirm}
        className="rounded-2xl bg-gradient-to-r from-[#3DAE4B] to-[#1F8A3B] px-6 py-5 text-2xl font-bold text-white shadow-[0_10px_30px_rgba(45,140,60,0.4)] transition hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? "Membuat QRIS…" : "Lanjut"}
      </button>
    </div>
  );
}
