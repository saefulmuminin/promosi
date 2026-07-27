/**
 * Provider pembayaran MOCK.
 * Tidak memanggil gateway asli - QRIS palsu + pembayaran disimulasikan
 * lewat endpoint /api/mock/pay. Cocok untuk demo & pengembangan.
 */
import { PAYMENT_COUNTDOWN_SECONDS } from "@/config/constants";
import type {
  PaymentNotification,
  PaymentProvider,
  QrisCharge,
  QrisChargeParams,
} from "./provider";

export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async createQris(params: QrisChargeParams): Promise<QrisCharge> {
    const now = Date.now();
    const expiresAt = now + PAYMENT_COUNTDOWN_SECONDS * 1000;
    // Payload informatif; di kiosk ini dirender jadi QR (hanya untuk tampilan).
    const qrString = [
      "MOCK-QRIS",
      `BAZNAS`,
      params.orderId,
      `AMOUNT:${params.amount}`,
      `EXP:${expiresAt}`,
    ].join("|");

    return { orderId: params.orderId, qrString, expiresAt };
  }

  async verifyNotification(
    body: unknown,
  ): Promise<PaymentNotification | null> {
    const b = (body ?? {}) as Record<string, unknown>;
    const orderId = typeof b.orderId === "string" ? b.orderId : null;
    if (!orderId) return null;

    const event = typeof b.event === "string" ? b.event : "paid";
    const status =
      event === "expire"
        ? "expired"
        : event === "fail"
          ? "failed"
          : "paid";

    return {
      orderId,
      status,
      paymentMethod: "mock-qris",
      raw: body,
    };
  }
}
