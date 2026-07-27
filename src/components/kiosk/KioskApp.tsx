"use client";

import { useCallback, useState } from "react";
import { IdleScreen } from "@/components/kiosk/IdleScreen";
import { LeafOptionSelect } from "@/components/kiosk/LeafOptionSelect";
import { StepShell } from "@/components/kiosk/StepShell";
import { NominalInput } from "@/components/kiosk/NominalInput";
import { QrisPayment } from "@/components/kiosk/QrisPayment";
import { ThankYou } from "@/components/kiosk/ThankYou";
import { ANONYMOUS_DONOR_NAME } from "@/config/constants";
import type { Campaign } from "@/config/campaigns";
import type {
  CreateTransactionResponse,
  DonorData,
} from "@/lib/types";

type Step = "idle" | "campaign" | "nominal" | "thankyou";

interface Draft {
  campaign?: Campaign;
  amount?: number;
  donor?: DonorData;
}

const TOTAL_STEPS = 2;

/** Aplikasi kiosk donasi. Flow dipangkas: QRIS tampil sebagai MODAL (tanpa step konfirmasi). */
export function KioskApp() {
  const [step, setStep] = useState<Step>("idle");
  const [draft, setDraft] = useState<Draft>({});
  const [tx, setTx] = useState<CreateTransactionResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const reset = useCallback(() => {
    setDraft({});
    setTx(null);
    setCreateError(null);
    setIsStarting(false);
    setIsVerifying(false);
    setStep("idle");
  }, []);

  const createTransaction = useCallback(
    async (amount: number, donor: DonorData | null) => {
      const campaign = draft.campaign;
      if (!campaign) return;
      setCreating(true);
      setCreateError(null);
      try {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            program: campaign.program,
            cause: campaign.id,
            amount,
            leafColor: campaign.color,
            donorName: donor?.name?.trim() || ANONYMOUS_DONOR_NAME,
            donorEmail: donor?.email || null,
            donorPhone: donor?.phone || null,
            prayer: donor?.prayer || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal membuat transaksi");
        setTx(data as CreateTransactionResponse); // -> modal QRIS muncul
      } catch (err) {
        setCreateError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setCreating(false);
      }
    },
    [draft.campaign],
  );

  const onPaid = useCallback(() => {
    setIsVerifying(true);
    setTimeout(() => {
      setStep("thankyou");
      setIsVerifying(false);
    }, 1500);
  }, []);
  const closeQris = useCallback(() => setTx(null), []);

  switch (step) {
    case "idle":
      return (
        <Screen key="idle">
          <IdleScreen onStart={() => setStep("campaign")} />
        </Screen>
      );

    case "campaign":
      return (
        <Screen key="campaign">
          <LeafOptionSelect
            onBack={() => setStep("idle")}
            onSelect={(campaign) => {
              setIsStarting(true);
              setTimeout(() => {
                setDraft((d) => ({ ...d, campaign }));
                setStep("nominal");
                setIsStarting(false);
              }, 800);
            }}
          />

          {/* Loader saat transisi pilih daun -> nominal */}
          {isStarting && (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-black/60 backdrop-blur-md transition-opacity">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-[#3DAE4B]" />
              <p className="text-xl font-bold tracking-wide text-white drop-shadow-md">
                Menyiapkan Kebaikan...
              </p>
            </div>
          )}
        </Screen>
      );

    case "nominal":
      return (
        <Screen key="nominal">
          {/* Background: samakan dengan layar "Pohon Kehidupan" (public/Asset Pohon Sedekah-04.png). */}
          <div
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url(/Asset%20Pohon%20Sedekah-04.png)" }}
          />
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/25 via-transparent to-black/30" />
          <div className="relative z-10 h-full w-full">
            <StepShell
              onDark
              step={2}
              total={TOTAL_STEPS}
              title="Nominal & Data Donasi"
              subtitle="Pilih nominal — isi data & doa jika ingin (opsional)"
              onBack={() => setStep("campaign")}
            >
              <NominalInput
                onConfirm={({ amount, donor }) => {
                  setDraft((d) => ({ ...d, amount, donor: donor ?? undefined }));
                  createTransaction(amount, donor);
                }}
              />
            </StepShell>
          </div>

          {/* Loading saat membuat QRIS */}
          {creating && (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/50 backdrop-blur-sm">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/25 border-t-white" />
              <p className="text-lg text-white/90">Membuat QRIS…</p>
            </div>
          )}

          {/* Error pembuatan transaksi */}
          {createError && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
              <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
                <p className="text-lg font-semibold text-red-600">
                  {createError}
                </p>
                <button
                  onClick={() => setCreateError(null)}
                  className="mt-4 rounded-xl bg-black/5 px-6 py-2 font-medium text-gray-700 hover:bg-black/10"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}

          {/* Modal QRIS */}
          {tx && (
            <QrisModal
              tx={tx}
              onPaid={onPaid}
              onExpired={closeQris}
              onClose={closeQris}
            />
          )}

          {/* Loader saat memverifikasi pembayaran */}
          {isVerifying && (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-black/60 backdrop-blur-md transition-opacity">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-[#3DAE4B]" />
              <p className="text-xl font-bold tracking-wide text-white drop-shadow-md">
                Memverifikasi Pembayaran...
              </p>
            </div>
          )}
        </Screen>
      );

    case "thankyou":
      return (
        <Screen key="thankyou">
          {tx && (
            <ThankYou tx={tx} prayer={draft.donor?.prayer} onDone={reset} />
          )}
        </Screen>
      );
  }
}

/** Modal pembayaran QRIS (overlay di atas halaman nominal). */
function QrisModal({
  tx,
  onPaid,
  onExpired,
  onClose,
}: {
  tx: CreateTransactionResponse;
  onPaid: () => void;
  onExpired: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="relative max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-gray-500 transition hover:bg-black/10"
        >
          ✕
        </button>
        <h2 className="mb-4 text-center text-xl font-black text-[#0f2a1a]">
          Scan QRIS untuk Membayar
        </h2>
        <QrisPayment
          tx={tx}
          onPaid={onPaid}
          onExpired={onExpired}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}

/** Bingkai kiosk fullscreen (rasio tablet). Beranimasi masuk tiap layar tampil. */
function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="animate-page-in fixed inset-0 text-[#0f2a1a]"
      style={{
        background: "radial-gradient(ellipse at top, #ffffff 0%, #eef4ea 100%)",
      }}
    >
      {children}
    </div>
  );
}
