import { NextResponse } from "next/server";
import { getStore } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/tree - state pohon (leaves + command + devices) untuk polling standalone. */
export async function GET() {
  const tree = await getStore().getTree();
  return NextResponse.json(tree);
}
