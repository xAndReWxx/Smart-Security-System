from flask import Flask, request, jsonify, send_from_directory
from flask_socketio import SocketIO
import serial
import threading
import time
import base64
import os
import shutil
from datetime import datetime
from flask_cors import CORS
# ================= FILE SYSTEM =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

ESPCAM_DIR = os.path.join(BASE_DIR, "ESPCAM")
FACES_DIR = os.path.join(ESPCAM_DIR, "faces")
KNOWN_FACES_DIR = os.path.join(ESPCAM_DIR, "known_faces")

os.makedirs(FACES_DIR, exist_ok=True)
os.makedirs(KNOWN_FACES_DIR, exist_ok=True)

# ================= CONFIG =================
SERIAL_PORT = "COM9"      # عدل حسب جهازك
BAUD_RATE = 9600

# ================= FLASK =================
app = Flask(__name__)
app.config["SECRET_KEY"] = "smart-monitoring-secret"
CORS(app, resources={r"/api/*": {"origins": "*"}})

socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode="threading"   # مستقر مع Windows
)



# ================= SERIAL =================
try:
    arduino = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    print(f"✅ Arduino connected on {SERIAL_PORT}")
except Exception as e:
    arduino = None
    print("⚠️ Arduino not connected:", e)


# ================= GLOBAL STATE =================
state = {
    "radar": {
        "angle": 0,
        "distance": 0
    },
    "sensors": {
        "temp": 0.0,
        "hum": 0.0,
        "gas": 0,
        "vib": 0      # vibration event (0 / 1)
    }
}

# ================= HELPERS =================
def emit_update():
    socketio.emit("update", state)

# ================= SOCKET EVENTS =================
@socketio.on("connect")
def on_connect():
    print("🟢 Web Client Connected")
    emit_update()

@socketio.on("disconnect")
def on_disconnect():
    print("🔴 Web Client Disconnected")

@socketio.on("nfc_event")
def handle_nfc_event(data):
    print("📡 NFC EVENT RECEIVED:", data)
    socketio.emit("nfc_event", data)

# ================= FACE EVENT API =================
@app.route("/api/face-event", methods=["POST"])
def face_event():
    data = request.json or {}

    name = data.get("name", "UNKNOWN")
    status = data.get("status", "unknown")
    image_b64 = data.get("image")
    camera_id = data.get("camera_id", "cam_01")

    if not image_b64:
        return jsonify({"error": "no image"}), 400

    try:
        img_bytes = base64.b64decode(image_b64)
    except Exception:
        return jsonify({"error": "invalid image"}), 400

    ts = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    safe_name = name.replace(" ", "_")
    filename = f"{safe_name}_{ts}.jpg"
    path = os.path.join(FACES_DIR, filename)

    with open(path, "wb") as f:
        f.write(img_bytes)

    event = {
        "camera": camera_id,
        "name": name,
        "status": status,
        "image_url": f"/faces/{filename}",
        "time": ts
    }

    # بث الحدث للويب
    socketio.emit("face_event", event)

    return jsonify({"status": "ok"})

# ================= SERVE FACE IMAGES =================
@app.route("/faces/<filename>")
def serve_face(filename):
    return send_from_directory(FACES_DIR, filename)

@app.route("/api/add-known", methods=["POST"])
def add_known():
    try:
        data = request.json or {}

        name = data.get("name")
        image_url = data.get("image_url")

        if not name or not image_url:
            return jsonify({"error": "missing data"}), 400

        filename = os.path.basename(image_url)
        src_path = os.path.join(FACES_DIR, filename)

        if not os.path.exists(src_path):
            return jsonify({"error": "source image not found"}), 404

        existing = [
            f for f in os.listdir(KNOWN_FACES_DIR)
            if f.startswith(f"{name}_")
        ]

        new_index = len(existing) + 1
        dest_path = os.path.join(
            KNOWN_FACES_DIR,
            f"{name}_{new_index}.jpg"
        )

        shutil.copy(src_path, dest_path)

        return jsonify({
            "status": "ok",
            "saved_as": f"{name}_{new_index}.jpg"
        })

    except Exception as e:
        print("❌ ADD KNOWN ERROR:", e)
        return jsonify({"error": "server error"}), 500

# ================= SERIAL THREAD =================
def read_arduino():
    print("📡 Serial thread started")
    while True:
        try:
            line = arduino.readline().decode(errors="ignore").strip()
            if not line:
                continue

            parts = line.split(",")

            # ================= RADAR =================
            # R,angle,distance
            if parts[0] == "R" and len(parts) == 3:
                state["radar"]["angle"] = int(parts[1])
                state["radar"]["distance"] = int(parts[2])
                emit_update()

            # ================= SENSORS =================
            # S,temp,hum,gas
            elif parts[0] == "S" and len(parts) == 4:
                state["sensors"]["temp"] = float(parts[1])
                state["sensors"]["hum"] = float(parts[2])
                state["sensors"]["gas"] = int(parts[3])
                emit_update()

            # ================= VIBRATION EVENT =================
            # V,1
            elif parts[0] == "V":
                state["sensors"]["vib"] = 1
                emit_update()

                def reset_vibration():
                    time.sleep(0.5)
                    state["sensors"]["vib"] = 0
                    emit_update()

                threading.Thread(
                    target=reset_vibration,
                    daemon=True
                ).start()

        except Exception as e:
            print("❌ Serial Error:", e)
            time.sleep(1)

# ================= MAIN =================
if __name__ == "__main__":
    print("🚀 Starting Smart Monitoring Server")

    threading.Thread(
        target=read_arduino,
        daemon=True
    ).start()

    socketio.run(
        app,
        host="0.0.0.0",
        port=5000,
        debug=False
    )
