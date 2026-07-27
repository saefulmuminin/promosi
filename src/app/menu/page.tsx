"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useManajemenAuth } from "@/hooks/useManajemenAuth";
import { DashboardShell, NAV } from "@/components/dashboard/DashboardShell";
import { MIcon } from "@/components/dashboard/Icon";

/** Beranda dashboard (menu peran perangkat). Wajib login. */
export default function MenuPage() {
  const router = useRouter();
  const { authed, loading } = useManajemenAuth();

  useEffect(() => {
    if (!loading && !authed) router.replace("/manajemen/login");
  }, [loading, authed, router]);

  if (loading || !authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-on-surface-variant">
        Memuat…
      </main>
    );
  }

  const cards = NAV.filter((n) => n.href !== "/menu");

  return (
    <DashboardShell title="Dashboard" subtitle="Panel Kiosk Pohon Donasi BAZNAS">
      {/* Banner sambutan */}
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-baznas-gold/15 via-white/5 to-transparent p-6 sm:p-8">
        <p className="text-baznas-gold text-sm font-semibold tracking-widest">
          BAZNAS
        </p>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
          Selamat datang 👋
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/60 sm:text-base">
          Setiap donasi menyalakan satu daun harapan. Pilih perangkat atau menu
          pengelolaan di bawah untuk memulai.
        </p>
      </section>

      {/* Kartu pintasan */}
      <h3 className="mt-8 text-sm font-semibold uppercase tracking-widest text-white/40">
        Pintasan
      </h3>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-baznas-gold hover:bg-white/10"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <MIcon name={c.icon} className="text-2xl" />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold group-hover:text-secondary">
                {c.label}
              </span>
              <span className="mt-1 block text-sm text-on-surface-variant opacity-80">
                {c.desc}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
