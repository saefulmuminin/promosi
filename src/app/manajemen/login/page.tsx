"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useManajemenAuth } from "@/hooks/useManajemenAuth";

/** Halaman login khusus area Manajemen (kelola video kiosk). */
export default function ManajemenLoginPage() {
  const router = useRouter();
  const { authed, loading, login } = useManajemenAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Sudah masuk → langsung ke dashboard (menu).
  useEffect(() => {
    if (!loading && authed) router.replace("/menu");
  }, [loading, authed, router]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (login(password)) {
      router.push("/menu");
    } else {
      setError("Kata sandi salah.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-8"
      >
        <p className="text-baznas-gold text-sm font-semibold tracking-widest">
          BAZNAS
        </p>
        <h1 className="mt-1 text-2xl font-bold">Panel Kiosk BAZNAS</h1>
        <p className="mt-1 text-sm text-white/50">
          Masuk untuk membuka menu perangkat &amp; manajemen.
        </p>

        <label className="mt-6 block text-sm text-white/70">Kata Sandi</label>
        <input
          type="password"
          required
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-baznas-gold"
          placeholder="••••••••"
        />

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

        <button
          type="submit"
          className="mt-6 w-full rounded-xl bg-baznas-gold px-4 py-3 font-bold text-baznas-navy transition hover:brightness-105"
        >
          Masuk
        </button>
      </form>
    </main>
  );
}
