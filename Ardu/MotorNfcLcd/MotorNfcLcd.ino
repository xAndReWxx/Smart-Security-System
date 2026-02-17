#include <ESP8266WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Servo.h>
#include <LiquidCrystal_I2C.h>

/* ===== Pins ===== */
#define SS_PIN D8
#define RST_PIN D0
#define SERVO_PIN D3

/* ===== WiFi ===== */
const char* ssid = "";
const char* password = "";

/* ===== WebSocket ===== */
const char* WS_HOST = "";
const uint16_t WS_PORT = 8765;
const char* WS_PATH = "/";

/* ===== Objects ===== */
WebSocketsClient webSocket;
MFRC522 mfrc522(SS_PIN, RST_PIN);
Servo gateServo;
LiquidCrystal_I2C lcd(0x27, 16, 2);

/* ===== State ===== */
bool wsConnected = false;

/* ===== Heart ❤️ ===== */
byte heartChar[8] = {
  0b00000,
  0b01010,
  0b11111,
  0b11111,
  0b11111,
  0b01110,
  0b00100,
};

/* ===== Sad Face 😞 ===== */
byte sadChar[8] = {
  0b00000,
  0b01010,
  0b00000,
  0b00000,
  0b01110,
  0b10001,
  0b00000,
};

/* ===== Servo ===== */
void openGate() {
  for (int pos = 15; pos <= 180; pos++) {
    gateServo.write(pos);
    delay(20);
  }

  delay(2000);

  for (int pos = 180; pos >= 15; pos--) {
    gateServo.write(pos);
    delay(20);
  }
}

/* ===== WebSocket Events ===== */
void onWebSocketEvent(WStype_t type, uint8_t* payload, size_t length) {

  if (type == WStype_CONNECTED) {
    wsConnected = true;
    lcd.clear();
    lcd.print("Scan Your Card");
  }

  if (type == WStype_DISCONNECTED) {
    wsConnected = false;
    lcd.clear();
    lcd.print("Reconnecting...");
  }

  if (type == WStype_TEXT) {
    StaticJsonDocument<128> doc;
    if (deserializeJson(doc, payload)) return;

    const char* action = doc["action"];

    if (strcmp(action, "OPEN") == 0) {
      const char* name = doc["name"];

      lcd.clear();
      lcd.print("Welcome ");
      lcd.write(byte(0));  // ❤️
      lcd.setCursor(0, 1);
      lcd.print(name);

      // السيرفو يفتح بس هنا
      openGate();
    } else {
      lcd.clear();
      lcd.print("Access Denied");
      lcd.setCursor(0, 1);
      lcd.write(byte(1));  // 😞
    }

    delay(1500);
    lcd.clear();
    lcd.print("Scan Your Card");
  }
}

/* ===== Setup ===== */
void setup() {
  Serial.begin(115200);

  lcd.init();
  lcd.backlight();
  lcd.createChar(0, heartChar);
  lcd.createChar(1, sadChar);

  lcd.clear();
  lcd.print("Scan Your Card");

  gateServo.attach(SERVO_PIN);
  gateServo.write(0);  // تأكيد إنه مقفول

  SPI.begin();
  mfrc522.PCD_Init();

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
  }

  webSocket.begin(WS_HOST, WS_PORT, WS_PATH);
  webSocket.onEvent(onWebSocketEvent);

  // Auto Reconnect
  webSocket.setReconnectInterval(3000);
  webSocket.enableHeartbeat(15000, 3000, 2);
}

/* ===== Loop ===== */
void loop() {
  webSocket.loop();

  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial()) return;

  lcd.clear();
  lcd.print("Checking...");

  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(mfrc522.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();

  if (wsConnected) {
    StaticJsonDocument<128> doc;
    doc["uid"] = uid;
    String msg;
    serializeJson(doc, msg);
    webSocket.sendTXT(msg);
  }

  mfrc522.PICC_HaltA();
  delay(1500);
}
