import { useState } from "react";
import { UserPlus, MapPin } from "lucide-react";
import { Card } from "./ui/Card";

export function FaceRecognitionCard({ events }: { events: any[] }) {
  const [editing, setEditing] = useState<number | null>(null);
  const [nameInput, setNameInput] = useState("");

  return (
    <Card title="Face Recognition" icon={<MapPin />}>
      <div className="space-y-3">
        {events.length === 0 && (
          <p className="text-slate-500 text-sm text-center">
            No face recognition events
          </p>
        )}

        {events.map((e, i) => (
          <div
            key={i}
            className="flex gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/40"
          >
            {/* IMAGE */}
            <img
              src={`http://192.168.1.7:5000${e.image_url}`}
              className="w-16 h-16 rounded-lg object-cover"
            />

            {/* INFO */}
            <div className="flex-1">
              {editing === i ? (
                <input
                  value={nameInput}
                  onChange={ev => setNameInput(ev.target.value)}
                  placeholder="Enter name"
                  className="w-full bg-slate-800 px-2 py-1 rounded text-sm"
                />
              ) : (
                <p className="font-semibold text-slate-200">
                  {e.name}
                </p>
              )}

              <p className="text-xs text-slate-400">
                📍 Front Gate
              </p>
              <p className="text-xs text-slate-500">
                ⏰ {e.time}
              </p>
            </div>

            {/* ACTION */}
            {e.status === "unknown" && (
              <button
                onClick={() => {
                  if (editing === i) {
                    console.log("ADD TO KNOWN:", nameInput, e);
                    setEditing(null);
                    setNameInput("");
                  } else {
                    setEditing(i);
                  }
                }}
                className="text-xs px-2 py-1 h-fit rounded-md
                  bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
              >
                <UserPlus size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
