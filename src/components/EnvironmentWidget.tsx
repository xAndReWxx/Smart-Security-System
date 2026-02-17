import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Thermometer, Droplets, Flame } from "lucide-react";

interface EnvironmentWidgetProps {
  temperature: number;
  humidity: number;
  gas: number;
}

interface ChartPoint {
  time: string;
  val: number;
}

const MAX_POINTS = 12;

export function EnvironmentWidget({
  temperature,
  humidity,
  gas,
}: EnvironmentWidgetProps) {
  const [tempData, setTempData] = useState<ChartPoint[]>([]);
  const [humidData, setHumidData] = useState<ChartPoint[]>([]);
  const [gasData, setGasData] = useState<ChartPoint[]>([]);

  useEffect(() => {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString().slice(0, 5);

    setTempData((prev) =>
      [...prev, { time: timeLabel, val: temperature }].slice(-MAX_POINTS)
    );

    setHumidData((prev) =>
      [...prev, { time: timeLabel, val: humidity }].slice(-MAX_POINTS)
    );

    setGasData((prev) =>
      [...prev, { time: timeLabel, val: gas }].slice(-MAX_POINTS)
    );
  }, [temperature, humidity, gas]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* ===== Temperature ===== */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-300">
            <Thermometer className="text-orange-500" size={20} />
            <span className="font-medium">Temperature</span>
          </div>
          <span className="text-2xl font-bold text-slate-100">
            {temperature.toFixed(1)}°C
          </span>
        </div>

        <div className="h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={tempData}>
              <Line
                type="monotone"
                dataKey="val"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  borderRadius: "8px",
                }}
                itemStyle={{ color: "#f97316" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===== Humidity ===== */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-300">
            <Droplets className="text-blue-500" size={20} />
            <span className="font-medium">Humidity</span>
          </div>
          <span className="text-2xl font-bold text-slate-100">
            {humidity.toFixed(1)}%
          </span>
        </div>

        <div className="h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={humidData}>
              <Line
                type="monotone"
                dataKey="val"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  borderRadius: "8px",
                }}
                itemStyle={{ color: "#3b82f6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===== Gas ===== */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-300">
            <Flame className="text-red-500" size={20} />
            <span className="font-medium">Gas</span>
          </div>
          <span className="text-2xl font-bold text-slate-100">
            {gas.toFixed(0)}%
          </span>
        </div>

        <div className="h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={gasData}>
              <Line
                type="monotone"
                dataKey="val"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  borderRadius: "8px",
                }}
                itemStyle={{ color: "#ef4444" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
