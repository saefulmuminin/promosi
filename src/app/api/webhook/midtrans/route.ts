import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { applyPaymentResult } from "@/lib/server/transactions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhook/midtrans
 * Endpoint callback pembayaran (set URL ini di dashboard Midtrans:
 * Settings > Configuration > Payment Notification URL).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const provider = getPaymentProvider();
    const notif = await provider.verifyNotification(body);

    if (!notif) {
      // Bukan notifikasi pembayaran yang dikenali - balas 200 agar tidak retry.
      return NextResponse.json({ ignored: true });
    }

    if (notif.status === "pending") {
      return NextResponse.json({ ok: true, status: "pending" });
    }

    const tx = await applyPaymentResult(
      notif.orderId,
      notif.status,
      notif.paymentMethod,
    );

    if (!tx) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, status: tx.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
