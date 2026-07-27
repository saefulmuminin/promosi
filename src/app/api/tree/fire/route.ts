import { LEAF_COLOR_MAP } from "@/config/leaves";
import { sendLeafCommand } from "@/lib/device/rtdb";
import type { LeafColor } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/tree/fire?color=green&leafId=1
 * Uji manual: langsung tulis perintah ke RTDB (/tree/command + /tree/leaves)
 * via Admin SDK — TANPA Firestore, TANPA transaksi. Buat menguji ESP↔RTDB.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const color = (url.searchParams.get("color") || "green") as LeafColor;
  const leafId = Number(url.searchParams.get("leafId") || "1") || 1;

  if (!LEAF_COLOR_MAP[color]) {
    return new Response(
      "color tidak valid. Pakai: green|orange|yellow|blue|purple|red",
      { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  try {
    await sendLeafCommand({
      leafId,
      color,
      txId: `test-${Date.now()}`,
      effect: "flow",
    });
    return new Response(`OK → ${color} (daun ${leafId}) ditulis ke RTDB.`, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(`GAGAL menulis RTDB: ${msg}`, {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
