import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, Activity, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AlertPanelProps {
  vibration: boolean;
  gas: number;
}

type AlertType = "earthquake" | "fire";

interface AlertItem {
  id: number;
  type: AlertType;
  message: string;
  time: string;
}

export function AlertPanel({ vibration, gas }: AlertPanelProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const idRef = useRef(0);

  const lastVibrationRef = useRef(false);
  const lastGasAlertRef = useRef(false);

  // ===== ADD ALERT =====
  const pushAlert = (type: AlertType) => {
    setAlerts((prev) => {
      const next = [
        {
          id: idRef.current++,
          type,
          message:
            type === "earthquake"
              ? "Earthquake detected"
              : "Gas level critical",
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ];

      // ⬅️ أحدث 5 Alerts فقط
      return next.slice(0, 5);
    });
  };

  // ===== EARTHQUAKE EDGE =====
  useEffect(() => {
    if (vibration && !lastVibrationRef.current) {
      pushAlert("earthquake");
    }
    lastVibrationRef.current = vibration;
  }, [vibration]);

  // ===== GAS EDGE =====
  useEffect(() => {
    if (gas >= 50 && !lastGasAlertRef.current) {
      pushAlert("fire");
      lastGasAlertRef.current = true;
    }

    if (gas < 45) {
      lastGasAlertRef.current = false;
    }
  }, [gas]);

  const clearAlerts = () => setAlerts([]);

  return (
    <div className="h-full flex flex-col">

      {/* ===== HEADER ===== */}
      <div className="flex justify-end mb-2">
        <button
          onClick={clearAlerts}
          className="text-xs text-slate-400 hover:text-red-400 transition"
        >
          Clear Alerts
        </button>
      </div>

      {/* ===== ALERT LIST ===== */}
      <div className="flex-1 space-y-3 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {alerts.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center text-slate-500 text-sm"
            >
              No active alerts
            </motion.div>
          )}

          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={`
                flex items-center justify-between
                rounded-lg border px-4 py-3
                bg-slate-900/70 backdrop-blur
                ${
                  alert.type === "earthquake"
                    ? "border-red-500/40 text-red-400"
                    : "border-orange-500/40 text-orange-400"
                }
              `}
            >
              <div className="flex items-center gap-3">
                {alert.type === "earthquake" ? (
                  <Activity />
                ) : (
                  <Flame />
                )}

                <div>
                  <div className="font-medium text-sm">
                    {alert.message}
                  </div>
                  <div className="text-xs opacity-70">
                    {alert.time}
                  </div>
                </div>
              </div>

              <AlertTriangle className="opacity-70" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
