# 🛡️ Smart Security System

A Full-Stack IoT Smart Security & Access Control System integrating Face Recognition, NFC Authentication, Motor Control, Telegram Alerts, and a Real-Time Web Dashboard.

---

## 🚀 Overview

Smart Security System is an integrated IoT-based access control solution that combines hardware and software to create a real-time monitoring and authentication system.

The system includes:

* 📷 ESP32-CAM for Face Recognition
* 🪪 NFC RC522 for Card Authentication
* ⚙️ Servo / Motor for Door Control
* 📟 LCD I2C Display for Status Messages
* 🔔 Telegram Bot for Instant Alerts
* 🖥️ Python Backend Server
* 🌐 React + Vite Dashboard for Live Monitoring

This project demonstrates the integration of Embedded Systems, Computer Vision, Backend Development, and Frontend UI in one complete solution.

---

## 🏗️ System Architecture

```
ESP32-CAM  →  Python Backend  →  React Dashboard
     │               │                 │
     │               │                 │
 Face Rec     NFC / Motor / LCD     Live UI
                     │
                Telegram Alerts
```

---

## 🧰 Technologies Used

### 💻 Frontend

* React (TypeScript)
* Vite
* Socket.io (Real-time Communication)
* Modern Custom UI Components

### 🖥️ Backend

* Python 3.9+
* OpenCV
* face_recognition
* Flask
* python-socketio
* python-telegram-bot

### 🔌 Hardware

* ESP32-CAM
* NFC RC522 Module
* LCD 16x2 (I2C)
* Servo Motor / DC Motor
* Relay Module
* External Power Supply

---

## 📂 Project Structure

```
SmartSystem/
│──Ard/                     # Arduino, Esp | Setup
|   ├──Cam/
|   ├──MotorNfcLcd/
|   └──SensorsAndUltra/
|
├── src/                     # React Frontend
│   ├── components/
│   ├── pages/
│   └── socket.ts
│
├── Servers/
│   ├── mainServer.py
│   ├── MotorAndNfcAndLcd.py
│   ├── ESPCAM/
│   │   └── known_faces/
│   └── Telegram/
│
└── README.md
```

---

# 🔧 Hardware Requirements

| Component     | Quantity  |
| ------------- | --------- |
| ESP32-CAM     | 1         |
| NFC RC522     | 1         |
| LCD I2C 16x2  | 1         |
| Servo / Motor | 1         |
| Relay Module  | 1         |
| Arduino UNO   | 1         |
| Jumper Wires  | As needed |
| Power Supply  | 5V / 12V  |

---

# 🔌 Hardware Connections

## 🪪 NFC RC522 Wiring (SPI)

| RC522 Pin | Arduino / ESP Pin |
| --------- | ----------------- |
| SDA       | D10               |
| SCK       | D13               |
| MOSI      | D11               |
| MISO      | D12               |
| RST       | D9                |
| GND       | GND               |
| 3.3V      | 3.3V              |

⚠️ IMPORTANT: Use **3.3V only** for RC522.

---

## 📟 LCD I2C Wiring

| LCD Pin | Connection |
| ------- | ---------- |
| VCC     | 5V         |
| GND     | GND        |
| SDA     | A4         |
| SCL     | A5         |

---

## ⚙️ Motor / Relay Wiring

* Signal → Digital Pin
* VCC → External Power (if required)
* GND → Common Ground

Make sure all grounds are connected together.

---

# 💾 Software Requirements

* Python 3.9+
* Node.js (v18+ recommended)
* npm
* Arduino IDE
* Git

---

# ⚙️ Installation & Setup

---

## 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/SmartSystem.git
cd SmartSystem
```

---

## 2️⃣ Backend Setup (Python)

Install dependencies:

```bash
pip install opencv-python
pip install face-recognition
pip install flask
pip install python-telegram-bot
pip install python-socketio
```

Run Main Server:

```bash
cd Servers
python mainServer.py
```

If using NFC + Motor + LCD:

```bash
python MotorAndNfcAndLcd.py
```

If using ESP32 Camera Server:

```bash
cd ESPCAM
python EspCam.py
```

---

## 3️⃣ Telegram Bot Setup

1. Open Telegram and search for @BotFather
2. Create a new bot
3. Copy your Bot Token
4. Add the token inside:

```
Servers/Telegram/TelegramBotServer.py
```

Run the bot:

```bash
python TelegramBotServer.py
```

---

## 4️⃣ Frontend Setup (React Dashboard)

```bash
npm install
npm run dev
```

Open your browser:

```
http://localhost:5173
```

---

# 🔁 System Workflow

1. Face is detected using ESP32-CAM
2. Image is sent to Python backend
3. Face recognition is performed
4. If Authorized:

   * Door opens (Motor activated)
   * LCD displays "Access Granted"
   * Dashboard updates in real-time
   * Telegram notification sent
5. If Unauthorized:

   * Access denied
   * Alert triggered
   * Event logged in dashboard
   * Telegram alert sent

---

# 🧠 Adding New Known Faces

Add images to:

```
Servers/ESPCAM/known_faces/
```

Then restart the server.

Use clear, front-facing images for better accuracy.

---

# 🛠️ Troubleshooting

### ❌ ESP32-CAM Not Connecting

* Verify WiFi credentials
* Check correct IP address
* Ensure backend is running

### ❌ Face Recognition Not Working

* Use high-quality images
* Restart server after adding faces

### ❌ NFC Not Detecting Cards

* Confirm 3.3V power supply
* Verify SPI wiring
* Check correct library installed

### ❌ Dashboard Not Updating

* Make sure backend server is running
* Check socket connection
* Verify correct server port


---

# 👨‍💻 Author

* Andrew Bahgat

* Smart Base Integrated Security & Observatory Control 

