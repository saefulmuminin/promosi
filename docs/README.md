# 🌳 Pohon Donasi Interaktif BAZNAS

Instalasi kiosk donasi interaktif: pengunjung berdonasi (Zakat/Infaq/Sedekah)
lewat **QRIS**, lalu satu **daun LED** pada pohon fisik menyala sesuai warna
pilihannya. Dibangun dengan **Next.js (TypeScript) + Firebase**, terhubung ke
**mesin ESP32/LD3D** untuk menyalakan lampu daun.

Implementasi dari dokumen `FLOW DONASI INTERAKTIF POHON BAZNAS.pdf`.

> Catatan: file `readme.md` di root berisi catatan proyek lain (SDM/amil) dan
> sengaja tidak diubah. Dokumentasi proyek pohon donasi ada di folder `docs/` ini.

---

## Arsitektur

```
┌──────────────┐    HTTP     ┌────────────────────┐   Callback   ┌───────────┐
│  Kiosk/Tablet│ ─────────▶  │ Next.js API Routes │ ◀─────────── │ Midtrans  │
│ (Next.js UI) │             │ (Admin SDK)        │   (webhook)  │  QRIS     │
└──────┬───────┘             └─────────┬──────────┘              └───────────┘
       │ realtime (onSnapshot)         │ tulis
       ▼                               ▼
┌──────────────┐              ┌─────────────────────────────────────────────┐
│  Firestore   │              │           Firebase Realtime Database         │
│ transactions │              │  /tree/leaves/{id}  /tree/command  /status   │
│ stats/summary│              └───────────────┬─────────────────────────────┘
└──────────────┘                              │ stream realtime
                                              ▼
                                    ┌────────────────────┐
                                    │  ESP32 / LD3D       │
                                    │  (LED WS2812B/RGB)  │
                                    └────────────────────┘
```

- **Firestore** — sumber kebenaran transaksi (`transactions`) & statistik (`stats/summary`).
- **Realtime Database** — kanal perintah ke mesin pohon. ESP32 mendengarkan
  `/tree/leaves` & `/tree/command` secara realtime. Lihat
  [`ESP32_INTEGRATION.md`](ESP32_INTEGRATION.md).
- **Firebase Auth** — login admin dashboard (email/password + custom claim `admin`).
- **Payment** — provider _pluggable_: `mock` (demo) atau `midtrans` (QRIS asli).

### Peta halaman

| Rute              | Fungsi                                                             |
| ----------------- | ----------------------------------------------------------------- |
| `/kiosk`          | Layar tablet untuk pengunjung (flow donasi lengkap).              |
| `/tree-simulator` | Visual pohon LED — **pengganti mesin LD3D** untuk uji end-to-end. |
| `/admin`          | Dashboard statistik (butuh login).                                |
| `/admin/login`    | Login admin.                                                      |
| `/api/*`          | Buat transaksi, status, webhook Midtrans, simulasi bayar.        |

---

## Menjalankan (mode demo standalone — TANPA Firebase, TANPA hardware)

Mode default. Data disimpan di memori server, **QRIS mock otomatis "berhasil"**.
Hanya butuh **Node.js 20+**. Tidak perlu Firebase, Java, atau gateway.

```bash
npm install
cp .env.local.example .env.local   # default sudah NEXT_PUBLIC_STANDALONE_DEMO=true
npm run dev
```

Buka:

- **Kiosk**: http://localhost:3000/kiosk
- **Simulator pohon**: http://localhost:3000/tree-simulator (buka di tab kedua)
- **Dashboard**: http://localhost:3000/admin (login di-bypass di mode demo)

**Alur uji end-to-end:** di `/kiosk` → pilih program → nominal → warna daun →
konfirmasi → muncul QRIS → **otomatis berhasil dalam ±4 detik** (atau klik "Bayar
sekarang") → daun menyala di `/tree-simulator` + statistik naik di `/admin`. 🎉

> Catatan: data memori direset saat server di-restart. Untuk penyimpanan
> permanen, gunakan mode Firebase di bawah.

## Menjalankan (mode Firebase / emulator)

Set `NEXT_PUBLIC_STANDALONE_DEMO=false` di `.env.local`, lalu butuh
**Firebase CLI** (`npm i -g firebase-tools`) + **Java** untuk emulator:

```bash
npm run emulators                                      # Firestore + RTDB + Auth
npm run create-admin -- admin@baznas.go.id rahasia123  # terminal lain
npm run dev                                            # terminal lain
```

Di mode ini QRIS mock memakai tombol/otomatis yang sama, tetapi transaksi &
statistik tersimpan di Firestore dan perintah LED lewat Realtime Database.

---

## Mode Produksi

### 1. Firebase

1. Buat project di [Firebase Console](https://console.firebase.google.com).
2. Aktifkan **Firestore**, **Realtime Database**, dan **Authentication (Email/Password)**.
3. Salin config Web App ke `.env.local` (`NEXT_PUBLIC_FIREBASE_*`) dan set
   `NEXT_PUBLIC_USE_EMULATOR=false`.
4. Buat **Service Account** (Project settings → Service accounts → Generate key),
   simpan JSON-nya ke env `FIREBASE_SERVICE_ACCOUNT_KEY` (satu baris).
5. Deploy rules: `firebase deploy --only firestore:rules,database`.

### 2. Midtrans (QRIS)

1. Daftar di [Midtrans](https://midtrans.com), ambil **Server Key** & **Client Key**.
2. Set di `.env.local`: `PAYMENT_PROVIDER=midtrans`, `MIDTRANS_SERVER_KEY`,
   `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_SANDBOX=true|false`.
3. Di dashboard Midtrans → **Settings → Configuration → Payment Notification URL**,
   isi: `https://DOMAIN-ANDA/api/webhook/midtrans`.

### 3. ESP32 / LD3D

Firmware belum termasuk di repo ini. Lihat kontrak data & pseudocode di
[`ESP32_INTEGRATION.md`](ESP32_INTEGRATION.md) untuk menghubungkan mesin.

---

## Struktur kode

```
src/
├─ app/                 # Halaman & API (App Router)
│  ├─ kiosk/            # Flow donasi tablet
│  ├─ tree-simulator/   # Visual pohon LED (mirror RTDB)
│  ├─ admin/            # Dashboard + login
│  └─ api/              # transactions, webhook/midtrans, mock/pay
├─ components/kiosk/    # Step UI (idle, program, nominal, warna, konfirmasi, QRIS, terima kasih)
├─ components/tree/     # TreeCanvas (SVG pohon)
├─ hooks/               # Listener realtime (transaksi, pohon, stats, auth)
├─ lib/
│  ├─ firebase/         # Init client & admin SDK (+ emulator)
│  ├─ payments/         # Provider mock & Midtrans
│  ├─ device/rtdb.ts    # Kirim perintah ke mesin pohon
│  ├─ server/           # Orkestrasi transaksi (server-only)
│  └─ stats.ts          # Agregasi statistik
└─ config/              # programs, leaves, constants
```

Lihat juga [`FLOW.md`](FLOW.md) untuk pemetaan langkah PDF → kode.
