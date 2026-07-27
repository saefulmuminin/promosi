"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { LEAF_COLOR_MAP } from "@/config/leaves";
import { formatCountdown, formatRupiah } from "@/lib/format";
import { useTransactionStatus } from "@/hooks/useTransaction";
import type { CreateTransactionResponse } from "@/lib/types";

interface QrisPaymentProps {
  tx: CreateTransactionResponse;
  onPaid: () => void;
  onExpired: () => void;
  onCancel: () => void;
}

// Mode mock/demo: QRIS otomatis "berhasil" setelah jeda ini (meniru scan+bayar).
const AUTO_SUCCESS_MS = 4500;

/** Langkah 6-8: Tampilkan QRIS, countdown, dan pantau status pembayaran. */
export function QrisPayment({ tx, onPaid, onExpired, onCancel }: QrisPaymentProps) {
  const status = useTransactionStatus(tx.id);
  const [remaining, setRemaining] = useState<number>(
    Math.max(0, Math.floor((tx.expiresAt - Date.now()) / 1000)),
  );
  const [simulating, setSimulating] = useState(false);
  const color = LEAF_COLOR_MAP[tx.leafColor];

  // Countdown
  useEffect(() => {
    const t = setInterval(() => {
      const secs = Math.max(0, Math.floor((tx.expiresAt - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [tx.expiresAt]);

  // Reaksi terhadap status realtime
  useEffect(() => {
    if (status?.status === "paid") onPaid();
    else if (status?.status === "expired" || status?.status === "failed") {
      onExpired();
    }
  }, [status?.status, onPaid, onExpired]);

  // Countdown habis
  useEffect(() => {
    if (remaining <= 0) onExpired();
  }, [remaining, onExpired]);

  const simulatePay = useCallback(async () => {
    setSimulating(true);
    try {
      await fetch("/api/mock/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: tx.orderId, event: "paid" }),
      });
      // status akan berubah via poll/listener -> onPaid dipanggil otomatis.
    } finally {
      setSimulating(false);
    }
  }, [tx.orderId]);

  // Mode mock: otomatis "berhasil" setelah jeda (kiosk demo tanpa perlu tap).
  const autoFired = useRef(false);
  useEffect(() => {
    if (!tx.mock || autoFired.current) return;
    const timer = setTimeout(() => {
      autoFired.current = true;
      void simulatePay();
    }, AUTO_SUCCESS_MS);
    return () => clearTimeout(timer);
  }, [tx.mock, simulatePay]);

  const urgent = remaining <= 30;

  return (
    <div className="flex flex-col gap-5">
      {/* Countdown */}
      <div className="mx-auto flex items-center gap-3 rounded-full border border-black/10 bg-white px-6 py-2.5 shadow-sm">
        <span
          className={`h-3 w-3 rounded-full ${
            urgent
              ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]"
              : "bg-[#1F8A3B] shadow-[0_0_10px_rgba(31,138,59,0.5)]"
          } animate-pulse`}
        />
        <span className="text-[1.05rem] tracking-wide text-gray-600">
          Bayar dalam{" "}
          <span
            className={`ml-1 font-black tracking-wider ${urgent ? "text-red-500" : "text-[#1F8A3B]"}`}
          >
            {formatCountdown(remaining)}
          </span>
        </span>
      </div>

      {/* Landscape: QR (kiri) + info (kanan) */}
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-stretch sm:justify-center">
        <div className="flex items-center justify-center rounded-3xl border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
          <QRCodeCanvas value={tx.qrString} size={240} includeMargin level="M" />
        </div>

        <div className="flex flex-1 flex-col justify-center gap-4 sm:max-w-xs">
          <div className="rounded-3xl border border-black/10 bg-black/[0.03] p-5 text-center">
            <p className="text-[0.85rem] font-medium uppercase tracking-wide text-gray-500">
              Total donasi
            </p>
            <p className="mt-1 text-[2.4rem] font-black tracking-tight text-[#1F8A3B]">
              {formatRupiah(tx.amount)}
            </p>
            <div className="mt-3 inline-flex items-center justify-center gap-3 rounded-full border border-black/10 bg-black/5 px-4 py-2">
              <span className="text-[0.9rem] font-medium text-gray-700">
                Daun No. {tx.leafId}
              </span>
              <span className="h-4 w-1 rounded-full bg-black/20" />
              <span className="flex items-center gap-2 text-[0.9rem] font-medium text-gray-700">
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full"
                  style={{ backgroundColor: color.hex, boxShadow: `0 0 8px ${color.glow}` }}
                />
                {color.name}
              </span>
            </div>
          </div>

          {tx.mock && (
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={simulatePay}
                disabled={simulating}
                className="w-full rounded-2xl border border-dashed border-[#1F8A3B]/50 bg-[#1F8A3B]/10 px-6 py-3 font-semibold text-[#1F8A3B] disabled:opacity-50"
              >
                {simulating
                  ? "Memproses pembayaran…"
                  : "🧪 Bayar sekarang (mode demo)"}
              </button>
              <p className="text-center text-xs text-gray-400">
                Mode demo: pembayaran otomatis berhasil dalam beberapa detik.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Batalkan */}
      <button
        onClick={onCancel}
        className="mx-auto text-gray-500 underline underline-offset-4"
      >
        Batalkan
      </button>
    </div>
  );
}
