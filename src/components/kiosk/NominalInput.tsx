"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import {
  ANONYMOUS_DONOR_NAME,
  MIN_AMOUNT,
  QUICK_AMOUNTS,
} from "@/config/constants";
import { formatRupiah } from "@/lib/format";
import { OnScreenKeyboard } from "@/components/kiosk/OnScreenKeyboard";
import type { DonorData } from "@/lib/types";

export interface NominalResult {
  amount: number;
  /** null bila donatur tidak mengisi data (checkbox tidak dicentang). */
  donor: DonorData | null;
}

interface NominalInputProps {
  onConfirm: (result: NominalResult) => void;
}

type TextField = "name" | "email" | "phone" | "prayer";

/**
 * Langkah gabungan: Nominal (kiri: display atas + keypad bawah) & Data Donatur
 * opsional (kanan: muncul saat checkbox dicentang, dengan keyboard on-screen
 * untuk layar sentuh).
 */
export function NominalInput({ onConfirm }: NominalInputProps) {
  const [amount, setAmount] = useState<number>(0);
  const [withDonor, setWithDonor] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [prayer, setPrayer] = useState("");
  const [active, setActive] = useState<TextField | null>(null);

  const setters: Record<TextField, Dispatch<SetStateAction<string>>> = {
    name: setName,
    email: setEmail,
    phone: setPhone,
    prayer: setPrayer,
  };
  const maxLen: Record<TextField, number> = {
    name: 60,
    email: 80,
    phone: 20,
    prayer: 500,
  };

  const pressDigit = (d: string) =>
    setAmount((prev) => {
      const next = Number(`${prev}${d}`);
      return Number.isFinite(next) ? Math.min(next, 100_000_000) : prev;
    });
  const backspaceAmount = () => setAmount((prev) => Math.floor(prev / 10));

  const typeChar = (ch: string) => {
    if (!active) return;
    setters[active]((p) => (p + ch).slice(0, maxLen[active]));
  };
  const backspaceText = () => {
    if (active) setters[active]((p) => p.slice(0, -1));
  };

  const valid = amount >= MIN_AMOUNT;
  /** Nama kosong (checkbox mati, atau dicentang tapi belum diisi) → anonim. */
  const anonymous = !withDonor || name.trim() === "";

  const submit = () => {
    if (!valid) return;
    onConfirm({
      amount,
      donor: withDonor
        ? {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            prayer: prayer.trim(),
          }
        : null,
    });
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {/* KIRI: nominal (display atas + keypad bawah) */}
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-black/10 bg-white p-5 text-center shadow-sm">
            <p className="text-sm font-medium uppercase tracking-wide text-gray-400">
              Nominal donasi
            </p>
            <p className="mt-1 bg-gradient-to-br from-[#3DAE4B] to-[#1F8A3B] bg-clip-text text-[clamp(2.2rem,3.6vw,3rem)] font-black leading-none tracking-tight text-transparent">
              {formatRupiah(amount)}
            </p>
            {!valid && amount > 0 && (
              <p className="mt-2 inline-block rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-600">
                Minimal {formatRupiah(MIN_AMOUNT)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {QUICK_AMOUNTS.map((v) => (
              <button
                key={v}
                onClick={() => setAmount(v)}
                className={`rounded-xl border p-3 text-sm font-bold transition-all active:scale-[0.98] ${
                  amount === v
                    ? "border-transparent bg-gradient-to-br from-[#F2C230] to-[#F2A900] text-[#0f2a1a] shadow-[0_6px_16px_rgba(242,169,0,0.45)] ring-1 ring-white/60"
                    : "border-black/10 bg-white text-[#0f2a1a] shadow-sm hover:border-black/20"
                }`}
              >
                {formatRupiah(v)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <NumKey key={d} onClick={() => pressDigit(d)}>
                {d}
              </NumKey>
            ))}
            <NumKey onClick={() => pressDigit("000")} className="text-xl">
              000
            </NumKey>
            <NumKey onClick={() => pressDigit("0")}>0</NumKey>
            <NumKey onClick={backspaceAmount} className="text-red-500">
              ⌫
            </NumKey>
          </div>
        </div>

        {/* KANAN: checkbox + form + keyboard */}
        <div className="flex flex-col gap-4">
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <input
              type="checkbox"
              checked={withDonor}
              onChange={(e) => setWithDonor(e.target.checked)}
              className="mt-1 h-5 w-5 accent-[#1F8A3B]"
            />
            <span>
              <span className="font-semibold">
                Isi data donatur &amp; doa{" "}
                <span className="font-normal text-gray-400">(opsional)</span>
              </span>
              <span className="block text-sm text-gray-500">
                Centang untuk bukti donasi (BZN) atau menuliskan doa.
              </span>
            </span>
          </label>

          {anonymous && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Tanpa mengisi nama, donasi Anda akan dicatat atas nama{" "}
              <span className="font-semibold">{ANONYMOUS_DONOR_NAME}</span>.
            </p>
          )}

          {withDonor && (
            <div className="flex flex-col gap-3 rounded-3xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="grid grid-cols-2 gap-3">
                <TextInput label="Nama" field="name" value={name} active={active} onFocus={setActive} onChange={setName} placeholder="Nama lengkap" />
                <TextInput label="No. Telepon" field="phone" value={phone} active={active} onFocus={setActive} onChange={setPhone} placeholder="08xxxx" />
                <div className="col-span-2">
                  <TextInput label="Email" field="email" value={email} active={active} onFocus={setActive} onChange={setEmail} placeholder="email@contoh.com" />
                </div>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-600">Doa &amp; Harapan</span>
                <textarea
                  value={prayer}
                  onFocus={() => setActive("prayer")}
                  onChange={(e) => setPrayer(e.target.value)}
                  inputMode="none"
                  rows={2}
                  maxLength={500}
                  placeholder="Tuliskan doa Anda…"
                  className={`resize-none rounded-2xl border px-4 py-2.5 text-base outline-none transition-colors ${
                    active === "prayer" ? "border-[#1F8A3B] bg-[#1F8A3B]/5" : "border-black/10 bg-black/[0.02]"
                  }`}
                />
              </label>

              <OnScreenKeyboard
                onKey={typeChar}
                onBackspace={backspaceText}
                onSpace={() => typeChar(" ")}
              />
            </div>
          )}
        </div>
      </div>

      <button
        disabled={!valid}
        onClick={submit}
        className="mx-auto w-full max-w-md rounded-2xl bg-gradient-to-r from-[#F2C230] to-[#F2A900] px-8 py-5 text-2xl font-black text-[#0f2a1a] shadow-[0_12px_30px_rgba(242,169,0,0.5)] ring-1 ring-white/50 transition hover:brightness-105 active:scale-[0.98] disabled:from-white/20 disabled:to-white/10 disabled:text-white/55 disabled:shadow-none disabled:ring-white/25"
      >
        Lanjut
      </button>
    </div>
  );
}

function NumKey({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border border-black/10 bg-white py-3.5 text-2xl font-bold text-[#0f2a1a] shadow-sm transition-all hover:border-black/20 active:scale-[0.98] ${className}`}
    >
      {children}
    </button>
  );
}

function TextInput({
  label,
  field,
  value,
  active,
  onFocus,
  onChange,
  placeholder,
}: {
  label: string;
  field: TextField;
  value: string;
  active: TextField | null;
  onFocus: (f: TextField) => void;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <input
        value={value}
        inputMode="none"
        onFocus={() => onFocus(field)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`rounded-2xl border px-4 py-2.5 text-base outline-none transition-colors ${
          active === field
            ? "border-[#1F8A3B] bg-[#1F8A3B]/5"
            : "border-black/10 bg-black/[0.02]"
        }`}
      />
    </label>
  );
}
