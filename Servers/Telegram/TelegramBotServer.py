import socketio
import time
import requests
import os
import threading

os.makedirs("/Sub", exist_ok=True)

# ================= CONFIG =================
MAIN_SERVER_URL = "http://localhost:5000"

TELEGRAM_TOKEN = "PutYourTokenHere"  # 🔑 Replace with your Telegram Bot Token
TELEGRAM_API = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}"

CHAT_FILE = "/Sub/chat_ids.txt"
STARTED_FILE = "/Sub/started_users.txt"
VIB_FILE = "/Sub/vibration_subs.txt"
NFC_FILE = "/Sub/nfc_subs.txt"
FACE_FILE = "/Sub/face_subs.txt"   # 🔥 NEW

EARTHQUAKE_COOLDOWN = 30
FACE_COOLDOWN = 20   # ⏱️ Face cooldown

# 📍 Camera Location
CAMERA_LAT = 30.0444
CAMERA_LON = 31.2357

# ================= SOCKET.IO CLIENT =================
sio = socketio.Client()

# ================= STATE =================
all_users = set()
started_users = set()
vibration_users = set()
nfc_users = set()
face_users = set()          # 🔥 NEW

last_state = None
last_earthquake_time = 0
vibration_active = False
last_face_time = {}         # 🔥 NEW

# ================= FILE HELPERS =================
def load_file(path, target_set):
    if not os.path.exists(path):
        return
    with open(path, "r") as f:
        for line in f:
            if line.strip().isdigit():
                target_set.add(int(line.strip()))

def save_to_file(path, chat_id, target_set):
    if chat_id in target_set:
        return
    target_set.add(chat_id)
    with open(path, "a") as f:
        f.write(str(chat_id) + "\n")

# ================= TELEGRAM =================
def send_message(chat_id, text, keyboard=None):
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown"
    }
    if keyboard:
        payload["reply_markup"] = keyboard

    requests.post(
        f"{TELEGRAM_API}/sendMessage",
        json=payload,
        timeout=5
    )

def send_photo(chat_id, image_url, caption):
    requests.post(
        f"{TELEGRAM_API}/sendPhoto",
        json={
            "chat_id": chat_id,
            "photo": image_url,
            "caption": caption,
            "parse_mode": "Markdown"
        },
        timeout=5
    )

def send_location(chat_id):
    requests.post(
        f"{TELEGRAM_API}/sendLocation",
        json={
            "chat_id": chat_id,
            "latitude": CAMERA_LAT,
            "longitude": CAMERA_LON
        },
        timeout=5
    )

def main_menu():
    return {
        "inline_keyboard": [
            [{"text": "📊 Status", "callback_data": "status"}],
            [
                {"text": "📳 Subscribe Vibration", "callback_data": "sub_vib"},
                {"text": "❌ Unsubscribe Vibration", "callback_data": "unsub_vib"}
            ],
            [
                {"text": "🔐 Subscribe NFC", "callback_data": "sub_nfc"},
                {"text": "🚫 Unsubscribe NFC", "callback_data": "unsub_nfc"}
            ],
            [
                {"text": "👤 Subscribe Face", "callback_data": "sub_face"},
                {"text": "🚫 Unsubscribe Face", "callback_data": "unsub_face"}
            ]
        ]
    }

def broadcast(target_set, text):
    for chat_id in target_set:
        send_message(chat_id, text)

# ================= SOCKET EVENTS =================
@sio.event
def connect():
    print("✅ Connected to Main Server")

@sio.on("update")
def on_update(data):
    global last_state, last_earthquake_time, vibration_active
    last_state = data

    vib = data["sensors"]["vib"]
    now = time.time()

    if vib == 1 and not vibration_active:
        vibration_active = True
        if vibration_users and now - last_earthquake_time >= EARTHQUAKE_COOLDOWN:
            broadcast(
                vibration_users,
                "📳     *EARTHQUAKE ALERT*      📳\nVibration detected!"
            )
            last_earthquake_time = now

    elif vib == 0:
        vibration_active = False

