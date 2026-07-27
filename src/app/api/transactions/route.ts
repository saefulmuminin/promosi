import { NextResponse } from "next/server";
import { createDonationTransaction } from "@/lib/server/transactions";
import { getStore } from "@/lib/server/store";
import type { CreateTransactionRequest } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/transactions - buat transaksi donasi + QRIS. */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateTransactionRequest;
    const result = await createDonationTransaction(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** GET /api/transactions - daftar transaksi terbaru (dipakai dashboard polling). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const max = Math.min(Number(searchParams.get("limit")) || 25, 100);
  const txs = await getStore().listTransactions(max);
  return NextResponse.json({ transactions: txs });
}
