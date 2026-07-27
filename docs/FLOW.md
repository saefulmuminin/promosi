# Pemetaan Flow PDF → Kode

Setiap langkah pada `FLOW DONASI INTERAKTIF POHON BAZNAS.pdf` dipetakan ke file
implementasinya.

| #   | Langkah (PDF)                     | Implementasi                                                             |
| --- | --------------------------------- | ----------------------------------------------------------------------- |
| 1   | Pengunjung datang (pohon redup)   | `components/kiosk/IdleScreen.tsx` — pohon dim + "Sentuh layar…"          |
| 2   | Pilih program donasi              | `components/kiosk/ProgramSelect.tsx` (`config/programs.ts`)              |
| 3   | Pilih nominal donasi              | `components/kiosk/NominalInput.tsx` (quick amount + keypad)              |
| 4   | Pilih warna daun (berdenyut)      | `components/kiosk/LeafColorSelect.tsx` + `TreeCanvas` highlight          |
| 5   | Konfirmasi                        | `components/kiosk/Confirmation.tsx`                                      |
| 6   | Generate QRIS + countdown 3 menit | `POST /api/transactions` → `lib/server/transactions.ts` + `lib/payments`|
| 7   | Scan QRIS                         | `components/kiosk/QrisPayment.tsx` (QRCodeCanvas, daftar e-wallet)       |
| 8   | Gateway verifikasi (callback)     | `POST /api/webhook/midtrans` → `applyPaymentResult()`                    |
| 9   | Kirim perintah ke controller      | `lib/device/rtdb.ts` `sendLeafCommand()` → RTDB `/tree/leaves` `/command`|
| 10  | Controller cari posisi daun       | ESP32: `ledIndex = leafId - 1` (lihat `ESP32_INTEGRATION.md`)           |
| 11  | LED menyala (fade→glow→flow)      | ESP32 `energyFlow()` / disimulasikan di `/tree-simulator`               |
| 12  | Animasi di tablet ("Terima kasih")| `components/kiosk/ThankYou.tsx` (counter realtime)                       |
| 13  | Efek audio (opsional)             | _Hook tersedia_ — tambahkan `<audio>` di `ThankYou.tsx` (belum diisi)   |
| 14  | Efek pohon (daun tetap menyala)   | _Desired state_ di RTDB `/tree/leaves` (persist antar reboot)           |
| 15  | Statistik admin                   | `app/admin/page.tsx` + `lib/stats.ts` (`stats/summary`)                 |

## Status transaksi

```
pending ──(callback: settlement/capture-accept)──▶ paid  ─▶ nyalakan daun + update statistik
   │
   ├──(callback: expire / countdown habis)──▶ expired
   └──(callback: cancel/deny/failure)───────▶ failed
```

Efek samping (nyalakan LED + tambah statistik) dijalankan **idempoten** di
`applyPaymentResult()` — aman meski webhook Midtrans terkirim berkali-kali.

## Nilai tambah (dari PDF) yang sudah/ belum diimplementasi

- ✅ Cahaya mengalir akar → batang → daun: `effect: "flow"` + `TreeCanvas energyFlow` / `energyFlow()` firmware.
- ✅ Counter donasi & jumlah daun realtime: `hooks/useStats.ts`.
- ✅ Statistik warna daun terpopuler & riwayat: dashboard admin.
- ⏳ Efek audio "ting"/suara alam: sediakan file audio & putar di `ThankYou.tsx`.
- ⏳ Pilihan kegiatan spesifik (cintazakat) per program: data ada di
  `config/programs.ts` (`causes`), tinggal tambahkan langkah pemilihan bila perlu.
