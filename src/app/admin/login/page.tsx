"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin");
    } catch {
      setError("Email atau kata sandi salah.");
    } finally {
      setLoading(false);
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
        <h1 className="mt-1 text-2xl font-bold">Dashboard Admin</h1>
        <p className="mt-1 text-sm text-white/50">
          Masuk untuk melihat statistik donasi.
        </p>

        <label className="mt-6 block text-sm text-white/70">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-baznas-gold"
          placeholder="admin@baznas.go.id"
        />

        <label className="mt-4 block text-sm text-white/70">Kata Sandi</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-baznas-gold"
          placeholder="••••••••"
        />

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-baznas-gold px-4 py-3 font-bold text-baznas-navy disabled:opacity-50"
        >
          {loading ? "Memproses…" : "Masuk"}
        </button>
      </form>
    </main>
  );
}
