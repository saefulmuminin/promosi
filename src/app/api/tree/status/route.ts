import { currentTreeSignal } from "@/lib/server/tree-signal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/tree/status — teks polos: kategori donasi terbaru atau "OFF".
 * Dibaca mesin LP300 (ESP32) tiap ±1 detik (pengganti `status.php`).
 */
export async function GET() {
  return new Response(currentTreeSignal(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
