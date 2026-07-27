import { NextResponse } from "next/server";
import { getStore } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/stats - ringkasan statistik untuk polling standalone. */
export async function GET() {
  const stats = await getStore().getStats();
  return NextResponse.json(stats);
}
