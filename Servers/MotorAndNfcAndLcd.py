import asyncio
import websockets
import json
from datetime import datetime
import socketio

# ================= USERS (NFC) =================
USERS = {
    "A4961F3E": "Ammar",
    "03976D6A": "Hana",
    "945C453E": "Menna",
    "038E226A": "Mohamed",
    "1BB24302": "Andrew",
    "33D3316A": "Mostafa",
    "94A9133E": "Filo"
}

# ================= SOCKET.IO CLIENT (Main Server) =================
sio = socketio.Client()

@sio.event
def connect():
    print("✅ Connected to Main Server (Dashboard)")

@sio.event
def disconnect():
    print("❌ Disconnected from Main Server")

sio.connect("http://localhost:5000")

# ================= GLOBALS =================
connected_esp = set()
main_loop = None   # 🔥 event loop الأساسي

# ================= OPEN DOOR =================
async def open_door(name):
    for ws in list(connected_esp):
        try:
            await ws.send(json.dumps({
                "action": "OPEN",
                "name": name
            }))
        except:
            connected_esp.discard(ws)

# ================= FACE EVENT =================
@sio.on("face_event")
def handle_face_event(data):
    try:
        if data.get("status") != "known":
            return

        name = data.get("name", "Unknown")
        now = datetime.now().strftime("%H:%M:%S")

        print(f"📷 FACE ACCESS GRANTED: {name}")

        # 🔑 افتح الباب باستخدام الـ event loop الصح
        if main_loop:
            asyncio.run_coroutine_threadsafe(
                open_door(name),
                main_loop
            )

        # Dashboard log
        sio.emit("nfc_event", {
            "status": "AUTHORIZED",
            "uid": "FACE",
            "name": name,
            "method": "FACE",
            "time": now
        })

    except Exception as e:
        print("❌ FACE EVENT ERROR:", e)

# ================= NFC + MOTOR + LCD SERVER =================
async def handler(websocket):
    print("📡 ESP Connected")
    connected_esp.add(websocket)

    try:
        async for message in websocket:
            data = json.loads(message)

            # ===== NFC EVENT =====
            if "uid" in data:
                uid = data["uid"]
                now = datetime.now().strftime("%H:%M:%S")

                # ===== AUTHORIZED =====
                if uid in USERS:
                    name = USERS[uid]

                    # فتح الباب (زي ما كان)
                    await websocket.send(json.dumps({
                        "action": "OPEN",
                        "name": name
                    }))

                    sio.emit("nfc_event", {
                        "status": "AUTHORIZED",
                        "uid": uid,
                        "name": name,
                        "method": "NFC",
                        "time": now
                    })

                    print(f"✅ NFC ACCESS GRANTED: {name} ({uid})")

                # ===== DENIED =====
                else:
                    await websocket.send(json.dumps({
                        "action": "DENIED"
                    }))

                    sio.emit("nfc_event", {
                        "status": "DENIED",
                        "uid": uid,
                        "name": "Unknown",
                        "method": "NFC",
                        "time": now
                    })

                    print(f"❌ NFC ACCESS DENIED: {uid}")

    except websockets.exceptions.ConnectionClosed:
        print("⚠️ ESP Disconnected")

    finally:
        connected_esp.discard(websocket)

# ================= MAIN =================
async def main():
    global main_loop
    main_loop = asyncio.get_running_loop()   # 🔥 نخزن الـ loop

    async with websockets.serve(handler, "0.0.0.0", 8765):
        print("🚀 NFC / FACE / Motor Server Running on port 8765")
        await asyncio.Future()  # run forever

asyncio.run(main())
