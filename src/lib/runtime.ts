/**
 * Flag runtime yang aman dipakai di client & server.
 *
 * STANDALONE = mode demo tanpa Firebase sama sekali:
 *  - Data transaksi/statistik/daun disimpan di memori server (in-memory).
 *  - Client polling REST (bukan listener Firebase).
 *  - Login admin di-bypass.
 * Cukup `npm run dev` untuk melihat seluruh flow sampai "berhasil".
 *
 * Set NEXT_PUBLIC_STANDALONE_DEMO=false untuk memakai Firebase (produksi).
 */
export const STANDALONE = process.env.NEXT_PUBLIC_STANDALONE_DEMO === "true";
