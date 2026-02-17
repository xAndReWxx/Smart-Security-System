#include <Servo.h>
#include <DHT.h>

// ========= Pins =========
#define MQ2_A0     A0
#define SW420_DO   3

#define DHTPIN     2
#define DHTTYPE    DHT22

#define TRIG_PIN   9
#define ECHO_PIN   10
#define SERVO_PIN  11

#define BUZZER_PIN 13
#define LED_PIN    12

// ========= Objects =========
Servo radarServo;
DHT dht(DHTPIN, DHTTYPE);

// ========= Timing =========
unsigned long lastSensorTime = 0;
const unsigned long SENSOR_INTERVAL = 1000;

// ========= Vibration =========
bool lastVibState = LOW;
unsigned long lastVibTime = 0;
const unsigned long VIB_ALARM_TIME = 2000; // ⏱️ 2 ثواني

// ========= Alarm =========
bool alarmActive = false;

// ========= Thresholds =========
#define GAS_THRESHOLD 50

// ========= Ultrasonic =========
long readUltrasonic() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 25000);
  if (duration == 0) return 0;
  return duration * 0.034 / 2;
}

// ========= MQ-2 =========
int readGasPercent() {
  int raw = analogRead(MQ2_A0);
  return map(raw, 0, 1023, 0, 100);
}

// ========= VIBRATION EVENT =========
void checkVibration() {
  bool vib = digitalRead(SW420_DO);

  if (vib == HIGH && lastVibState == LOW) {
    Serial.println("V,1");
    lastVibTime = millis();   // ⏱️ سجل وقت الزلزال
  }

  lastVibState = vib;
}

// ========= ALARM CONTROL =========
void updateAlarm(int gasLevel) {

  bool gasDanger = gasLevel > GAS_THRESHOLD;
  bool vibDanger = (millis() - lastVibTime <= VIB_ALARM_TIME);

  alarmActive = gasDanger || vibDanger;

  digitalWrite(LED_PIN, alarmActive ? HIGH : LOW);
  digitalWrite(BUZZER_PIN, alarmActive ? HIGH : LOW);
}

// ========= SERIAL =========
void sendRadar(int angle, long distance) {
  Serial.print("R,");
  Serial.print(angle);
  Serial.print(",");
  Serial.println(distance);
}

void sendSensors(float t, float h, int gas) {
  Serial.print("S,");
  Serial.print(t, 1);
  Serial.print(",");
  Serial.print(h, 1);
  Serial.print(",");
  Serial.println(gas);
}

// ========= SETUP =========
void setup() {
  Serial.begin(9600);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(MQ2_A0, INPUT);
  pinMode(SW420_DO, INPUT);

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);

  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

  radarServo.attach(SERVO_PIN);
  dht.begin();

  Serial.println("SYSTEM READY");
}

// ========= LOOP =========
void loop() {

  // ===== Radar Forward =====
  for (int angle = 15; angle <= 165; angle++) {
    radarServo.write(angle);
    delay(20);

    sendRadar(angle, readUltrasonic());
    checkVibration();
    updateAlarm(readGasPercent());
  }

  // ===== Radar Backward =====
  for (int angle = 165; angle >= 15; angle--) {
    radarServo.write(angle);
    delay(20);

    sendRadar(angle, readUltrasonic());
    checkVibration();
    updateAlarm(readGasPercent());
  }

  // ===== Sensors Frame =====
  if (millis() - lastSensorTime >= SENSOR_INTERVAL) {
    lastSensorTime = millis();

    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (isnan(t) || isnan(h)) return;

    int gas = readGasPercent();
    sendSensors(t, h, gas);
    updateAlarm(gas);
  }
}
