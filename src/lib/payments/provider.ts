/** Kontrak provider pembayaran (QRIS). Implementasi: mock & Midtrans. */
import type { TransactionStatus } from "@/lib/types";

export interface QrisChargeParams {
  orderId: string;
  amount: number;
  /** Nama program untuk deskripsi transaksi. */
  description?: string;
}

export interface QrisCharge {
  orderId: string;
  /** Payload QRIS mentah untuk dirender menjadi kode QR. */
  qrString: string;
  expiresAt: number; // epoch ms
  raw?: unknown;
}

/** Hasil verifikasi notifikasi/callback dari gateway. */
export interface PaymentNotification {
  orderId: string;
  status: Extract<TransactionStatus, "paid" | "expired" | "failed" | "pending">;
  paymentMethod?: string | null;
  raw?: unknown;
}

export interface PaymentProvider {
  readonly name: string;
  /** Buat transaksi QRIS baru di gateway. */
  createQris(params: QrisChargeParams): Promise<QrisCharge>;
  /**
   * Verifikasi & petakan payload webhook menjadi status transaksi.
   * Return null bila payload tidak valid / bukan notifikasi pembayaran.
   */
  verifyNotification(
    body: unknown,
    headers?: Record<string, string>,
  ): Promise<PaymentNotification | null>;
}
