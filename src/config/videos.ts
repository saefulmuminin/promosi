/**
 * Daftar video YouTube yang diputar berulang (loop) sebagai latar layar idle kiosk.
 * Video diputar bergantian lalu kembali ke awal (playlist loop).
 *
 * Untuk mengganti/menambah video, cukup ubah ID di sini (bagian setelah
 * "youtu.be/" atau "watch?v=").
 */
export const IDLE_VIDEO_IDS = [
  "HhHsooJDqGw", // https://youtu.be/HhHsooJDqGw
  "lB1MfB9GaXM", // https://youtu.be/lB1MfB9GaXM
  "jWU6_0fnuzk", // https://youtu.be/jWU6_0fnuzk
  "HZOfrrkxRU4", // https://youtu.be/HZOfrrkxRU4
];

// --- Perilaku video di layar idle -----------------------------------------
// Catatan: browser hanya mengizinkan AUTOPLAY jika video MUTED. Untuk mendengar
// suara, video harus di-unmute lewat interaksi (butuh CONTROLS + INTERACTIVE).
//
// Mode TESTING (sekarang): bisa diklik & ada kontrol -> bisa play/unmute manual.
// Mode KIOSK final: set CONTROLS & INTERACTIVE ke false (latar bisu, tak bisa
// diutak-atik pengunjung).
export const IDLE_VIDEO_MUTED = true;
export const IDLE_VIDEO_CONTROLS = false; // false = latar bersih tanpa UI YouTube
export const IDLE_VIDEO_INTERACTIVE = false; // false = tak bisa diklik (mode kiosk)
// Unmute otomatis begitu ada sentuhan/klik pertama di layar (video mulai muted).
export const IDLE_VIDEO_UNMUTE_ON_TOUCH = true;
