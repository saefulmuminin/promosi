/** Factory pemilih provider pembayaran berdasarkan env PAYMENT_PROVIDER. */
import "server-only";
import type { PaymentProvider } from "./provider";
import { MockPaymentProvider } from "./mock";
import { MidtransPaymentProvider } from "./midtrans";

let cached: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;

  const kind = (process.env.PAYMENT_PROVIDER || "mock").toLowerCase();
  switch (kind) {
    case "midtrans":
      cached = new MidtransPaymentProvider();
      break;
    case "mock":
    default:
      cached = new MockPaymentProvider();
      break;
  }
  return cached;
}

export type { PaymentProvider } from "./provider";
export type {
  QrisCharge,
  QrisChargeParams,
  PaymentNotification,
} from "./provider";