@sio.on("nfc_event")
def on_nfc(data):
    if not nfc_users:
        return

    msg = (
        "🔐        *ACCESSED*         🔐\n\n"
        f"*Status:* {data['status']}\n"
        f"*Name:* {data['name']}\n"
        f"*UID:* `{data['uid']}`"
    )
    broadcast(nfc_users, msg)

# ================= FACE EVENT =================
@sio.on("face_event")
def on_face(data):
    if not face_users:
        return

    name = data.get("name", "UNKNOWN")
    status = data.get("status", "unknown")
    image_url = data.get("image_url")

    now = time.time()
    key = name if status == "known" else "unknown"

    if key in last_face_time and now - last_face_time[key] < FACE_COOLDOWN:
        return

    last_face_time[key] = now

    if status == "known":
        broadcast(face_users, f"🟢 *FACE ACCESS GRANTED*\n👤 Name: {name}")
    else:
        for chat_id in face_users:
            send_location(chat_id)
            send_photo(
                chat_id,
                f"http://localhost:5000{image_url}",
                "🔴 *UNKNOWN FACE DETECTED*"
            )

# ================= TELEGRAM POLLING =================
def telegram_polling():
    offset = 0

    load_file(CHAT_FILE, all_users)
    load_file(STARTED_FILE, started_users)
    load_file(VIB_FILE, vibration_users)
    load_file(NFC_FILE, nfc_users)
    load_file(FACE_FILE, face_users)

    while True:
        r = requests.get(
            f"{TELEGRAM_API}/getUpdates",
            params={"timeout": 30, "offset": offset},
            timeout=35
        ).json()

        if not r.get("ok"):
            continue

        for update in r["result"]:
            offset = update["update_id"] + 1

            if "callback_query" in update:
                cb = update["callback_query"]
                chat_id = cb["message"]["chat"]["id"]
                action = cb["data"]

                if action == "sub_vib":
                    save_to_file(VIB_FILE, chat_id, vibration_users)
                    send_message(chat_id, "✅ Subscribed to vibration alerts")

                elif action == "unsub_vib":
                    vibration_users.discard(chat_id)
                    send_message(chat_id, "❌ Unsubscribed from vibration alerts")

                elif action == "sub_nfc":
                    save_to_file(NFC_FILE, chat_id, nfc_users)
                    send_message(chat_id, "✅ Subscribed to NFC alerts")

                elif action == "unsub_nfc":
                    nfc_users.discard(chat_id)
                    send_message(chat_id, "❌ Unsubscribed from NFC alerts")

                elif action == "sub_face":
                    save_to_file(FACE_FILE, chat_id, face_users)
                    send_message(chat_id, "✅ Subscribed to FACE alerts")

                elif action == "unsub_face":
                    face_users.discard(chat_id)
                    send_message(chat_id, "❌ Unsubscribed from FACE alerts")

                elif action == "status" and last_state:
                    s = last_state["sensors"]
                    send_message(
                        chat_id,
                        f"📊 *System Status*\n\n"
                        f"🌡 Temp: {s['temp']} °C\n"
                        f"💧 Humidity: {s['hum']} %\n"
                        f"⛽ Gas: {s['gas']}"
                    )

            if "message" in update:
                msg = update["message"]
                chat_id = msg["chat"]["id"]
                text = msg.get("text", "")

                if text == "/start":
                    save_to_file(CHAT_FILE, chat_id, all_users)
                    save_to_file(STARTED_FILE, chat_id, started_users)
                    send_message(chat_id, "🤖 Bot started\nUse /menu")

                elif text == "/menu":
                    send_message(chat_id, "📋 *Main Menu*", main_menu())

        time.sleep(1)

# ================= MAIN =================
if __name__ == "__main__":
    print("🚀 Telegram Server Started")

    sio.connect(MAIN_SERVER_URL)

    threading.Thread(
        target=telegram_polling,
        daemon=True
    ).start()

    sio.wait()
