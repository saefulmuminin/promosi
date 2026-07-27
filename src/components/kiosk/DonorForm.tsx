"use client";

import { useState } from "react";

export interface DonorData {
  name: string;
  email: string;
  phone: string;
  prayer: string;
}

interface DonorFormProps {
  onConfirm: (data: DonorData) => void;
}

/**
 * Langkah "Data Donatur & Doa" (opsional). Layout LANDSCAPE agar muat 1 layar.
 * Nama/email/telepon diisi bila donatur ingin menerima bukti donasi (BZN).
 * Boleh dilewati/dikosongkan.
 */
export function DonorForm({ onConfirm }: DonorFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [prayer, setPrayer] = useState("");

  const submit = () =>
    onConfirm({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      prayer: prayer.trim(),
    });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Kiri: data donatur */}
        <div className="flex flex-col gap-3 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-xl font-bold">
              Data Donatur{" "}
              <span className="font-normal text-gray-400">(opsional)</span>
            </h3>
            <p className="text-sm text-gray-500">
              Isi jika ingin menerima bukti donasi (BZN). Boleh dikosongkan.
            </p>
          </div>
          <Field
            label="Nama"
            value={name}
            onChange={setName}
            placeholder="Nama lengkap"
          />
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="email@contoh.com"
          />
          <Field
            label="No. Telepon"
            type="tel"
            value={phone}
            onChange={setPhone}
            placeholder="08xxxxxxxxxx"
          />
        </div>

        {/* Kanan: doa & harapan */}
        <div className="flex flex-col gap-2 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold">
            Doa &amp; Harapan{" "}
            <span className="font-normal text-gray-400">(opsional)</span>
          </h3>
          <p className="text-sm text-gray-500">
            Panjatkan doa atau harapan Anda menyertai donasi ini.
          </p>
          <textarea
            value={prayer}
            onChange={(e) => setPrayer(e.target.value)}
            rows={5}
            maxLength={500}
            placeholder="Tuliskan doa Anda di sini…"
            className="mt-1 flex-1 resize-none rounded-2xl border border-black/10 bg-black/[0.02] p-4 text-lg leading-relaxed outline-none transition-colors focus:border-[#1F8A3B]"
          />
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={submit}
          className="w-full max-w-md rounded-2xl bg-gradient-to-r from-[#3DAE4B] to-[#1F8A3B] px-8 py-5 text-2xl font-black text-white shadow-[0_10px_30px_rgba(45,140,60,0.4)] transition hover:brightness-105 active:scale-[0.98]"
        >
          Lanjut
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-2xl border border-black/10 bg-black/[0.02] px-4 py-3 text-lg outline-none transition-colors focus:border-[#1F8A3B]"
      />
    </label>
  );
}
