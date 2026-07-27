/**
 * Tipe data bersama untuk seluruh aplikasi Pohon Donasi BAZNAS.
 * Kontrak data ini dipakai kiosk, API, dan mesin ESP32 (via RTDB).
 */

/** Program donasi (mengikuti flow: Zakat / Infaq / Sedekah). */
export type ProgramId = "zakat" | "infaq" | "sedekah";

/**
 * Warna daun resmi BAZNAS (poster "Pilih Daun Kebaikanmu"):
 * Hijau=Pendidikan, Jingga=Ekonomi, Kuning=Sosial, Biru=Dakwah,
 * Ungu=Kesehatan, Merah=Harapan/Doa.
 */
export type LeafColor =
  | "green"
  | "orange"
  | "yellow"
  | "blue"
  | "purple"
  | "red";

/** Status siklus hidup transaksi donasi. */
export type TransactionStatus =
  | "pending" // QRIS dibuat, menunggu pembayaran
  | "paid" // pembayaran sukses (callback gateway)
  | "expired" // countdown habis / QRIS kedaluwarsa
  | "failed"; // gagal / dibatalkan

/** Efek pencahayaan pada mesin pohon. */
export type LeafEffect = "flow" | "fade" | "off";

/** Dokumen transaksi di Firestore: `transactions/{id}`. */
export interface Transaction {
  id: string;
  program: ProgramId;
  /** Sub-program / kegiatan spesifik (opsional), mis. "pendidikan". */
  cause?: string | null;
  amount: number; // rupiah
  leafId: number;
  leafColor: LeafColor;
  status: TransactionStatus;
  /** Order ID di sisi payment gateway (Midtrans order_id). */
  orderId: string;
  /** Payload string QRIS (untuk dirender jadi QR di kiosk). */
  qrString: string | null;
  createdAt: number; // epoch ms
  expiresAt: number; // epoch ms
  paidAt: number | null; // epoch ms
  /** Nama metode pembayaran hasil callback (mis. "gopay", "qris"). */
  paymentMethod?: string | null;
  /** Data donatur (opsional, untuk bukti donasi/BZN). */
  donorName?: string | null;
  donorEmail?: string | null;
  donorPhone?: string | null;
  /** Doa & harapan dari donatur (opsional). */
  prayer?: string | null;
}

/** Ringkasan statistik agregat: `stats/summary`. */
export interface StatsSummary {
  totalDonation: number; // total rupiah terverifikasi
  totalTransactions: number; // jumlah transaksi sukses
  activeLeaves: number; // jumlah daun menyala
  colorCounts: Record<LeafColor, number>;
  updatedAt: number;
}

/** State satu daun di RTDB: `/tree/leaves/{leafId}`. */
export interface LeafState {
  on: boolean;
  color: LeafColor;
  effect: LeafEffect;
  txId: string | null;
  updatedAt: number;
}

/** Perintah efek terakhir di RTDB: `/tree/command`. */
export interface TreeCommand {
  id: string;
  leafId: number;
  color: LeafColor;
  effect: LeafEffect;
  ts: number;
}

/** Heartbeat/ACK perangkat: `/tree/status/{deviceId}`. */
export interface DeviceStatus {
  online: boolean;
  lastSeen: number;
  currentLeaf: number | null;
  firmware?: string;
}

/** Data donatur opsional (nama/email/telepon + doa) dari form kiosk. */
export interface DonorData {
  name: string;
  email: string;
  phone: string;
  prayer: string;
}

/** Body request pembuatan transaksi dari kiosk. */
export interface CreateTransactionRequest {
  program: ProgramId;
  cause?: string | null;
  amount: number;
  leafColor: LeafColor;
  donorName?: string | null;
  donorEmail?: string | null;
  donorPhone?: string | null;
  prayer?: string | null;
}

/** Response pembuatan transaksi ke kiosk. */
export interface CreateTransactionResponse {
  id: string;
  orderId: string;
  qrString: string;
  amount: number;
  leafId: number;
  leafColor: LeafColor;
  expiresAt: number;
  /** True bila memakai provider mock (kiosk menampilkan tombol simulasi). */
  mock: boolean;
}
