"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useManajemenAuth } from "@/hooks/useManajemenAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MIcon } from "@/components/dashboard/Icon";
import { useStatsSummary } from "@/hooks/useStats";
import { useRecentTransactions } from "@/hooks/useTransactions";
import { useDeviceStatuses } from "@/hooks/useTreeState";
import { CAMPAIGNS } from "@/config/campaigns";
import { LEAF_COLOR_MAP, leafColorInfo } from "@/config/leaves";
import { PROGRAM_MAP } from "@/config/programs";
import { formatDateTime, formatNumber, formatRupiah } from "@/lib/format";
import type { TransactionStatus } from "@/lib/types";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { authed, loading } = useManajemenAuth();
  const stats = useStatsSummary();
  const txs = useRecentTransactions(12);
  const devices = useDeviceStatuses();

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

  const deviceList = Object.entries(devices);
  const onlineCount = deviceList.filter(([, d]) => d.online).length;
  const totalColor =
    Object.values(stats.colorCounts).reduce((a, b) => a + b, 0) || 1;

  return (
    <DashboardShell
      title="Dashboard Admin"
      subtitle="Statistik donasi & perangkat pohon"
    >
      {/* KPI */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon="payments"
          label="Total Donasi"
          value={formatRupiah(stats.totalDonation)}
        />
        <KpiCard
          icon="check_circle"
          label="Transaksi Sukses"
          value={formatNumber(stats.totalTransactions)}
        />
        <KpiCard
          icon="lightbulb"
          label="Daun Menyala"
          value={formatNumber(stats.activeLeaves)}
          tag={<span className="text-xs font-semibold text-leaf-blue">Live</span>}
        />
        <KpiCard
          icon="router"
          label="Perangkat Online"
          value={`${onlineCount}/${deviceList.length}`}
          tag={
            <div className="flex gap-1">
              {deviceList.length === 0 ? (
                <span className="text-xs text-on-surface-variant opacity-50">
                  —
                </span>
              ) : (
                deviceList.map(([id, d]) => (
                  <span
                    key={id}
                    className={`h-2 w-2 rounded-full ${
                      d.online ? "animate-pulse bg-leaf-green" : "bg-leaf-red"
                    }`}
                  />
                ))
              )}
            </div>
          }
        />
      </section>

      {/* Grid utama */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Kiri */}
        <section className="flex flex-col gap-6 lg:col-span-8">
          {/* Riwayat Transaksi */}
          <div className="glass-card overflow-hidden rounded-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h4 className="text-lg font-bold text-on-surface">
                Riwayat Transaksi
              </h4>
            </div>
            <div className="dash-scroll overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/5 bg-white/5 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  <tr>
                    <th className="px-6 py-4">Waktu</th>
                    <th className="px-6 py-4">Program</th>
                    <th className="px-6 py-4">Nominal</th>
                    <th className="px-6 py-4">Daun</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-on-surface">
                  {txs.map((tx) => (
                    <tr key={tx.id} className="transition-colors hover:bg-white/5">
                      <td className="whitespace-nowrap px-6 py-4 opacity-70">
                        {formatDateTime(tx.createdAt)}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {PROGRAM_MAP[tx.program]?.name ?? tx.program}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {formatRupiah(tx.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: LEAF_COLOR_MAP[tx.leafColor]?.hex,
                            boxShadow: `0 0 8px ${LEAF_COLOR_MAP[tx.leafColor]?.glow}`,
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={tx.status} />
                      </td>
                    </tr>
                  ))}
                  {txs.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-10 text-center text-on-surface-variant opacity-50"
                      >
                        Belum ada transaksi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Kartu dekoratif → simulator */}
          <Link
            href="/tree-simulator"
            className="glass-card group relative flex h-56 items-center justify-center overflow-hidden rounded-xl text-center transition hover:border-white/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-leaf-green/10" />
            <div className="relative z-10 px-10">
              <h5 className="text-lg font-bold text-secondary">
                Visualisasi Pertumbuhan Real-time
              </h5>
              <p className="mx-auto mt-1 max-w-md text-sm text-on-surface-variant">
                Sistem monitoring pohon digital BAZNAS yang menghubungkan donasi
                fisik ke representasi cahaya spiritual.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-secondary">
                <MIcon name="open_in_new" className="text-base" /> Buka Simulator
              </span>
            </div>
          </Link>
        </section>

        {/* Kanan */}
        <aside className="flex flex-col gap-6 lg:col-span-4">
          {/* Distribusi Warna Daun */}
          <div className="glass-card rounded-xl p-6">
            <h4 className="mb-6 text-lg font-bold text-on-surface">
              Distribusi Warna Daun
            </h4>
            <div className="space-y-5">
              {CAMPAIGNS.map((c) => {
                const leaf = leafColorInfo(c.color);
                const count = stats.colorCounts[c.color] || 0;
                const pct = Math.round((count / totalColor) * 100);
                return (
                  <div key={c.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: leaf.hex }}
                        />
                        <span className="truncate text-sm font-medium">
                          {c.name}
                        </span>
                      </div>
                      <span className="shrink-0 text-xs text-on-surface-variant opacity-70">
                        {formatNumber(count)} daun ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: leaf.hex,
                          boxShadow: `0 0 5px ${leaf.glow}`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Perangkat */}
          <div className="glass-card rounded-xl p-6">
            <h4 className="mb-6 text-lg font-bold text-on-surface">
              Status Perangkat
            </h4>
            {deviceList.length === 0 ? (
              <p className="text-sm leading-relaxed text-on-surface-variant opacity-60">
                Belum ada perangkat terhubung. Mesin akan muncul otomatis setelah
                menulis heartbeat ke <code>/tree/status</code>.
              </p>
            ) : (
              <div className="space-y-4">
                {deviceList.map(([id, d]) => (
                  <div
                    key={id}
                    className={`flex items-center justify-between rounded-lg bg-white/5 p-3 ${
                      d.online ? "" : "border border-leaf-red/20"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded ${
                          d.online ? "bg-primary-container" : "bg-danger-container/20"
                        }`}
                      >
                        <MIcon
                          name="developer_board"
                          className={`text-base ${d.online ? "" : "text-danger"}`}
                        />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{id}</p>
                        <p
                          className={`text-xs ${
                            d.online
                              ? "text-on-surface-variant opacity-70"
                              : "text-danger opacity-80"
                          }`}
                        >
                          {d.online ? "Terakhir: " : "Terputus: "}
                          {formatDateTime(d.lastSeen)}
                        </p>
                      </div>
                    </div>
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: d.online ? "#4CAF50" : "#F44336",
                        boxShadow: d.online
                          ? "0 0 8px rgba(76,175,80,0.8)"
                          : "0 0 8px rgba(244,67,54,0.8)",
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}

function KpiCard({
  icon,
  label,
  value,
  tag,
}: {
  icon: string;
  label: string;
  value: string;
  tag?: ReactNode;
}) {
  return (
    <div className="glass-card flex flex-col gap-2 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <MIcon name={icon} className="text-secondary" />
        {tag}
      </div>
      <p className="text-xs text-on-surface-variant">{label}</p>
      <h3 className="text-2xl font-bold text-on-surface">{value}</h3>
    </div>
  );
}

const STATUS_META: Record<TransactionStatus, { label: string; cls: string }> = {
  paid: { label: "Lunas", cls: "bg-leaf-green/20 text-leaf-green" },
  pending: { label: "Menunggu", cls: "bg-leaf-yellow/20 text-leaf-yellow" },
  expired: { label: "Kedaluwarsa", cls: "bg-white/10 text-on-surface-variant" },
  failed: { label: "Gagal", cls: "bg-leaf-red/20 text-leaf-red" },
};

function StatusBadge({ status }: { status: TransactionStatus }) {
  const s = STATUS_META[status];
  return (
    <span className={`rounded px-2 py-1 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}
