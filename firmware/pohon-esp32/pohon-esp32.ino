/**
 * Pohon Donasi Interaktif BAZNAS — Firmware ESP32 (baca Firebase RTDB langsung)
 * ---------------------------------------------------------------------------
 * OPSI A: app di-deploy ke Vercel, server menulis perintah ke Firebase RTDB,
 * ESP32 membacanya langsung. ESP cukup punya internet (WiFi apa pun) — tidak
 * perlu satu jaringan dengan PC/server.
 *
 * Hardware (mengikuti pohondonasi/PohonDonasi.ino):
 *   - LED strip WS2812B  : GPIO18, 10 LED
 *   - RGB LED (katoda)   : R=25, G=26, B=27  (digital on/off)
 *   - Buzzer             : GPIO19
 *
 * Kontrak data (docs/ESP32_INTEGRATION.md):
 *   server → device : /tree/command = { id, leafId, color, effect, ts }
 *                     (ditulis tiap donasi sukses; `id` unik → animasi sekali)
 *   device → server : /tree/status/pohon-01 = heartbeat "online"
 *   `color` = green|orange|yellow|blue|purple|red (lihat src/config/leaves.ts)
 *
 * Library (Arduino Library Manager):
 *   - "Firebase Arduino Client Library for ESP8266 and ESP32" (Mobizt) v4.x
 *   - "FastLED"
 */

#include "addons/RTDBHelper.h"
#include "addons/TokenHelper.h"
#include <Arduino.h>
#include <FastLED.h>
#include <Firebase_ESP_Client.h>
#include <WiFi.h>

// ============================ KONFIGURASI ==================================
#define WIFI_SSID "GANTI_SSID"
#define WIFI_PASSWORD "GANTI_PASSWORD"

// Firebase (project pohon-harapan). API key: Project settings > Web API Key.
#define API_KEY "AIzaSyAPkALtZFRO4mE9k_t36G8qtA9Su-bP2dU"
// databaseURL: Console > Realtime Database (setelah diaktifkan).
#define DATABASE_URL                                                           \
  "https://"                                                                   \
  "pohon-harapan-69dfd-default-rtdb.asia-southeast1.firebasedatabase.app"

// Akun perangkat (Firebase Auth > Email/Password). Untuk tulis heartbeat.
#define DEVICE_EMAIL "saeful2026027@gmail.com"
#define DEVICE_PASSWORD "zaqwsxcde123"

#define DEVICE_ID "pohon-01"

// Pin & hardware
#define LED_PIN 18
#define NUM_LEDS 10
#define BUZZER_PIN 19
#define RED_PIN 25
#define GREEN_PIN 26
#define BLUE_PIN 27
#define BRIGHTNESS 100
#define HOLD_MS 10000 // animasi tahan 10 detik
#define HEARTBEAT_MS 10000
// ===========================================================================

CRGB leds[NUM_LEDS];

FirebaseData fbdo;      // umum (heartbeat, init)
FirebaseData streamCmd; // stream /tree/command
FirebaseAuth auth;
FirebaseConfig config;

String lastCmdId = "";
volatile bool hasPending = false;
String pendingColor = "green";
int pendingLeaf = 0;
unsigned long lastBeat = 0;

// --- Warna: sama dengan src/config/leaves.ts ---
CRGB colorOf(const String &c) {
  if (c == "green")
    return CRGB(0x4C, 0xAF, 0x50);
  if (c == "orange")
    return CRGB(0xE8, 0x79, 0x2E);
  if (c == "yellow")
    return CRGB(0xF2, 0xC2, 0x30);
  if (c == "blue")
    return CRGB(0x2F, 0x8F, 0xEB);
  if (c == "purple")
    return CRGB(0x8E, 0x44, 0xAD);
  if (c == "red")
    return CRGB(0xE5, 0x48, 0x4D);
  return CRGB(0x4C, 0xAF, 0x50);
}

// RGB LED digital (katoda umum). Orange≈red karena tanpa PWM.
void rgbColor(int r, int g, int b) {
  digitalWrite(RED_PIN, r);
  digitalWrite(GREEN_PIN, g);
  digitalWrite(BLUE_PIN, b);
}
void rgbOff() { rgbColor(LOW, LOW, LOW); }
void rgbFor(const String &c) {
  if (c == "green")
    rgbColor(LOW, HIGH, LOW);
  else if (c == "orange")
    rgbColor(HIGH, LOW, LOW);
  else if (c == "yellow")
    rgbColor(HIGH, HIGH, LOW);
  else if (c == "blue")
    rgbColor(LOW, LOW, HIGH);
  else if (c == "purple")
    rgbColor(HIGH, LOW, HIGH);
  else if (c == "red")
    rgbColor(HIGH, LOW, LOW);
  else
    rgbColor(LOW, HIGH, LOW);
}

