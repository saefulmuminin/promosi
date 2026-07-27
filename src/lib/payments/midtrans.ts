/**
 * Provider pembayaran Midtrans (QRIS via Core API).
 * Dokumen: https://docs.midtrans.com/reference/qris
 */
import "server-only";
import { createHash } from "node:crypto";
import type {
  PaymentNotification,
  PaymentProvider,
  QrisCharge,
  QrisChargeParams,
} from "./provider";

const SANDBOX_BASE = "https://api.sandbox.midtrans.com";
const PRODUCTION_BASE = "https://api.midtrans.com";

interface MidtransChargeResponse {
  order_id: string;
  qr_string?: string;
  expiry_time?: string; // "2020-01-01 12:00:00 +0700"
  actions?: Array<{ name: string; method: string; url: string }>;
  status_code?: string;
  status_message?: string;
}

interface MidtransNotification {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_status?: string;
  fraud_status?: string;
  payment_type?: string;
}

export class MidtransPaymentProvider implements PaymentProvider {
  readonly name = "midtrans";
  private readonly serverKey: string;
  private readonly baseUrl: string;

  constructor() {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      throw new Error(
        "MIDTRANS_SERVER_KEY belum di-set. Isi .env.local atau ganti PAYMENT_PROVIDER=mock.",
      );
    }
    this.serverKey = serverKey;
    const isSandbox = process.env.MIDTRANS_IS_SANDBOX !== "false";
    this.baseUrl = isSandbox ? SANDBOX_BASE : PRODUCTION_BASE;
  }

  private authHeader(): string {
    // Basic auth: base64(serverKey + ":")
    const token = Buffer.from(`${this.serverKey}:`).toString("base64");
    return `Basic ${token}`;
  }

  async createQris(params: QrisChargeParams): Promise<QrisCharge> {
    const res = await fetch(`${this.baseUrl}/v2/charge`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: this.authHeader(),
      },
      body: JSON.stringify({
        payment_type: "qris",
        transaction_details: {
          order_id: params.orderId,
          gross_amount: Math.round(params.amount),
        },
        item_details: [
          {
            id: "donasi",
            name: params.description || "Donasi BAZNAS",
            price: Math.round(params.amount),
            quantity: 1,
          },
        ],
        qris: { acquirer: "gopay" },
      }),
    });

    const data = (await res.json()) as MidtransChargeResponse;
    if (!res.ok || !data.qr_string) {
      throw new Error(
        `Midtrans charge gagal: ${data.status_message || res.statusText}`,
      );
    }

    return {
      orderId: data.order_id,
      qrString: data.qr_string,
      expiresAt: parseMidtransTime(data.expiry_time),
      raw: data,
    };
  }

  async verifyNotification(
    body: unknown,
  ): Promise<PaymentNotification | null> {
    const n = (body ?? {}) as MidtransNotification;
    if (!n.order_id || !n.status_code || !n.gross_amount || !n.signature_key) {
      return null;
    }

    // Verifikasi signature: sha512(order_id + status_code + gross_amount + serverKey)
    const expected = createHash("sha512")
      .update(n.order_id + n.status_code + n.gross_amount + this.serverKey)
      .digest("hex");
    if (expected !== n.signature_key) {
      throw new Error("Signature Midtrans tidak valid");
    }

    const status = mapMidtransStatus(n.transaction_status, n.fraud_status);
    if (!status) return null;

    return {
      orderId: n.order_id,
      status,
      paymentMethod: n.payment_type ?? "qris",
      raw: body,
    };
  }
}

function mapMidtransStatus(
  transactionStatus?: string,
  fraudStatus?: string,
): PaymentNotification["status"] | null {
  switch (transactionStatus) {
    case "capture":
      return fraudStatus === "accept" ? "paid" : "pending";
    case "settlement":
      return "paid";
    case "pending":
      return "pending";
    case "expire":
      return "expired";
    case "cancel":
    case "deny":
    case "failure":
      return "failed";
    default:
      return null;
  }
}

/** Konversi "2020-01-01 12:00:00 +0700" -> epoch ms. */
function parseMidtransTime(value?: string): number {
  if (!value) return Date.now() + 180_000;
  // Ubah ke format ISO agar Date bisa parse: "2020-01-01T12:00:00+0700"
  const iso = value.replace(" ", "T").replace(" ", "");
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? Date.now() + 180_000 : ms;
}
