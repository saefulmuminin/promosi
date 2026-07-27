import { NextResponse } from "next/server";
import { getStore } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/transactions/[id] - status transaksi (polling kiosk). */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const tx = await getStore().getTransaction(params.id);
  if (!tx) {
    return NextResponse.json(
      { error: "Transaksi tidak ditemukan" },
      { status: 404 },
    );
  }
  return NextResponse.json(tx);
}
