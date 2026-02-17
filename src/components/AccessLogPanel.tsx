import React, { useEffect, useRef, useState } from "react";
import { KeyRound, AlertOctagon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AccessLogEvent {
  status: "AUTHORIZED" | "DENIED";
  name: string;
  uid: string;
  method: string; // NFC
  time: string;
}

interface AccessLogPanelProps {
  event: AccessLogEvent | null;
}

interface LogItem extends AccessLogEvent {
  id: number;
}

export function AccessLogPanel({ event }: AccessLogPanelProps) {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const idRef = useRef(0);
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!event) return;

    const key = `${event.uid}-${event.time}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    setLogs(prev => [
      {
        ...event,
        id: idRef.current++
      },
      ...prev
    ].slice(0, 5));
  }, [event]);

  return (
    <div className="h-full flex flex-col">
      {/* ===== CLEAR ===== */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setLogs([])}
          className="text-xs text-slate-400 hover:text-cyan-400 transition"
        >
          Clear Logs
        </button>
      </div>

      {/* ===== LOGS ===== */}
      <div className="flex-1 space-y-3 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {logs.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center text-slate-500 text-sm"
            >
              No access events
            </motion.div>
          )}

          {logs.map(log => {
            const granted = log.status === "AUTHORIZED";

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className={`
                  flex items-center justify-between
                  rounded-lg border px-4 py-3 backdrop-blur
                  ${granted
                    ? "bg-900/40 border-emerald-500/40 text-emerald-400"
                    : "bg-900/40 border-red-500/40 text-red-400"}
                `}
              >
                {/* ===== LEFT ===== */}
                <div className="flex items-center gap-3">
                  {granted ? <KeyRound /> : <AlertOctagon />}

                  <div>
                    <div className="text-sm font-medium">
                      {granted ? log.name : "Unknown User"}
                    </div>

                    <div className="text-xs opacity-75">
                      UID: {log.uid}
                    </div>

                    <div className="text-xs opacity-60">
                      {log.time}
                    </div>
                  </div>
                </div>

                {/* ===== RIGHT (NFC) ===== */}
                <div
                  className="
                    text-xs font-mono px-2 py-1 rounded-md
                    border border-cyan-500/40 text-cyan-400
                  "
                >
                  {log.method}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
