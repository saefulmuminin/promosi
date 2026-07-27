#include <Arduino.h>
#include <FastLED.h>
#include <Firebase_ESP_Client.h>
#include <WiFi.h>

// Helper bawaan library Firebase — WAJIB di-include SETELAH
// Firebase_ESP_Client.h. (Blok terpisah + komentar ini mencegah clang-format
// menaikkannya ke atas.)
#include "addons/RTDBHelper.h"
#include "addons/TokenHelper.h"

// ============================ KONFIGURASI ==================================
#define WIFI_SSID "Pih" // huruf besar 'P' — SSID case-sensitive!
#define WIFI_PASSWORD "sulthanrafi"

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
  j.set("firmware", "2.1.0-rtdb");
  Firebase.RTDB.setJSON(&fbdo, "/tree/status/" DEVICE_ID, &j);
}

void connectWiFi() {
  // Tanpa scanNetworks (memicu reset/brownout di board ini). Cukup begin +
  // laporkan kode status supaya ketahuan sebab gagalnya.
  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  Serial.printf("\n[WiFi] connect ke '%s' (SSID len=%d) ...\n", WIFI_SSID,
                (int)strlen(WIFI_SSID));
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long t0 = millis();
  int last = -99;
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 30000) {
    delay(500);
    int s = WiFi.status();
    if (s != last) {
      last = s;
      Serial.printf("[WiFi] status=%d\n", s); // 3=OK 1=SSID? 4=pass? 6=putus
    }
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[WiFi] OK: %s  RSSI %d\n", WiFi.localIP().toString().c_str(),
                  WiFi.RSSI());
  } else {
    Serial.printf("[WiFi] GAGAL status=%d "
                  "(1=SSID tak ada/5GHz, 4=password salah, 6=putus)\n",
                  WiFi.status());
  }
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

  // Sinkron waktu (NTP) & TUNGGU sampai jam benar SEBELUM Firebase. Token TLS
  // butuh jam akurat; tanpa ini muncul "Token error: connection lost".
  configTime(7 * 3600, 0, "pool.ntp.org", "time.google.com",
             "time.cloudflare.com");
  Serial.print("[NTP] sinkron waktu");
  {
    time_t nowt = time(nullptr);
    unsigned long tw = millis();
    while (nowt < 1700000000 && millis() - tw < 20000) {
      delay(300);
      Serial.print(".");
      nowt = time(nullptr);
    }
    Serial.printf("\n[NTP] epoch=%ld %s\n", (long)nowt,
                  (nowt < 1700000000) ? "(GAGAL - NTP diblokir jaringan?)"
                                      : "OK");
  }

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  auth.user.email = DEVICE_EMAIL;
  auth.user.password = DEVICE_PASSWORD;
  config.token_status_callback = tokenStatusCallback;
  Firebase.reconnectWiFi(true);
  Firebase.begin(&config, &auth);

  // Tandai online. (onDisconnect tidak dipakai di library ini; acuan status
  // "hidup" pakai lastSeen dari heartbeat.)
  Firebase.RTDB.setBool(&fbdo, "/tree/status/" DEVICE_ID "/online", true);

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
