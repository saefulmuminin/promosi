import { popTreeSignal } from "@/lib/server/tree-signal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET/POST /api/tree/reset — device memanggil setelah animasi selesai.
 * Mengeluarkan kategori terdepan dari antrian (pengganti `reset.php`).
 */
function handle() {
  popTreeSignal();
  return new Response("OK", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET() {
  return handle();
}

export async function POST() {
  return handle();
}
