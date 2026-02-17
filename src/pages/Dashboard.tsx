import React, { useEffect, useRef, useState } from "react";
import { Radar, Thermometer, Shield, AlertTriangle } from "lucide-react";
import { socket } from "../socket";

import { Card } from "../components/ui/Card";
import { RadarWidget } from "../components/RadarWidget";
import { AlertPanel } from "../components/AlertPanel";
import { EnvironmentWidget } from "../components/EnvironmentWidget";
import { SeismicWidget } from "../components/SeismicWidget";
import { SecurityWidget } from "../components/SecurityWidget";
import { AccessLogPanel } from "../components/AccessLogPanel";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { LiveCameraCard } from "../components/LiveCameraCard";


interface ServerData {
    radar: {
        angle: number;
        distance: number;
    };
    sensors: {
        temp: number;
        hum: number;
        gas: number;
        vib: number;
    };
}

export function Dashboard() {
    const [data, setData] = useState<ServerData | null>(null);
    const [lastUpdate, setLastUpdate] = useState("--:--:--");

    // ===== vibration state =====
    const [vibrationActive, setVibrationActive] = useState(false);
    const vibTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // ===== NFC STATES =====
    const [nfcStatus, setNfcStatus] = useState("IDLE");
    const [nfcUid, setNfcUid] = useState("----");
    const [lastNfcEvent, setLastNfcEvent] = useState<any>(null);
    const [cameraStatus, setCameraStatus] = useState<
        "active" | "offline" | "reconnecting"
    >("offline");

    // ================= SOCKET =================
    useEffect(() => {
        const onUpdate = (serverData: ServerData) => {
            setData(serverData);
            setLastUpdate(new Date().toLocaleTimeString());

            if (serverData.sensors.vib === 1) {
                setVibrationActive(true);

                if (vibTimeoutRef.current) {
                    clearTimeout(vibTimeoutRef.current);
                }

                vibTimeoutRef.current = setTimeout(() => {
                    setVibrationActive(false);
                }, 1500);
            }
        };

        const onNfcEvent = (data: any) => {
            setNfcStatus(data.status);
            setNfcUid(data.uid);
            setLastNfcEvent(data);
        };

        socket.on("update", onUpdate);
        socket.on("nfc_event", onNfcEvent);

        return () => {
            socket.off("update", onUpdate);
            socket.off("nfc_event", onNfcEvent);
            if (vibTimeoutRef.current) clearTimeout(vibTimeoutRef.current);
        };
    }, []);

    // ================= LOADING =================
    if (!data) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
                Waiting for data from server...
            </div>
        );
    }

    // ================= UI =================
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden">
            <AnimatedBackground />

            <div className="relative z-10 p-4 md:p-8">
                {/* ===== HEADER ===== */}
                <header className="mb-8 flex flex-col md:flex-row justify-between gap-4 border-b border-slate-800/50 pb-6 bg-slate-900/20 backdrop-blur-sm rounded-xl p-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <Radar className="text-cyan-500 animate-pulse" />
                            Smart Monitoring System
                        </h1>
                        <p className="text-slate-400">
                            Central Control Panel for Radar and Sensors
                        </p>
                    </div>

                    <div className="text-right">
                        <div className="text-sm font-mono text-slate-500">
                            Last Update
                        </div>
                        <div className="font-mono text-cyan-400">
                            {lastUpdate}
                        </div>
                    </div>
                </header>

                {/* ===== MAIN GRID ===== */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* ===== LEFT COLUMN ===== */}
                    <div className="lg:col-span-7 space-y-6">
                        <Card title="Environment" icon={<Thermometer />}>
                            <EnvironmentWidget
                                temperature={data.sensors.temp}
                                humidity={data.sensors.hum}
                                gas={data.sensors.gas}
                            />
                        </Card>

                        <Card title="Security System" icon={<Shield />}>
                            <SecurityWidget cameraStatus={cameraStatus} />

                        </Card>

                        {/* 🎥 LIVE CAMERA */}
                        <LiveCameraCard onStatusChange={setCameraStatus} />


                        
                    </div>

                    {/* ===== RIGHT COLUMN ===== */}
                    <div className="lg:col-span-5 space-y-6">
                        <Card title="Field Radar (180° Scan)" icon={<Radar />}>
                            <div className="flex flex-col h-full">
                                <div className="flex-1 flex items-center justify-center py-6">
                                    <RadarWidget
                                        angle={data.radar.angle}
                                        distance={data.radar.distance}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4 mt-6 border-t border-slate-800/50 pt-6">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-white">
                                            180°
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Scan Angle
                                        </div>
                                    </div>

                                    <div className="text-center border-x border-slate-800/50">
                                        <div className="text-2xl font-bold text-cyan-400">
                                            {data.radar.distance} cm
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Nearest Object
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-emerald-400">
                                            Active
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Sensor Status
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                        
                        <SeismicWidget
                            vibrationLevel={vibrationActive ? 1 : 0}
                        />
                        {/* ===== ACCESS LOGS ===== */}
                        <Card title="Access Logs" icon={<Shield />}>
                            <AccessLogPanel event={lastNfcEvent} />
                        </Card>

                        {/* ===== SYSTEM ALERTS ===== */}
                        <Card title="System Alerts" icon={<AlertTriangle />}>
                            <AlertPanel
                                vibration={vibrationActive}
                                gas={data.sensors.gas}
                            />
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
