import React, { useEffect, useRef, useState } from "react";
import { Activity } from "lucide-react";
import { motion } from "framer-motion";

interface SeismicWidgetProps {
  vibrationLevel: number; // 0 → 1
}

export function SeismicWidget({ vibrationLevel }: SeismicWidgetProps) {
  const BAR_COUNT = 40;
  const bars = Array.from({ length: BAR_COUNT }).map((_, i) => i);
  const center = BAR_COUNT / 2;

  // ===== Smooth vibration level =====
  const [level, setLevel] = useState(0);
  const levelRef = useRef(0);

  // ===== Noise arrays =====
  const vibNoiseRef = useRef<number[]>(
    Array.from({ length: Math.floor(center) }).map(() => Math.random())
  );

  const idleNoiseRef = useRef<number[]>(
    Array.from({ length: BAR_COUNT }).map(() => Math.random())
  );

  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const speedUp = 0.14;
    const speedDown = 0.07;

    const loop = () => {
      // ===== Smooth vibration curve =====
      const diff = vibrationLevel - levelRef.current;
      const step = diff > 0 ? diff * speedUp : diff * speedDown;

      levelRef.current =
        Math.abs(diff) < 0.001
          ? vibrationLevel
          : levelRef.current + step;

      setLevel(levelRef.current);

      // ===== Update noises =====
      vibNoiseRef.current = vibNoiseRef.current.map(
        (n) => n * 0.82 + Math.random() * 0.18
      );

      idleNoiseRef.current = idleNoiseRef.current.map(
        (n) => n * 0.7 + Math.random() * 0.3 // ⬅️ أقوى بكتير
      );

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [vibrationLevel]);

  return (
    <div className="relative overflow-hidden rounded-lg bg-slate-950 border border-slate-800 p-6">

      {/* ===== HEADER ===== */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <Activity className="text-emerald-500" size={24} />
        </div>
        <h4 className="text-slate-200 font-bold">
          Seismic Activity
        </h4>
      </div>

      {/* ===== WAVE ===== */}
      <div className="h-32 flex items-center justify-center gap-1">
        {bars.map((i) => {
          const distFromCenter = Math.abs(i - center);
          const falloff = Math.max(0.3, 1 - distFromCenter / center);

          // ===== BASE HEIGHT (different always) =====
          const baseHeight = 8 + idleNoiseRef.current[i] * 12;

          // ===== STRONG IDLE MOTION =====
          const idleMotion =
            idleNoiseRef.current[i] * (18 + Math.sin(i) * 6);

          // ===== VIBRATION MOTION =====
          const vibIdx = Math.min(
            Math.floor(distFromCenter),
            vibNoiseRef.current.length - 1
          );
          const vibNoise = vibNoiseRef.current[vibIdx];

          const vibHeight =
            level * falloff * (70 + vibNoise * 40);

          const height = baseHeight + idleMotion + vibHeight;

          // ===== COLOR GRADIENT =====
          const r = Math.min(239, 16 + level * 223);
          const g = Math.max(68, 185 - level * 120);
          const color = `rgba(${r},${g},129,0.85)`;

          return (
            <motion.div
              key={i}
              className="w-2 rounded-full"
              style={{ backgroundColor: color }}
              animate={{
                height,
                opacity: level > 0 ? 0.95 : 0.6,
              }}
              transition={{
                duration: vibrationLevel > 0 ? 0.55 : 0.9,
                ease: "easeInOut",
              }}
            />
          );
        })}
      </div>

      {/* ===== TIMELINE ===== */}
      <div className="mt-4 flex justify-between text-xs text-slate-500 font-mono">
        <span>-10s</span>
        <span>-5s</span>
        <span>NOW</span>
      </div>
    </div>
  );
}
