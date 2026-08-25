"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TopBar } from "./TopBar";
import { Sidebar, TabType } from "./Sidebar";
import { DetectionPanel } from "./DetectionPanel";
import { RescueScene } from "../scene/RescueScene";
import { TelemetryChart } from "../charts/TelemetryChart";
import { StatusBadge } from "../ui/StatusBadge";
import { GlassPanel } from "../ui/GlassPanel";
import { useRescueWebSocket } from "@/app/hooks/useRescueWebSocket";
import { fetchDevices } from "@/lib/api";
import { Device } from "@/app/types/device";
import { Detection } from "@/app/types/detection";
import { TelemetryData } from "@/app/types/telemetry";
import { WSIncomingMessage } from "@/app/types/websocket";
import { formatTimestamp } from "@/lib/formatting";
import { Cpu, ShieldAlert, Activity } from "lucide-react";

export const RescueDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("scene");
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [activeDetection, setActiveDetection] = useState<Detection | null>(
    null,
  );
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<
    Array<{ time: string; movement: number; presence: number }>
  >([]);
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  // 1. Fetch initial device list from backend API
  useEffect(() => {
    fetchDevices()
      .then((data) => setDevices(data))
      .catch((err) => console.error("Failed to load devices from API:", err));
  }, []);

  // 2. Process incoming WebSocket messages in real-time
  const handleWSMessage = useCallback((msg: WSIncomingMessage) => {
    const timestampStr = formatTimestamp(new Date().toISOString());

    switch (msg.type) {
      case "heartbeat_ack":
        setDevices((prev) =>
          prev.map((dev) =>
            dev.device_id === msg.deviceId
              ? { ...dev, status: msg.status, last_seen: msg.timestamp }
              : dev,
          ),
        );
        break;

      case "telemetry_ack":
        setTelemetry({
          deviceId: msg.deviceId,
          timestamp: msg.timestamp,
          meanAmplitude: msg.analysis.movementScore * 20,
          frameDifference: msg.analysis.presenceScore,
          rollingVariation: msg.analysis.survivorProbability,
        });

        setTelemetryHistory((prev) => [
          ...prev.slice(-19),
          {
            time: timestampStr,
            movement: msg.analysis.movementScore,
            presence: msg.analysis.presenceScore,
          },
        ]);
        break;

      case "detection":
        setActiveDetection(msg.detection);
        break;

      case "device_offline":
        setDevices((prev) =>
          prev.map((dev) =>
            dev.device_id === msg.deviceId
              ? { ...dev, status: "OFFLINE" }
              : dev,
          ),
        );
        break;

      default:
        break;
    }
  }, []);

  // 3. Attach WebSocket hook
  const { isConnected } = useRescueWebSocket({
    url: "ws://localhost:3001",
    onMessage: handleWSMessage,
  });

  const onlineSensorsCount = devices.filter(
    (d) => d.status === "ONLINE",
  ).length;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none font-mono">
      <TopBar
        isConnected={isConnected}
        isPresentationMode={isPresentationMode}
        onTogglePresentation={() => setIsPresentationMode(!isPresentationMode)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          onlineSensorsCount={onlineSensorsCount}
          totalSensorsCount={devices.length}
          isConnected={isConnected}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />

        {/* Dynamic Main Section switching based on activeTab */}
        <main className="flex-1 relative border-r border-slate-800 overflow-y-auto bg-slate-950">
          {activeTab === "scene" && (
            <div className="w-full h-full relative">
              <RescueScene
                devices={devices}
                selectedDevice={selectedDevice}
                onSelectDevice={setSelectedDevice}
                activeDetection={activeDetection}
                latestActivity={telemetry?.rollingVariation ?? 0}
              />

              {/* Bottom Overlay Chart */}
              <div className="absolute bottom-4 left-4 right-4 z-10 bg-slate-950/80 backdrop-blur-md border border-slate-800 p-3 rounded-lg">
                <div className="text-[10px] font-mono text-slate-400 mb-1 flex justify-between">
                  <span>LIVE SIGNAL STABILITY & MOVEMENT TRENDS</span>
                  <span className="text-cyan-400">
                    {telemetryHistory.length > 0
                      ? "LIVE DATA FEED"
                      : "WAITING FOR TRANSMISSION..."}
                  </span>
                </div>
                <TelemetryChart data={telemetryHistory} />
              </div>
            </div>
          )}

          {activeTab === "devices" && (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-slate-100">
                  DEPLOYED SENSOR NODES
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {devices.length === 0 ? (
                  <p className="text-slate-500 text-sm">
                    No sensors registered.
                  </p>
                ) : (
                  devices.map((dev) => (
                    <GlassPanel key={dev.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-cyan-300">
                          {dev.name || dev.device_id}
                        </span>
                        <StatusBadge status={dev.status} />
                      </div>
                      <div className="text-xs text-slate-400 space-y-1">
                        <div>
                          ID:{" "}
                          <span className="text-slate-200">
                            {dev.device_id}
                          </span>
                        </div>
                        <div>
                          Coordinates: X: {dev.location_x ?? 0}, Y:{" "}
                          {dev.location_y ?? 0}, Z: {dev.location_z ?? 0}
                        </div>
                        <div>
                          Last Active:{" "}
                          <span className="text-slate-300">
                            {formatTimestamp(dev.last_seen)}
                          </span>
                        </div>
                      </div>
                    </GlassPanel>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "detections" && (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h2 className="text-lg font-bold text-slate-100">
                  DETECTION & SURVIVOR LOGS
                </h2>
              </div>
              {activeDetection ? (
                <GlassPanel
                  glowColor={
                    activeDetection.survivor_probability > 0.5 ? "red" : "none"
                  }
                  className="space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-red-400">ACTIVE ALERT</span>
                    <span className="text-xs text-slate-400">
                      {formatTimestamp(activeDetection.timestamp)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <div className="text-slate-500">PROBABILITY</div>
                      <div className="text-xl text-red-400 font-bold">
                        {Math.round(activeDetection.survivor_probability * 100)}
                        %
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">MOVEMENT</div>
                      <div className="text-xl text-cyan-400 font-bold">
                        {Math.round(activeDetection.movement_score * 100)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">PRESENCE</div>
                      <div className="text-xl text-emerald-400 font-bold">
                        {Math.round(activeDetection.presence_score * 100)}%
                      </div>
                    </div>
                  </div>
                </GlassPanel>
              ) : (
                <p className="text-slate-500 text-sm">
                  No recent survivor alerts logged.
                </p>
              )}
            </div>
          )}

          {activeTab === "telemetry" && (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-slate-100">
                  SIGNAL & TELEMETRY ANALYTICS
                </h2>
              </div>
              <GlassPanel className="p-4 space-y-3">
                <div className="text-xs text-slate-400">
                  HISTORICAL SIGNAL STABILITY
                </div>
                <div className="h-64">
                  <TelemetryChart data={telemetryHistory} />
                </div>
              </GlassPanel>
            </div>
          )}
        </main>

        <DetectionPanel detection={activeDetection} telemetry={telemetry} />
      </div>
    </div>
  );
};
