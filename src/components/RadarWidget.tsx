import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface RadarWidgetProps {
  angle: number;     // servo angle (15 → 165)
  distance: number;  // ultrasonic cm
}

interface Detection {
  id: number;
  x: number;
  y: number;
  createdAt: number;
}

/* ===== CONFIG ===== */
const DETECT_DELAY = 1000;      // 3 ثواني بين كل detect
const FADE_TIME = 3000;         // fade out
const MAX_DISTANCE_CM = 220;    // نصف الدايرة
const MAX_DETECT_CM = 200;      // detection limit
const MAX_RADIUS_UI = 50;       // آخر قوس (%)

export function RadarWidget({ angle, distance }: RadarWidgetProps) {
  const [detections, setDetections] = useState<Detection[]>([]);
  const lastDetectRef = useRef(0);
  const idRef = useRef(0);

  /* ===== Servo → UI Mapping ===== */
  // Servo: 15 → 165
  // UI:   -90 → +90
  const scanRotation =
    ((angle - 15) / (165 - 15)) * 180 - 90;

  /* ===== Detection Logic ===== */
  useEffect(() => {
    const now = Date.now();

    if (
      distance > 0 &&
      distance <= MAX_DETECT_CM &&
      now - lastDetectRef.current >= DETECT_DELAY
    ) {
      lastDetectRef.current = now;

      const clamped = Math.min(distance, MAX_DISTANCE_CM);

      // 🔑 mapping حقيقي: 100cm = نص الدايرة
      const radius =
        (clamped / MAX_DISTANCE_CM) * MAX_RADIUS_UI;

      const angleRad = (angle * Math.PI) / 180;

      const x = 50 + radius * Math.cos(Math.PI - angleRad);
      const y = 100 - radius * Math.sin(angleRad);

      setDetections(prev => [
        ...prev,
        {
          id: idRef.current++,
          x,
          y,
          createdAt: now,
        },
      ]);
    }
  }, [angle, distance]);

  /* ===== Fade Cleanup ===== */
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setDetections(prev =>
        prev.filter(d => now - d.createdAt < FADE_TIME)
      );
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative w-full aspect-[2/1] overflow-hidden">
        <div
          className="
            absolute bottom-0 left-1/2 -translate-x-1/2
            w-full h-full rounded-t-full
            bg-slate-950 border border-cyan-900/40
            overflow-hidden
          "
        >
          {/* ===== RANGE RINGS ===== */}
          {[0.25, 0.5, 0.75, 1].map((r, i) => (
            <div
              key={i}
              className="
                absolute bottom-0 left-1/2 -translate-x-1/2
                rounded-t-full border border-cyan-900/30
              "
              style={{
                width: `${r * 100}%`,
                height: `${r * 100}%`,
              }}
            />
          ))}

          {/* ===== SCAN LINE ===== */}
          <motion.div
            className="
              absolute bottom-0 left-1/2 origin-bottom
              w-px h-full bg-cyan-400
            "
            animate={{ rotate: scanRotation }}
            transition={{ duration: 0.015, ease: "linear" }}
            style={{
              boxShadow: "0 0 25px rgba(34,211,238,0.9)",
            }}
          />

          {/* ===== SCAN GLOW ===== */}
          <motion.div
            className="absolute bottom-0 left-1/2 origin-bottom w-full h-full"
            animate={{ rotate: scanRotation }}
            transition={{ duration: 0.015, ease: "linear" }}
          >
            <div
              className="
                absolute bottom-0 left-1/2 -translate-x-1/2
                w-1/2 h-full
                bg-gradient-to-t
                from-cyan-500/25
                via-cyan-400/10
                to-transparent
                blur-md
              "
            />
          </motion.div>

          {/* ===== DETECTIONS ===== */}
          {detections.map(d => {
            const age = Date.now() - d.createdAt;
            const opacity = 1 - age / FADE_TIME;

            return (
              <div
                key={d.id}
                className="absolute w-4 h-4 -ml-2 -mt-2"
                style={{
                  left: `${d.x}%`,
                  top: `${d.y}%`,
                  opacity,
                }}
              >
                {/* DOT */}
                <div
                  className="
                    w-3 h-3 rounded-full
                    bg-emerald-400
                    shadow-lg shadow-emerald-400/80
                  "
                />

                {/* RIPPLE */}
                <div
                  className="
                    absolute inset-0 rounded-full
                    border border-emerald-400
                    animate-ping
                    opacity-40
                  "
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
