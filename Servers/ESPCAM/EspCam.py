import asyncio
import websockets
import cv2
import numpy as np
import face_recognition
import os
import time
import base64
import requests

# ================= CONFIG =================
HOST = "0.0.0.0"
PORT = 9876

PROCESS_EVERY = 5        # recognize every N frames
EVENT_COOLDOWN = 5       # seconds between events for same person
CAMERA_ID = "cam_01"

FACE_EVENT_URL = "http://localhost:5000/api/face-event"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KNOWN_DIR = os.path.join(BASE_DIR, "known_faces")

print(f"📂 Known faces dir: {KNOWN_DIR}")

# ================= GLOBALS =================
clients = set()
frame_id = 0
last_faces = []
last_sent = {}   # {name: timestamp}

known_face_encodings = []
known_face_names = []

# ================= LOAD KNOWN FACES =================
def load_known_faces():
    global known_face_encodings, known_face_names

    known_face_encodings.clear()
    known_face_names.clear()

    if not os.path.isdir(KNOWN_DIR):
        print("⚠️ known_faces directory not found")
        return

    for f in os.listdir(KNOWN_DIR):
        if not f.lower().endswith((".jpg", ".png")):
            continue

        path = os.path.join(KNOWN_DIR, f)
        try:
            image = face_recognition.load_image_file(path)
            encs = face_recognition.face_encodings(image)
            if encs:
                known_face_encodings.append(encs[0])
                name = os.path.splitext(f)[0].split("_")[0]
                known_face_names.append(name)
        except Exception as e:
            print("❌ Failed loading face:", f, e)

    print(f"✅ Reloaded {len(known_face_names)} known faces")

# تحميل أول مرة
load_known_faces()

# ================= SEND FACE EVENT =================
def send_face_event(face_img, name):
    try:
        _, jpg = cv2.imencode(
            ".jpg",
            face_img,
            [int(cv2.IMWRITE_JPEG_QUALITY), 80]
        )

        payload = {
            "camera_id": CAMERA_ID,
            "name": name if name != "Unknown" else "UNKNOWN",
            "status": "known" if name != "Unknown" else "unknown",
            "image": base64.b64encode(jpg).decode()
        }

        requests.post(FACE_EVENT_URL, json=payload, timeout=1)

    except Exception as e:
        print("❌ Failed to send face event:", e)

# ================= WEBSOCKET HANDLER =================
async def handler(ws):
    global frame_id, last_faces

    clients.add(ws)
    print("[+] Client connected")

    try:
        async for message in ws:
            if not isinstance(message, (bytes, bytearray)):
                continue

            frame = cv2.imdecode(
                np.frombuffer(message, np.uint8),
                cv2.IMREAD_COLOR
            )
            if frame is None:
                continue

            frame_id += 1

            # ===== Face Recognition =====
            if frame_id % PROCESS_EVERY == 0:
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                locations = face_recognition.face_locations(rgb, model="hog")
                encodings = face_recognition.face_encodings(rgb, locations)

                last_faces = []

                for (t, r, b, l), enc in zip(locations, encodings):
                    name = "Unknown"

                    if known_face_encodings:
                        matches = face_recognition.compare_faces(
                            known_face_encodings,
                            enc,
                            tolerance=0.55
                        )
                        if True in matches:
                            name = known_face_names[matches.index(True)]

                    last_faces.append((t, r, b, l, name))

                    # ===== Send Event with Cooldown =====
                    now = time.time()
                    key = name

                    if key not in last_sent or now - last_sent[key] > EVENT_COOLDOWN:
                        face_crop = frame[t:b, l:r]
                        if face_crop.size != 0:
                            send_face_event(face_crop, name)
                            last_sent[key] = now

            # ===== Draw Boxes =====
            for (t, r, b, l, name) in last_faces:
                cv2.rectangle(frame, (l, t), (r, b), (0, 255, 0), 2)
                cv2.putText(
                    frame,
                    name,
                    (l, t - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 255, 0),
                    2
                )

            # ===== Encode Frame =====
            _, jpg = cv2.imencode(
                ".jpg",
                frame,
                [int(cv2.IMWRITE_JPEG_QUALITY), 85]
            )

            # ===== Broadcast (FIXED) =====
            dead = []

            for c in list(clients):   # 🔥 IMPORTANT FIX
                try:
                    await c.send(jpg.tobytes())
                except:
                    dead.append(c)

            for d in dead:
                clients.discard(d)

    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        clients.discard(ws)
        print("[-] Client disconnected")

# ================= MAIN =================
async def main():
    print(f"🚀 ESP CAM WS running on ws://{HOST}:{PORT}")
    async with websockets.serve(
        handler,
        HOST,
        PORT,
        max_size=2**23
    ):
        await asyncio.Future()  # run forever

asyncio.run(main())
