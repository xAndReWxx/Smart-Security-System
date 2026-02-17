import React, { useEffect, useRef, useState } from "react";
import { ScanFace, ShieldCheck, UserPlus, MapPin, X } from "lucide-react";
import { socket } from "../socket";

interface FaceEvent {
  name: string;
  status: "known" | "unknown";
  image_url: string;
  time: string;
  camera: string;
}

const SERVER_URL = "http://localhost:5000";

function formatTime(ts: string) {
  const d = ts.slice(0, 8);
  const t = ts.slice(9, 15);
  return `${d.slice(6, 8)}/${d.slice(4, 6)}/${d.slice(0, 4)} ${t.slice(
    0,
    2
  )}:${t.slice(2, 4)}:${t.slice(4, 6)}`;
}

interface SecurityWidgetProps {
  cameraStatus: "active" | "offline" | "reconnecting";
}

export function SecurityWidget({ cameraStatus }: SecurityWidgetProps) {
  const [faces, setFaces] = useState<FaceEvent[]>([]);
  const lastKeyRef = useRef<string | null>(null);

  // ===== Add Known Popup =====
  const [selectedFace, setSelectedFace] = useState<FaceEvent | null>(null);
  const [inputName, setInputName] = useState("");

  // ===== Toast =====
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // ===== Highlight =====
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ================= CAMERA STATUS UI =================
  const statusMap = {
    active: {
      text: "Active",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      ring: "ring-emerald-500/40",
      anim: "animate-pulse"
    },
    reconnecting: {
      text: "Reconnecting",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      ring: "ring-amber-500/40",
      anim: "animate-spin"
    },
    offline: {
      text: "Offline",
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      ring: "ring-rose-500/40",
      anim: ""
    }
  }[cameraStatus];

  // ================= SOCKET =================
  useEffect(() => {
    const onFaceEvent = (event: FaceEvent) => {
      const key = `${event.image_url}-${event.time}`;
      if (lastKeyRef.current === key) return;
      lastKeyRef.current = key;

      setFaces((prev) => [event, ...prev].slice(0, 5));
    };

    socket.on("face_event", onFaceEvent);
    return () => socket.off("face_event", onFaceEvent);
  }, []);

  // ================= ADD KNOWN =================
  const confirmAdd = async () => {
    if (!inputName.trim() || !selectedFace) return;

    try {
      await fetch(`${SERVER_URL}/api/add-known`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inputName.trim(),
          image_url: selectedFace.image_url
        })
      });

      // ✅ Update UI
      setFaces((prev) =>
        prev.map((f) =>
          f.image_url === selectedFace.image_url
            ? { ...f, name: inputName.trim(), status: "known" }
            : f
        )
      );

      // ✅ Highlight
      setHighlighted((prev) => new Set(prev).add(selectedFace.image_url));
      setTimeout(() => {
        setHighlighted((prev) => {
          const n = new Set(prev);
          n.delete(selectedFace.image_url);
          return n;
        });
      }, 3000);

      showToast("Face added successfully");
      setSelectedFace(null);
      setInputName("");
    } catch {
      showToast("Failed to add face", "error");
    }
  };

  return (
    <div className="space-y-4 relative">
      {/* ================= TOAST ================= */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg
          text-sm text-white ${toast.type === "success" ? "bg-emerald-500" : "bg-rose-500"}`}
        >
          {toast.msg}
        </div>
      )}

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700 text-center">
          <ScanFace className="mx-auto text-cyan-400 mb-2" />
          <div className="text-2xl font-bold">{faces.length}</div>
          <div className="text-xs text-slate-400">Faces Detected</div>
        </div>

        {/* ===== CAMERA STATUS ===== */}
        <div className={`p-4 rounded-lg border border-slate-700 text-center ${statusMap.bg}`}>
          <div
            className={`mx-auto mb-2 w-12 h-12 rounded-full flex items-center justify-center
            ring-2 ${statusMap.ring}`}
          >
            <ShieldCheck
              className={`${statusMap.color} ${statusMap.anim}`}
              size={26}
            />
          </div>
          <div className={`font-bold ${statusMap.color}`}>
            {statusMap.text}
          </div>
          <div className="text-xs text-slate-400">Camera Status</div>
        </div>
      </div>

      {/* ================= LOG ================= */}
      <div className="bg-slate-950/50 rounded-lg border border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50">
          <h4 className="text-sm text-slate-300">Recent Recognition Log</h4>
        </div>

        <div className="divide-y divide-slate-800">
          {faces.map((face) => {
            const isHighlighted = highlighted.has(face.image_url);

            return (
              <div
                key={`${face.image_url}-${face.time}`}
                className={`p-3 flex justify-between items-center transition-all
                ${isHighlighted
                  ? "bg-emerald-500/10 border-l-4 border-emerald-400"
                  : "hover:bg-slate-800/30"}`}
              >
                <div className="flex gap-3 items-center">
                  <img
                    src={`${SERVER_URL}${face.image_url}?t=${face.time}`}
                    className="w-10 h-10 rounded-md object-cover border border-slate-700"
                  />

                  <div>
                    <div className="text-sm text-slate-200">{face.name}</div>
                    <div className="text-xs text-slate-500 flex gap-1 items-center">
                      <MapPin size={12} /> Front Gate
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatTime(face.time)}
                    </div>
                  </div>
                </div>

                {face.status === "known" ? (
                  <span className="text-xs text-emerald-400 font-mono">
                    Known
                  </span>
                ) : (
                  <button
                    onClick={() => setSelectedFace(face)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-md
                    bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                  >
                    <UserPlus size={14} />
                    Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= MODAL ================= */}
      {selectedFace && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center">
          <div className="bg-slate-900 rounded-xl p-5 w-80 border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-slate-200">
                Add Face to Known
              </h3>
              <button onClick={() => setSelectedFace(null)}>
                <X size={16} />
              </button>
            </div>

            <input
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="Enter name"
              className="w-full mb-4 px-3 py-2 rounded-md bg-slate-800
              border border-slate-700 text-sm text-slate-200"
            />

            <button
              onClick={confirmAdd}
              className="w-full py-2 rounded-md bg-emerald-500
              text-sm text-white hover:bg-emerald-600"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
