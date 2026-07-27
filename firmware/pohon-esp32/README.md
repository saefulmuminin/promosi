# Firmware ESP32 (baca Firebase RTDB) — Pohon Donasi BAZNAS · Opsi A

App di **Vercel** → server tulis perintah ke **Firebase RTDB** → **ESP32 baca langsung**.
ESP cukup punya internet (WiFi apa pun), **tidak perlu satu jaringan dengan server**.

```
Kiosk (Vercel)  ──Admin SDK──▶  Firebase RTDB  ◀──stream──  ESP32 (di mana saja, online)
                                /tree/command   (server → device: {id, color, leafId})
                                /tree/status     (device → server: heartbeat online)
```

Hardware sama dengan `pohondonasi/PohonDonasi.ino`: strip WS2812B (GPIO18, 10 LED),
RGB LED katoda (25/26/27), buzzer (GPIO19).

## 1. Firebase (project `pohon-harapan-69dfd`)
1. **Realtime Database** → *Create database* (lokasi mis. Singapore) → salin **databaseURL**.
2. Tab **Rules** → tempel [`database.rules.json`](../../database.rules.json) → *Publish*.
   (`/tree/command` & `/tree/leaves` = read publik; `/tree/status/$id` = tulis bila login.)
3. **Authentication → Email/Password** → aktifkan → tambah user `pohon-01@device.local` + kata sandi.
4. **Firestore** sudah dipakai (transaksi/statistik) — pastikan aktif.

## 2. Deploy app ke Vercel
Import repo ke Vercel, lalu set **Environment Variables**:
```
NEXT_PUBLIC_STANDALONE_DEMO=false
NEXT_PUBLIC_USE_EMULATOR=false
PAYMENT_PROVIDER=mock                      # atau "midtrans"

NEXT_PUBLIC_FIREBASE_API_KEY=<web api key>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pohon-harapan-69dfd
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pohon-harapan-69dfd.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=<databaseURL dari langkah 1>
NEXT_PUBLIC_APP_URL=https://<app>.vercel.app

# Admin SDK (server menulis RTDB/Firestore). Service account JSON, satu baris.
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"pohon-harapan-69dfd", ...}
```
Service account: Console → *Project settings* → *Service accounts* → *Generate new private key* → tempel JSON-nya (satu baris) ke `FIREBASE_SERVICE_ACCOUNT_KEY`.

> Catatan: keluar dari mode demo berarti transaksi/statistik pindah ke Firestore.
> Halaman `/manajemen` (video) tetap seperti sebelumnya.

## 3. Firmware
Library: **Firebase-ESP-Client (Mobizt)** + **FastLED**. Isi di `pohon-esp32.ino`:
`WIFI_SSID`, `WIFI_PASSWORD`, `DATABASE_URL`, `DEVICE_PASSWORD` (dan `API_KEY` bila beda project). Flash.

## 4. Uji
1. Serial Monitor (115200): `WiFi OK` + `POHON DONASI SIAP (RTDB)`.
2. Console → RTDB: node `/tree/status/pohon-01` muncul (`online: true`).
3. Set manual `/tree/command` = `{ "id":"test-1", "color":"green", "leafId":1, "effect":"flow", "ts":1 }`
   → ESP **beep + animasi hijau**. Ubah `id` (mis. `test-2`) + `color` untuk memicu lagi.
4. End-to-end: donasi di kiosk Vercel sampai "Pembayaran Berhasil" → ESP menyala sesuai daun.
5. **/admin → Status Perangkat** menampilkan `pohon-01` Online.

## Catatan
- Tidak perlu ubah kode app: server sudah menulis `/tree/command` tiap donasi sukses
  (`src/lib/device/rtdb.ts`). ESP membaca `color` dari sana.
- RGB LED digital tak bisa menampilkan oranye murni (≈merah); strip WS2812B menampilkan
  warna kategori yang sebenarnya.
- Endpoint `/api/tree/status|reset|trigger` tetap ada sebagai alternatif polling LAN — tidak
  dipakai pada Opsi A.