void stripOff() {
  FastLED.clear();
  FastLED.show();
}

void beep(int n, int ms) {
  for (int i = 0; i < n; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(ms);
    digitalWrite(BUZZER_PIN, LOW);
    delay(ms);
  }
}

// Animasi donasi: buzzer → sapu strip warna kategori → RGB → tahan → mati.
void animasi(const String &color) {
  rgbOff();
  stripOff();
  delay(300);
  beep(2, 150);

  CRGB c = colorOf(color);
  for (int i = 0; i < NUM_LEDS; i++) {
    leds[i] = c;
    FastLED.show();
    delay(200);
  }
  rgbFor(color);

  delay(HOLD_MS);

  rgbOff();
  stripOff();
  Serial.println("Animasi selesai");
}

// --- Stream /tree/command: set pending (jangan blok di callback) ---
void cmdCallback(FirebaseStream data) {
  if (data.dataTypeEnum() != firebase_rtdb_data_type_json)
    return;
  FirebaseJson *json = data.to<FirebaseJson *>();
  FirebaseJsonData r;
  String id = "", color = "green";
  int leafId = 0;
  if (json->get(r, "id"))
    id = r.stringValue;
  if (json->get(r, "color"))
    color = r.stringValue;
  if (json->get(r, "leafId"))
    leafId = r.intValue;
  if (id.length() && id != lastCmdId) {
    lastCmdId = id;
    pendingColor = color;
    pendingLeaf = leafId;
    hasPending = true;
  }
}

void streamTimeout(bool timeout) {
  if (timeout)
    Serial.println("[stream] timeout, resume...");
}

void sendHeartbeat() {
  if (!Firebase.ready())
    return;
  time_t now = time(nullptr);
  double epochMs = (now > 100000) ? (double)now * 1000.0 : (double)millis();
  FirebaseJson j;
  j.set("online", true);
  j.set("lastSeen", epochMs);
  j.set("currentLeaf", pendingLeaf);
  j.set("firmware", "2.0.0-rtdb");
  Firebase.RTDB.setJSON(&fbdo, "/tree/status/" DEVICE_ID, &j);
}

void connectWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.printf("\nWiFi OK: %s\n", WiFi.localIP().toString().c_str());
}

void setup() {
  Serial.begin(115200);

  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  rgbOff();
  digitalWrite(BUZZER_PIN, LOW);

  FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(BRIGHTNESS);
  stripOff();

  connectWiFi();
  configTime(7 * 3600, 0, "pool.ntp.org", "time.google.com"); // WIB

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  auth.user.email = DEVICE_EMAIL;
  auth.user.password = DEVICE_PASSWORD;
  config.token_status_callback = tokenStatusCallback;
  Firebase.reconnectWiFi(true);
  Firebase.begin(&config, &auth);

  // Online sekarang, dan otomatis offline saat perangkat terputus.
  Firebase.RTDB.setBool(&fbdo, "/tree/status/" DEVICE_ID "/online", true);
  Firebase.RTDB.onDisconnectSetBoolean(
      &fbdo, "/tree/status/" DEVICE_ID "/online", false);

  // Cegah replay saat boot: catat id perintah terakhir tanpa memainkannya.
  if (Firebase.RTDB.getJSON(&fbdo, "/tree/command")) {
    FirebaseJson &j = fbdo.to<FirebaseJson>();
    FirebaseJsonData r;
    if (j.get(r, "id"))
      lastCmdId = r.stringValue;
  }

  if (!Firebase.RTDB.beginStream(&streamCmd, "/tree/command"))
    Serial.printf("beginStream gagal: %s\n", streamCmd.errorReason().c_str());
  Firebase.RTDB.setStreamCallback(&streamCmd, cmdCallback, streamTimeout);

  Serial.println("======================");
  Serial.println("POHON DONASI SIAP (RTDB)");
  Serial.println("======================");
  sendHeartbeat();
}

void loop() {
  if (hasPending) {
    hasPending = false;
    Serial.printf("Donasi: %s (leaf %d)\n", pendingColor.c_str(), pendingLeaf);
    animasi(pendingColor);
  }
  if (millis() - lastBeat >= HEARTBEAT_MS) {
    lastBeat = millis();
    sendHeartbeat();
  }
}
