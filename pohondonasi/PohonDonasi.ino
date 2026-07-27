#include <WiFi.h>
#include <HTTPClient.h>
#include <FastLED.h>

//=====================================================
// WIFI
//=====================================================

const char* ssid = "Najmu";
const char* password = "wol12345.";

//=====================================================
// WEBSITE
//=====================================================

// Server = app Next.js (npm run dev). IP = IP LAN PC, WiFi harus sama dgn ESP.
// Ganti "10.10.0.197" bila IP PC berubah (disarankan kunci IP statis di router).
const char* STATUS_URL = "http://10.10.0.197:3000/api/tree/status";
const char* RESET_URL  = "http://10.10.0.197:3000/api/tree/reset";

//=====================================================
// LED STRIP
//=====================================================

#define LED_PIN     18
#define NUM_LEDS    10

CRGB leds[NUM_LEDS];
//=====================================================
// WARNA KATEGORI DONASI
//=====================================================

const CRGB COLOR_PENDIDIKAN = CRGB(46,204,113);   // Hijau
const CRGB COLOR_EKONOMI    = CRGB(255,110,64);   // Jingga
const CRGB COLOR_SOSIAL     = CRGB(241,196,15);   // Kuning
const CRGB COLOR_DAKWAH     = CRGB(52,152,219);   // Biru
const CRGB COLOR_KESEHATAN  = CRGB(155,89,182);   // Ungu
const CRGB COLOR_HARAPAN    = CRGB(231,76,60);    // Merah

//=====================================================
// BUZZER
//=====================================================

#define BUZZER_PIN 19

//=====================================================
// RGB LED (COMMON CATHODE)
//=====================================================

#define RED_PIN     25
#define GREEN_PIN   26
#define BLUE_PIN    27

//=====================================================
// TIMER
//=====================================================

unsigned long lastRequest = 0;
const unsigned long interval = 1000;

//=====================================================
// RGB
//=====================================================

void rgbOff()
{
  digitalWrite(RED_PIN, LOW);
  digitalWrite(GREEN_PIN, LOW);
  digitalWrite(BLUE_PIN, LOW);
}

void rgbColor(int r, int g, int b)
{
  digitalWrite(RED_PIN, r);
  digitalWrite(GREEN_PIN, g);
  digitalWrite(BLUE_PIN, b);
}

//=====================================================
// BUZZER
//=====================================================

void beep(int jumlah, int durasi)
{
  for (int i = 0; i < jumlah; i++)
  {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(durasi);

    digitalWrite(BUZZER_PIN, LOW);
    delay(durasi);
  }
}

//=====================================================
// LED STRIP
//=====================================================

void stripOff()
{
  FastLED.clear();
  FastLED.show();
}

void runningLed(CRGB warna)
{
    FastLED.clear();

    for(int i=0;i<NUM_LEDS;i++)
    {
        leds[i]=warna;

        FastLED.show();

        delay(200);
    }
}

//=====================================================
// WIFI
//=====================================================

void connectWiFi()
{
  Serial.println();
  Serial.println("Menghubungkan WiFi...");

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi Berhasil");
  Serial.print("IP ESP32 : ");
  Serial.println(WiFi.localIP());
}

//=====================================================
// MEMBACA STATUS DARI WEBSITE
//=====================================================

String getStatus()
{
    HTTPClient http;

    http.begin(STATUS_URL);

    int httpCode = http.GET();

    String hasil = "OFF";

    if(httpCode == 200)
    {
        hasil = http.getString();
        hasil.trim();
    }

    http.end();

    return hasil;
}

//=====================================================
// RESET STATUS WEBSITE
//=====================================================

void resetStatus()
{
    HTTPClient http;

    http.begin(RESET_URL);

    http.GET();

    http.end();

    Serial.println("Status Website -> OFF");
}

//=====================================================
// ANIMASI POHON DONASI
//=====================================================

void animasi(String kategori)
{
    // Matikan semua terlebih dahulu
    rgbOff();
    stripOff();

    delay(300);

    //----------------------------------
    // Buzzer
    //----------------------------------

    beep(2,150);

    //----------------------------------
    // LED STRIP HIJAU
    //----------------------------------

    for(int i=0;i<NUM_LEDS;i++)
    {
        leds[i] = CRGB::Green;      // Selalu hijau
        FastLED.show();
        delay(200);
    }

    //----------------------------------
    // LED RGB SESUAI KATEGORI
    //----------------------------------

    if(kategori=="pendidikan")
    {
        // Hijau
        rgbColor(LOW,HIGH,LOW);
    }

    else if(kategori=="ekonomi")
    {
        // Jingga (mendekati)
        rgbColor(HIGH,LOW,LOW);
    }

    else if(kategori=="sosial")
    {
        // Kuning
        rgbColor(HIGH,HIGH,LOW);
    }

    else if(kategori=="dakwah")
    {
        // Biru
        rgbColor(LOW,LOW,HIGH);
    }

    else if(kategori=="kesehatan")
    {
        // Ungu
        rgbColor(HIGH,LOW,HIGH);
    }

    else if(kategori=="harapan")
    {
        // Merah
        rgbColor(HIGH,LOW,LOW);
    }

    //----------------------------------
    // Tahan 10 Detik
    //----------------------------------

    delay(10000);

    //----------------------------------
    // Matikan Semua
    //----------------------------------

    rgbOff();

    FastLED.clear();
    FastLED.show();

    Serial.println("Animasi selesai");
}

//=====================================================
// SETUP
//=====================================================

void setup()
{
    Serial.begin(115200);

    //-------------------------
    // RGB
    //-------------------------

    pinMode(RED_PIN,OUTPUT);
    pinMode(GREEN_PIN,OUTPUT);
    pinMode(BLUE_PIN,OUTPUT);

    rgbOff();

    //-------------------------
    // Buzzer
    //-------------------------

    pinMode(BUZZER_PIN,OUTPUT);

    digitalWrite(BUZZER_PIN,LOW);

    //-------------------------
    // LED Strip
    //-------------------------

    FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, NUM_LEDS);

    FastLED.setBrightness(100);

    stripOff();

    //-------------------------
    // WIFI
    //-------------------------

    connectWiFi();

    Serial.println();
    Serial.println("======================");
    Serial.println("POHON DONASI SIAP");
    Serial.println("======================");
}

//=====================================================
// LOOP
//=====================================================

void loop()
{
    if(WiFi.status()==WL_CONNECTED)
    {
        if(millis()-lastRequest>=interval)
        {
            lastRequest=millis();

            String status = getStatus();

            Serial.print("Website : ");
            Serial.println(status);

            if(status != "OFF")
            {
                Serial.println("=================");
                Serial.println("ANIMASI DIMULAI");
                Serial.println("=================");

                animasi(status);

                resetStatus();
            }
        }
    }
    else
    {
        Serial.println("WiFi Terputus");

        connectWiFi();
    }
}