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
  import { formatTimestampIST } from "@/lib/formatting";
  import { Cpu, ShieldAlert, Activity } from "lucide-react";
  import { type Session } from "@/app/types/session";
  import { createClient } from "@supabase/supabase-js";

  // Initialize Supabase Client for Realtime Subscriptions
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Telemetry Normalization Helper (Ensures values strictly match Recharts [0, 1] domain)
  const normalizeValue = (
    val: number | null | undefined,
    min: number = 0,
    max: number = 100,
  ): number => {
    if (val == null || Number.isNaN(val)) return 0;
    return Math.min(1, Math.max(0, (val - min) / (max - min)));
  };

  export const RescueDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>("scene");
    const [devices, setDevices] = useState<Device[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [activeDetection, setActiveDetection] = useState<Detection | null>(
      null,
    );
    const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);

    // Normalized telemetry window for Recharts consumption
    const [telemetryHistory, setTelemetryHistory] = useState<
      Array<{ time: string; movement: number; presence: number }>
    >([]);
    const [graphMovement, setGraphMovement] = useState(15);
const [graphPresence, setGraphPresence] = useState(20);

    const [isPresentationMode, setIsPresentationMode] = useState(false);
    const [session, setSession] = useState<Session | null>(null);
    const [availableSessions, setAvailableSessions] = useState<Session[]>([]);
    const [demoMode, setDemoMode] = useState(false);
    const [demoRunning, setDemoRunning] = useState(false);
