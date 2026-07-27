/** Konstanta global instalasi Pohon Donasi BAZNAS. */

/** Jumlah total daun pada pohon fisik (harus sama dengan jumlah LED di ESP32). */
export const TOTAL_LEAVES = 200;

/** Durasi countdown pembayaran QRIS (detik) - sesuai flow: 3 menit. */
export const PAYMENT_COUNTDOWN_SECONDS = 180;

/** ID perangkat pohon default (bila hanya 1 mesin). */
export const DEFAULT_DEVICE_ID = "pohon-01";

/** Nominal cepat (quick amount) yang ditampilkan di kiosk. */
export const QUICK_AMOUNTS = [10000, 25000, 50000, 100000, 250000, 500000];

/** Batas nominal donasi. */
export const MIN_AMOUNT = 1000;
export const MAX_AMOUNT = 100_000_000;

/** Nama donatur bila data tidak diisi (anonim). */
export const ANONYMOUS_DONOR_NAME = "Hamba Allah";

/** Berapa lama layar "Terima kasih" tampil sebelum kembali ke idle (ms). */
export const THANK_YOU_DURATION_MS = 12_000;
