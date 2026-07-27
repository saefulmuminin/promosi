# Integrasi Mesin Pohon (ESP32 / LD3D)

Dokumen ini adalah **kontrak data** antara server (Next.js/Firebase) dan mesin
pengendali LED pohon. Firmware cukup mengikuti struktur di bawah — tidak ada
endpoint kustom, semua lewat **Firebase Realtime Database (RTDB)**.

## 1. Struktur data RTDB

### `/tree/leaves/{leafId}` — _desired state_ tiap daun

Ditulis server saat pembayaran sukses. Ini adalah **kondisi yang diinginkan**
(bukan event sekali jalan), sehingga setelah ESP32 restart, seluruh daun yang
seharusnya menyala bisa dipulihkan dengan membaca path ini.

```json
{
  "on": true,
  "color": "gold",
  "effect": "flow",
  "txId": "BAZNAS-1700000000000-123456",
  "updatedAt": 1700000000000
}
```

| Field       | Tipe    | Keterangan                                            |
| ----------- | ------- | ----------------------------------------------------- |
| `on`        | bool    | `true` = nyala, `false` = redup/mati                  |
| `color`     | string  | `gold` \| `green` \| `blue` \| `white` \| `red`       |
| `effect`    | string  | `flow` (energy-flow) \| `fade` \| `off`               |
| `txId`      | string  | ID transaksi terkait                                  |
| `updatedAt` | number  | epoch ms                                              |

`leafId` adalah **1..144** (lihat `TOTAL_LEAVES`). Pemetaan default ke indeks LED:

```
ledIndex = leafId - 1        // LED 0..143
```

### `/tree/command` — pemicu efek terakhir (sekali jalan)

Ditulis bersamaan dengan `leaves`. Berguna untuk memicu animasi _energy-flow_
(cahaya mengalir dari akar → batang → ranting → daun) tepat saat donasi masuk.

```json
{ "id": "128-1700000000000", "leafId": 128, "color": "gold", "effect": "flow", "ts": 1700000000000 }
```

Firmware menyimpan `id` terakhir yang sudah diproses; jika `id` berubah → mainkan
animasi sekali. (Mencegah replay saat reconnect.)

### `/tree/status/{deviceId}` — heartbeat & ACK (ditulis ESP32)

```json
{ "online": true, "lastSeen": 1700000000000, "currentLeaf": 128, "firmware": "1.0.0" }
```

Dashboard admin membaca path ini untuk menampilkan status perangkat. Kirim update
tiap ±10 detik. Gunakan `deviceId` sesuai `DEFAULT_DEVICE_ID` (`pohon-01`).

## 2. Pemetaan warna → RGB

Samakan dengan `src/config/leaves.ts`:

| color   | HEX       | R   | G   | B   |
| ------- | --------- | --- | --- | --- |
| `gold`  | `#F2C230` | 242 | 194 | 48  |
| `green` | `#4CAF50` | 76  | 175 | 80  |
| `blue`  | `#2F8FEB` | 47  | 143 | 235 |
| `white` | `#F5F7FA` | 245 | 247 | 250 |
| `red`   | `#E5484D` | 229 | 72  | 77  |

## 3. Autentikasi perangkat

Pilih salah satu:

- **Email/Password device account** (disarankan): buat akun khusus
  (mis. `pohon-01@device.local`) di Firebase Auth, login dari ESP32. Rules
  mengizinkan tulis ke `/tree/status/$deviceId` untuk `auth != null`.
- **Legacy Database Secret** (cepat untuk prototipe): pakai secret sebagai
  `signer`/`legacy token` di library — melewati rules. Jangan dipakai di produksi.

Rules RTDB ada di `database.rules.json`. `/tree/leaves` & `/tree/command` bersifat
_read-only_ untuk publik/perangkat (server yang menulis via Admin SDK).

## 4. Pseudocode firmware (Arduino / ESP32)

Library disarankan: **Firebase-ESP-Client** (mobizt) + **FastLED**.

```cpp
#include <FastLED.h>
#include <Firebase_ESP_Client.h>

#define NUM_LEDS   144
#define LED_PIN    5
CRGB leds[NUM_LEDS];

FirebaseData   streamCmd;   // stream /tree/command
FirebaseData   streamLeaf;  // stream /tree/leaves
FirebaseAuth   auth;
FirebaseConfig config;

CRGB colorOf(const String& c) {
  if (c == "gold")  return CRGB(242,194,48);
  if (c == "green") return CRGB(76,175,80);
  if (c == "blue")  return CRGB(47,143,235);
  if (c == "white") return CRGB(245,247,250);
  if (c == "red")   return CRGB(229,72,77);
  return CRGB(242,194,48);
}

void setLeaf(int leafId, const String& color, bool on) {
  int i = leafId - 1;                 // ledIndex = leafId - 1
  if (i < 0 || i >= NUM_LEDS) return;
  leds[i] = on ? colorOf(color) : CRGB(8,20,32);  // redup saat off
  FastLED.show();
}

// Efek: cahaya mengalir dari akar -> batang -> daun (±2 dtk), lalu glow.
void energyFlow(int leafId, const String& color) {
  CRGB warm = CRGB(255,233,176);
  // (implementasi: sapu LED batang -> ranting menuju leafId)
  for (int step = 0; step < 40; step++) { /* animasikan sepanjang jalur */ FastLED.show(); delay(50); }
  // Fade-in daun tujuan
  CRGB target = colorOf(color);
  for (int b = 0; b <= 255; b += 5) {
    leds[leafId-1] = target; leds[leafId-1].nscale8_video(b); FastLED.show(); delay(8);
  }
  // Glow 5 detik lalu tetap menyala (desired state akan mempertahankannya)
}

void onCommand(FirebaseStream data) {
  // data berisi objek /tree/command
  FirebaseJson* json = data.to<FirebaseJson*>();
  FirebaseJsonData f;
  String id, color; int leafId;
  json->get(f, "id");      id = f.stringValue;
  json->get(f, "leafId");  leafId = f.intValue;
  json->get(f, "color");   color = f.stringValue;
  static String lastId = "";
  if (id != lastId) { lastId = id; energyFlow(leafId, color); }
}

void onLeafState(FirebaseStream data) {
  // Rekonsiliasi: server mengubah /tree/leaves/{leafId}
  // Ambil path anak -> leafId, lalu on/color; panggil setLeaf(...)
}

void setup() {
  FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, NUM_LEDS);
  // konfigurasi WiFi + Firebase (host = databaseURL, auth = device account)
  Firebase.RTDB.beginStream(&streamCmd,  "/tree/command");
  Firebase.RTDB.setStreamCallback(&streamCmd, onCommand, [](bool){});
  Firebase.RTDB.beginStream(&streamLeaf, "/tree/leaves");
  Firebase.RTDB.setStreamCallback(&streamLeaf, onLeafState, [](bool){});
}

void loop() {
  // Heartbeat tiap 10 dtk ke /tree/status/pohon-01
  // { online:true, lastSeen: <millis epoch>, currentLeaf, firmware:"1.0.0" }
}
```

## 5. Uji tanpa hardware

Halaman `/tree-simulator` **meniru mesin ini**: membaca `/tree/leaves` &
`/tree/command` yang sama, lalu menampilkan daun menyala + animasi energy-flow.
Gunakan untuk memverifikasi seluruh alur sebelum firmware siap.