const [humanDetected, setHumanDetected] = useState(false);

    // 1. Initial Device Fetch
    useEffect(() => {
      fetchDevices()
        .then((data) => setDevices(data))
        .catch((err) => console.error("Failed to load devices from API:", err));
    }, []);

    // 2. Fetch Sessions List
    const fetchSessions = async () => {
      try {
        const res = await fetch("/api/sessions");
        const data = await res.json();
        if (res.ok) setAvailableSessions(data.sessions ?? []);
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
      }
    };

    useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchSessions();
    }, []);

  // 3. Load Session Data Pattern

  // 3. Load live data for the selected active session
  useEffect(() => {
    if (!session?.id) return;

    let mounted = true;

    const loadSessionData = async () => {
      try {
        // This route already exists and returns devices, telemetry, and detections.
        const overviewRes = await fetch(
          `/api/sessions/${session.id}/overview`,
          { cache: "no-store" },
        );

        if (!overviewRes.ok) {
          throw new Error(
            `Session overview request failed: ${overviewRes.status}`,
          );
        }

        const overview = await overviewRes.json();

        if (!mounted) return;

        const telemetryRows = overview.telemetry ?? [];
        const detectionRows = overview.detections ?? [];

        // Gets ONLINE/OFFLINE status and database coordinates from public.devices.
        if (!demoRunning) {
  setDevices(overview.devices ?? []);
} else {
  setDevices([
  {
    id: "ESP32-01",
    device_id: "ESP32-01",
    name: "North Sensor",
    status: "ONLINE",
    location_x: 5,
    location_y: 0,
    location_z: 0,
    last_seen: null,
  },
  {
    id: "ESP32-02",
    device_id: "ESP32-02",
    name: "East Sensor",
    status: "ONLINE",
    location_x: -5,
    location_y: -5,
    location_z: 0,
    last_seen: null,
  },
  {
    id: "ESP32-03",
    device_id: "ESP32-03",
    name: "South Sensor",
    status: "ONLINE",
    location_x: -5,
    location_y: 5,
    location_z: 0,
    last_seen: null,
  },
]);
}

        if (telemetryRows.length > 0) {
          const latest = telemetryRows[telemetryRows.length - 1];

          setTelemetry({
            id: latest.id,
            session_id: latest.session_id,
            deviceId: latest.device_id,
            timestamp: latest.timestamp,
            rssi: latest.rssi,
            meanAmplitude: latest.mean_amplitude,
            amplitudeStd: latest.amplitude_std,
            rmsAmplitude: latest.rms_amplitude,
            frameDifference: latest.frame_difference,
            rollingVariation: latest.rolling_variation,
          });
        }

        if (!demoMode && !humanDetected) {
  setActiveDetection(
    detectionRows.length > 0 ? detectionRows[0] : null
  );
}

        setTelemetryHistory(
          telemetryRows.slice(-60).map((item: any) => ({
            time: new Date(item.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            movement: normalizeValue(item.frame_difference, 0, 100),
            presence: normalizeValue(item.mean_amplitude, 0, 100),
          })),
        );
      } catch (error) {
        console.error("Failed to load live session overview:", error);
      }
    };

    loadSessionData();

    // Pull fresh Supabase-backed values every 3 seconds.
    const refreshTimer = window.setInterval(loadSessionData, 3000);
      return () => {
        mounted = false;
        window.clearInterval(refreshTimer);
      };
    }, [session?.id, demoRunning, humanDetected]);

    // Session Control Handlers
    const handleCreateSession = async (name: string, area?: string) => {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, area }),
      });
      const data = await res.json();
      if (res.ok) {
        setSession(data.session);
        await fetchSessions();
      }
    };

    const handleStartSession = async () => {
      if (!session) return;
      const res = await fetch(`/api/sessions/${session.id}/start`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {

  setSession(data.session);

  setDemoRunning(true);

setDevices(prev =>
  prev.map(device => ({
    ...device,
    status: "OFFLINE",
  }))
);

setTimeout(() => {
  setDevices(prev => {
    const copy = [...prev];
    if (copy[0]) copy[0].status = "ONLINE";
    return [...copy];
  });
}, 1000);

setTimeout(() => {
  setDevices(prev => {
    const copy = [...prev];
    if (copy[1]) copy[1].status = "ONLINE";
    return [...copy];
  });
}, 2000);

setTimeout(() => {
  setDevices(prev => {
    const copy = [...prev];
    if (copy[2]) copy[2].status = "ONLINE";
    return [...copy];
  });
}, 3000);

}
    };

    const handleStopSession = async () => {
      if (!session) return;
      const res = await fetch(`/api/sessions/${session.id}/stop`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) setSession(data.session);
      setDemoRunning(false);
setHumanDetected(false);
setActiveDetection(null);
    };

    const handleSelectSession = (sessionId: string) => {
      const selected = availableSessions.find((s) => s.id === sessionId);
      if (selected) setSession(selected);
    };

    // 4. WebSocket Fallback processing
    const handleWSMessage = useCallback(
      (msg: WSIncomingMessage) => {
        switch (msg.type) {
          case "heartbeat_ack":
            setDevices((prev) =>
              prev.map((dev) =>
                dev.device_id === msg.deviceId
                  ? {
                      ...dev,
                      status: msg.status || "ONLINE",
                      last_seen: msg.timestamp || new Date().toISOString(),
                    }
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

            // Fallback realtime update when no session id is actively bound
            if (!session?.id) {
              setTelemetryHistory((prev) => [
                ...prev.slice(-59),
                {
                  time: formatTimestampIST(
                    msg.timestamp || new Date().toISOString(),
                  ),
                  movement: normalizeValue(msg.analysis.movementScore, 0, 1),
                  presence: normalizeValue(msg.analysis.presenceScore, 0, 1),
                },
              ]);
            }

            setDevices((prev) =>
              prev.map((dev) =>
                dev.device_id === msg.deviceId
                  ? {
                      ...dev,
                      status: "ONLINE",
                      last_seen: msg.timestamp || new Date().toISOString(),
                    }
                  : dev,
              ),
            );
            break;

          case "detection":
  if (!demoMode) {
    setActiveDetection(msg.detection);
  }
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
      },
      [session?.id],
    );

    const { isConnected } = useRescueWebSocket({
      url:
        process.env.NEXT_PUBLIC_WS_URL ||
        "wss://wifi-csi-shi-websocket.onrender.com",
      onMessage: handleWSMessage,
    });
    useEffect(() => {
  const handleDemoKeys = (e: KeyboardEvent) => {

    // H = Human detected
    if (e.key.toLowerCase() === "h") {

  setDemoMode(true);
  setHumanDetected(true);

  setActiveDetection({
    id: "demo-detection",
    session_id: "demo-session",
    timestamp: new Date().toISOString(),
    zone: "COLLAPSE-ZONE-A",
    type: "POSSIBLE_SURVIVOR",
    presence_score: 0.94,
    movement_score: 0.89,
    survivor_probability: 0.97,
    status: "VERIFIED",
    contributing_devices: [
      "ESP32-01",
      "ESP32-02",
      "ESP32-03",
    ],
    reason: "Manual Demo Trigger",
  });

  console.log("DEMO SURVIVOR DETECTED");
}

    // N = No survivor
    if (e.key.toLowerCase() === "n") {

  setHumanDetected(false);
  setActiveDetection(null);

  console.log("DEMO DETECTION CLEARED");
}

    // M = Exit demo mode
    if (e.key.toLowerCase() === "m") {

      setDemoMode(false);

    }
  };

  window.addEventListener("keydown", handleDemoKeys);

  return () => {
    window.removeEventListener("keydown", handleDemoKeys);
  };
}, []);
useEffect(() => {

  if (!demoRunning) return;

  const interval = setInterval(() => {

    const movement = humanDetected
      ? 80 + Math.random() * 15
      : 10 + Math.random() * 10;

    const presence = humanDetected
      ? 85 + Math.random() * 10
      : 15 + Math.random() * 10;

      setGraphMovement(movement);
setGraphPresence(presence);

    const rssi = Number(
  (
    humanDetected
      ? -48 + Math.random() * 4
      : -63 + Math.random() * 5
  ).toFixed(2)
);

const meanAmp = Number(presence.toFixed(2));
const frameDiff = Number(movement.toFixed(2));
const rollVar = Number(presence.toFixed(2));

setTelemetry({
  deviceId: "ESP32-01",
  timestamp: new Date().toISOString(),
  rssi,
  meanAmplitude: meanAmp,
  frameDifference: frameDiff,
  rollingVariation: rollVar,
} as any);

    setTelemetryHistory(prev => [
  ...prev.slice(-59),
  {
    time: new Date().toLocaleTimeString(),
    movement: movement,
    presence: presence,
  },
]);

  }, 1000);

  return () => clearInterval(interval);

}, [demoRunning, humanDetected]);
useEffect(() => {

  if (!demoRunning) return;

  const graphInterval = setInterval(() => {

    setTelemetryHistory(prev => [

      ...prev.slice(-59),

      {
        time: new Date().toLocaleTimeString(),

        movement:
          graphMovement + (Math.random() * 1 - 0.5),

        presence:
          graphPresence + (Math.random() * 1 - 0.5),
      },

    ]);

  }, 500);

  return () => clearInterval(graphInterval);

}, [demoRunning, graphMovement, graphPresence]);

    const onlineSensorsCount = devices.filter(
      (d) => d.status === "ONLINE",
    ).length;
    const totalSensorsCount = devices.length;

    return (
      <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none font-mono">
        <TopBar
  isConnected={demoRunning || isConnected}
  isPresentationMode={isPresentationMode}
  onTogglePresentation={() =>
    setIsPresentationMode(!isPresentationMode)
  }
  onlineSensors={
    demoRunning
      ? 3
      : devices.filter(
          (d) => d.status === "ONLINE",
        ).length
  }
  totalSensors={3}
  survivorProbability={
    activeDetection
      ? Math.round(
          activeDetection.survivor_probability * 100,
        )
      : 0
  }
  activeSession={
  demoRunning ||
  session?.status === "ACTIVE"
}
/>

        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar
            onlineSensorsCount={onlineSensorsCount}
            totalSensorsCount={totalSensorsCount}
            isConnected={isConnected}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            session={session}
            availableSessions={availableSessions}
            onSelectSession={handleSelectSession}
            onCreateSession={handleCreateSession}
            onStartSession={handleStartSession}
            onStopSession={handleStopSession}
          />

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

                <div className="absolute bottom-4 left-4 right-4 z-10 bg-slate-950/80 backdrop-blur-md border border-slate-800 p-3 rounded-lg">
                  <div className="text-[10px] font-mono text-slate-400 mb-1 flex justify-between">
                    <span>LIVE SIGNAL STABILITY & MOVEMENT TRENDS</span>
                    <span className="text-cyan-400">
                      {telemetryHistory.length > 0
                        ? `LIVE FEED (${telemetryHistory.length} SAMPLES)`
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
                              {dev.last_seen
                                ? formatTimestampIST(dev.last_seen)
                                : "N/A"}
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
                        {formatTimestampIST(activeDetection.timestamp)}
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
