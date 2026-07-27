"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useManajemenAuth } from "@/hooks/useManajemenAuth";
import { MIcon } from "@/components/dashboard/Icon";

export interface NavItem {
  href: string;
  label: string;
  desc: string;
  /** Nama ikon Material Symbols. */
  icon: string;
}

/** Item navigasi dashboard (dipakai sidebar & kartu pintasan di Beranda). */
export const NAV: NavItem[] = [
  {
    href: "/menu",
    label: "Beranda",
    desc: "Ringkasan & pintasan perangkat.",
    icon: "home",
  },
  {
    href: "/kiosk",
    label: "Kiosk Donasi",
    desc: "Layar tablet pengunjung (flow donasi). Juga di halaman utama /.",
    icon: "account_balance_wallet",
  },
  {
    href: "/tree-simulator",
    label: "Simulator Pohon",
    desc: "Tampilan LED pohon (pengganti mesin LD3D untuk uji coba).",
    icon: "forest",
  },
  {
    href: "/admin",
    label: "Dashboard Admin",
    desc: "Statistik donasi & pantauan perangkat.",
    icon: "dashboard",
  },
  {
    href: "/manajemen",
    label: "Manajemen Video",
    desc: "Kelola video awal & video terima kasih tiap daun.",
    icon: "video_library",
  },
];

/**
 * Kerangka dashboard: sidebar tetap + header tetap + konten + footer.
 * Responsif (drawer di mobile). Guard login ditangani masing-masing halaman.
 */
export function DashboardShell({
  title,
  subtitle,
  actionBar,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Bilah aksi menempel di bawah (mis. tombol Simpan). */
  actionBar?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useManajemenAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const doLogout = () => {
    logout();
    router.replace("/manajemen/login");
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Sidebar (desktop) */}
      <SidebarNav
        className="hidden md:flex"
        pathname={pathname}
        onLogout={doLogout}
      />

      {/* Drawer (mobile) */}
      {drawerOpen && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setDrawerOpen(false)}
          />
          <SidebarNav
            className="fixed inset-y-0 left-0 z-50 flex"
            pathname={pathname}
            onLogout={doLogout}
            onNavigate={() => setDrawerOpen(false)}
          />
        </div>
      )}

      {/* Header (tetap) */}
      <header className="fixed right-0 top-0 left-0 z-40 flex items-center justify-between gap-4 border-b border-white/10 bg-background/80 px-5 py-3.5 backdrop-blur-md md:left-64">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Buka menu"
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-white/10 md:hidden"
          >
            <MIcon name="menu" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-secondary">{title}</h2>
            {subtitle && (
              <p className="text-xs text-on-surface-variant opacity-70">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <button
            aria-label="Notifikasi"
            className="hidden rounded-full p-2 text-on-surface-variant transition hover:bg-white/10 sm:block"
          >
            <MIcon name="notifications" />
          </button>
          <div className="hidden h-8 w-px bg-white/10 sm:block" />
          <div className="hidden text-right lg:block">
            <p className="text-sm font-semibold text-on-surface">Admin Utama</p>
            <p className="text-xs text-on-surface-variant opacity-70">
              Super Admin
            </p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-secondary/30 bg-secondary/15 text-secondary">
            <MIcon name="person" />
          </span>
          <button
            onClick={doLogout}
            className="gold-glow rounded-lg bg-secondary-container px-4 py-2 text-sm font-bold text-on-secondary transition active:scale-95"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Kolom konten */}
      <div className="flex min-h-screen flex-col pt-[4.5rem] md:ml-64">
        <main className="dash-scroll flex-1 p-5 sm:p-8">{children}</main>

        {actionBar && (
          <div className="sticky bottom-0 z-30 border-t border-white/10 bg-background/95 backdrop-blur">
            {actionBar}
          </div>
        )}

        <footer className="mt-auto flex flex-col items-center justify-between gap-3 border-t border-white/5 px-5 py-6 text-center text-xs text-on-surface-variant sm:flex-row sm:px-8 sm:text-left">
          <p>© 2026 BAZNAS Pohon Donasi. Seluruh Hak Cipta Dilindungi.</p>
          <div className="flex gap-6">
            <span className="opacity-70">Badan Amil Zakat Nasional</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

/** Sidebar navigasi (dipakai untuk desktop & drawer mobile). */
function SidebarNav({
  className = "",
  pathname,
  onLogout,
  onNavigate,
}: {
  className?: string;
  pathname: string | null;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <aside
      className={`h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-background/95 py-8 shadow-xl backdrop-blur-xl md:fixed md:left-0 md:top-0 md:z-50 ${className}`}
    >
      {/* Brand */}
      <div className="mb-10 px-6">
        <h1 className="text-2xl font-bold text-secondary">Pohon Donasi</h1>
        <p className="text-xs uppercase tracking-widest text-on-surface-variant opacity-70">
          Amanah &amp; Transparan
        </p>
      </div>

      {/* Navigasi */}
      <nav className="flex-grow space-y-1 px-3">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-4 px-4 py-3 text-sm font-semibold transition-colors ${
                active
                  ? "border-r-2 border-secondary text-secondary"
                  : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
              }`}
            >
              <MIcon name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Keluar */}
      <div className="mt-6 border-t border-white/5 px-3 pt-6">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-4 px-4 py-3 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-white/5 hover:text-on-surface"
        >
          <MIcon name="logout" />
          Logout
        </button>
      </div>
    </aside>
  );
}
