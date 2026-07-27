/**
 * Sinyal sederhana untuk mesin pohon LP300 (ESP32) yang bekerja dengan cara
 * *polling HTTP* — kompatibel dengan firmware `pohondonasi/PohonDonasi.ino`
 * (yang semula membaca `status.php`/`reset.php`).
 *
 * Alur:
 *   - Donasi sukses  → pushTreeSignal(kategori)   (server)
 *   - ESP32 GET /api/tree/status → kategori terdepan, atau "OFF"
 *   - ESP32 selesai animasi → GET /api/tree/reset → keluarkan item terdepan
 *
 * Antrian (FIFO) supaya donasi beruntun tidak hilang saat animasi sedang jalan.
 * State di memori proses (cukup untuk 1 server kiosk, seperti `status.txt`).
 */
import "server-only";

const QUEUE_MAX = 50;
const queue: string[] = [];

/** Kategori (campaign id) donasi terbaru. Dipanggil saat pembayaran sukses. */
export function pushTreeSignal(category: string): void {
  const cat = (category || "").trim();
  if (!cat) return;
  if (queue.length >= QUEUE_MAX) queue.shift();
  queue.push(cat);
}

/** Kategori terdepan yang harus dimainkan device, atau "OFF" bila kosong. */
export function currentTreeSignal(): string {
  return queue[0] ?? "OFF";
}

/** Tandai kategori terdepan selesai (device memanggil setelah animasi). */
export function popTreeSignal(): void {
  queue.shift();
}
