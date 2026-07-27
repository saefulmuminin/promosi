import { NextResponse } from "next/server";
import { applyPaymentResult } from "@/lib/server/transactions";
import type { TransactionStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/mock/pay  { orderId, event?: "paid" | "expire" | "fail" }
 * Simulasi callback pembayaran. HANYA aktif saat PAYMENT_PROVIDER=mock.
 * Dipakai tombol "Simulasikan Pembayaran" di kiosk saat mode demo.
 */
export async function POST(request: Request) {
  if ((process.env.PAYMENT_PROVIDER || "mock").toLowerCase() !== "mock") {
    return NextResponse.json(
      { error: "Simulasi hanya tersedia pada mode mock" },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as {
      orderId?: string;
      event?: string;
    };
    if (!body.orderId) {
      return NextResponse.json({ error: "orderId wajib" }, { status: 400 });
    }

    const status: TransactionStatus =
      body.event === "expire"
        ? "expired"
        : body.event === "fail"
          ? "failed"
          : "paid";

    const tx = await applyPaymentResult(body.orderId, status, "mock-qris");
    if (!tx) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, status: tx.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
