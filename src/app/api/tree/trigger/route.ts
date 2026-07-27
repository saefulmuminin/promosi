import { CAMPAIGN_MAP } from "@/config/campaigns";
import { pushTreeSignal } from "@/lib/server/tree-signal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/tree/trigger?cat=pendidikan — uji manual tanpa transaksi.
 * Memasukkan kategori ke antrian agar LP300 memainkan animasinya.
 */
export async function GET(request: Request) {
  const cat = (new URL(request.url).searchParams.get("cat") || "").trim();
  if (!CAMPAIGN_MAP[cat]) {
    return new Response(
      'Kategori tidak valid. Contoh: ?cat=pendidikan (pendidikan|ekonomi|sosial|dakwah|kesehatan|harapan)',
      { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }
  pushTreeSignal(cat);
  return new Response(`OK -> ${cat}`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
