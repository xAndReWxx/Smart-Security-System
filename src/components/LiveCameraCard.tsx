import React, { useEffect, useRef } from "react";
import { Video } from "lucide-react";
import { Card } from "./ui/Card";

const WS_URL = "ws://localhost:9876"; // عدّل حسب جهازك
const RECONNECT_DELAY = 2000; // 2 ثواني

interface LiveCameraCardProps {
  onStatusChange?: (status: "active" | "offline" | "reconnecting") => void;
}

export function LiveCameraCard({ onStatusChange }: LiveCameraCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const connect = () => {
    if (!canvasRef.current) return;

    console.log("📡 Connecting to Camera WebSocket...");
    onStatusChange?.("reconnecting");

    const ws = new WebSocket(WS_URL);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ws.onopen = () => {
      console.log("📡 Camera WebSocket connected");
      onStatusChange?.("active");
    };

    ws.onmessage = (event) => {
      const blob = new Blob([event.data], { type: "image/jpeg" });
      const img = new Image();

      img.onload = () => {
        if (!canvasRef.current) return;

        if (
          canvasRef.current.width !== img.width ||
          canvasRef.current.height !== img.height
        ) {
          canvasRef.current.width = img.width;
          canvasRef.current.height = img.height;
        }

        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(img.src);
      };

      img.src = URL.createObjectURL(blob);
    };

    ws.onerror = () => {
      console.warn("⚠️ Camera WebSocket error");
    };

    ws.onclose = () => {
      console.log("🔌 Camera WebSocket disconnected");
      onStatusChange?.("offline");

      if (!mountedRef.current) return;

      reconnectTimerRef.current = window.setTimeout(() => {
        connect();
      }, RECONNECT_DELAY);
    };
  };

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <Card title="Live Camera – Front Gate" icon={<Video />}>
      <div className="relative rounded-lg overflow-hidden border border-slate-800">
        <canvas ref={canvasRef} className="w-full bg-black" />
      </div>

      <div className="mt-2 text-xs text-slate-400 text-center">
        Live Stream • ESP32-CAM
      </div>
    </Card>
  );
}
