"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  MapPin,
  Radio,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// ========================================
// TYPES
// ========================================

type Device = {
  id: string;
  device_id: string;
  name: string;
  status: "ONLINE" | "OFFLINE" | string;
  ip_address: string | null;
  location_x: number | null;
  location_y: number | null;
  location_z: number | null;
  last_seen: string | null;
  created_at: string;
};

type Telemetry = {
  deviceId: string;
  sessionId: string;
  telemetryId?: string;
  timestamp: string;
  rssi?: number;
  analysis?: {
    movementScore: number;
    presenceScore: number;
    survivorProbability: number;
    reason: string;
  };
};

type Detection = {
  deviceId: string;
  sessionId: string;
  detection: {
    id: string;
    timestamp: string;
    zone: string | null;
    type: string;
    presence_score: number | null;
    movement_score: number | null;
    survivor_probability: number | null;
    status: string;
  };
  analysis: {
    movementScore: number;
    presenceScore: number;
    survivorProbability: number;
    reason: string;
  };
  timestamp: string;
};

type WsMessage = {
  type: string;
  [key: string]: unknown;
};

// ========================================
// MAIN DASHBOARD COMPONENT
// ========================================

export default function Home() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [telemetry, setTelemetry] = useState<Record<string, Telemetry>>({});
  const [detections, setDetections] = useState<Detection[]>([]);
  const [wsStatus, setWsStatus] = useState<
    "CONNECTING" | "CONNECTED" | "DISCONNECTED"
  >("CONNECTING");

  const [lastEvent, setLastEvent] = useState<string | null>(null);

  // ----------------------------------------
  // LOAD INITIAL DEVICES
  // ----------------------------------------

  useEffect(() => {
    async function loadDevices() {
      try {
        const response = await fetch("/api/devices");

        if (!response.ok) {
          throw new Error("Failed to load devices");
        }

        const data = await response.json();

        if (data.success) {
          setDevices(data.devices ?? []);
        }
      } catch (error) {
        console.error("Failed to load devices:", error);
      }
    }

    loadDevices();
  }, []);

  // ----------------------------------------
  // WEBSOCKET CONNECTION
  // ----------------------------------------

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3001");

    ws.onopen = () => {
      console.log("Dashboard WebSocket connected");
      setWsStatus("CONNECTED");
    };

    ws.onmessage = (event) => {
      try {
        const message: WsMessage = JSON.parse(event.data);
        console.log("Dashboard received:", message);
        setLastEvent(message.type);

        if (message.type === "heartbeat_ack") {
          const deviceId = message.deviceId as string;
          const status = message.status as string;
          const lastSeen = message.lastSeen as string;

          setDevices((current) =>
            current.map((device) =>
              device.device_id === deviceId
                ? { ...device, status, last_seen: lastSeen }
                : device,
            ),
          );
          return;
        }

        if (message.type === "telemetry_ack") {
          const deviceId = message.deviceId as string;

          setTelemetry((current) => ({
            ...current,
            [deviceId]: {
              deviceId,
              sessionId: message.sessionId as string,
              telemetryId: message.telemetryId as string,
              timestamp: message.timestamp as string,
              analysis: message.analysis as Telemetry["analysis"],
            },
          }));
          return;
        }

        if (message.type === "device_offline") {
          const deviceId = message.deviceId as string;
          const lastSeen = message.lastSeen as string;

          setDevices((current) =>
            current.map((device) =>
              device.device_id === deviceId
                ? { ...device, status: "OFFLINE", last_seen: lastSeen }
                : device,
            ),
          );
          return;
        }

        if (message.type === "detection") {
          const detection = message as unknown as Detection;

          setDetections((current) => [detection, ...current].slice(0, 20));
          return;
        }
      } catch (error) {
        console.error("Invalid WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("Dashboard WebSocket error:", error);
      setWsStatus("DISCONNECTED");
    };

    ws.onclose = () => {
      console.log("Dashboard WebSocket disconnected");
      setWsStatus("DISCONNECTED");
    };

    return () => {
      ws.close();
    };
  }, []);

  // ----------------------------------------
  // STATS MEMOIZATION
  // ----------------------------------------

  const onlineDevices = useMemo(
    () => devices.filter((d) => d.status === "ONLINE").length,
    [devices],
  );

  const offlineDevices = useMemo(
    () => devices.filter((d) => d.status === "OFFLINE").length,
    [devices],
  );

  const possibleSurvivors = useMemo(
    () =>
      detections.filter((d) => d.detection.type === "POSSIBLE_SURVIVOR").length,
    [detections],
  );

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none tracking-tight">
                CSI Rescue Dashboard
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Real-time disaster survivor detection
              </p>
            </div>
          </div>

          <Badge
            variant={
              wsStatus === "CONNECTED"
                ? "default"
                : wsStatus === "CONNECTING"
                  ? "outline"
                  : "destructive"
            }
            className="flex items-center gap-1.5 py-1 px-3"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                wsStatus === "CONNECTED"
                  ? "bg-emerald-500 animate-pulse"
                  : wsStatus === "CONNECTING"
                    ? "bg-amber-500"
                    : "bg-destructive-foreground"
              }`}
            />
            <span>WebSocket: {wsStatus}</span>
          </Badge>
        </div>
      </header>

      <main className="container space-y-8 px-4 py-8 sm:px-8">
        {/* METRIC OVERVIEW */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Devices"
            value={devices.length}
            icon={Cpu}
            description="Registered sensors"
          />
          <StatCard
            title="Online Devices"
            value={onlineDevices}
            icon={Wifi}
            variant="success"
            description="Active streaming"
          />
          <StatCard
            title="Offline Devices"
            value={offlineDevices}
            icon={WifiOff}
            variant="danger"
            description="Unreachable"
          />
          <StatCard
            title="Possible Survivors"
            value={possibleSurvivors}
            icon={AlertTriangle}
            variant={possibleSurvivors > 0 ? "warning" : "default"}
            description="Detections logged"
          />
        </section>

        {/* RESCUE SENSORS */}
        <section className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Rescue Sensors
              </h2>
              <p className="text-sm text-muted-foreground">
                Live status and telemetry for deployed ESP32 hardware
              </p>
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              Last event:{" "}
              <span className="text-foreground font-semibold">
                {lastEvent ?? "waiting..."}
              </span>
            </div>
          </div>

          {devices.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
              <Cpu className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm font-medium text-muted-foreground">
                No rescue sensors registered yet.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {devices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  telemetry={telemetry[device.device_id]}
                />
              ))}
            </div>
          )}
        </section>

        {/* DETECTION EVENTS */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Detection Events
            </h2>
            <p className="text-sm text-muted-foreground">
              Real-time CSI analysis results feed
            </p>
          </div>

          {detections.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
              <Activity className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm font-medium text-muted-foreground">
                No detection events logged yet.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {detections.map((item, index) => (
                <DetectionCard
                  key={item.detection.id ?? `${item.timestamp}-${index}`}
                  detection={item}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// ========================================
// STAT CARD COMPONENT
// ========================================

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  variant = "default",
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  description?: string;
  variant?: "default" | "success" | "danger" | "warning";
}) {
  const valueColors = {
    default: "text-foreground",
    success: "text-emerald-500",
    danger: "text-rose-500",
    warning: "text-amber-500",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueColors[variant]}`}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ========================================
// DEVICE CARD COMPONENT
// ========================================

function DeviceCard({
  device,
  telemetry,
}: {
  device: Device;
  telemetry?: Telemetry;
}) {
  const online = device.status === "ONLINE";
  const analysis = telemetry?.analysis;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">
              {device.name}
            </CardTitle>
            <CardDescription className="font-mono text-xs">
              {device.device_id}
            </CardDescription>
          </div>
          <Badge variant={online ? "default" : "destructive"}>
            <span
              className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                online ? "bg-emerald-400" : "bg-rose-400"
              }`}
            />
            {device.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Spatial Coordinates */}
        <div className="rounded-lg bg-muted/50 p-2.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <MapPin className="h-3.5 w-3.5" />
            <span>Position (X, Y, Z)</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <LocationValue label="X" value={device.location_x} />
            <LocationValue label="Y" value={device.location_y} />
            <LocationValue label="Z" value={device.location_z} />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Last seen</span>
          <span className="font-medium text-foreground">
            {device.last_seen
              ? new Date(device.last_seen).toLocaleTimeString()
              : "Never"}
          </span>
        </div>

        {/* Live CSI Analysis */}
        {analysis && (
          <>
            <Separator />
            <div className="space-y-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Latest CSI Analysis
              </span>
              <div className="grid grid-cols-3 gap-2">
                <Metric label="Presence" value={analysis.presenceScore} />
                <Metric label="Movement" value={analysis.movementScore} />
                <Metric label="Survivor" value={analysis.survivorProbability} />
              </div>
              <p className="text-xs text-muted-foreground italic leading-relaxed">
                "{analysis.reason}"
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ========================================
// HELPER COMPONENTS
// ========================================

function LocationValue({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="rounded bg-background p-1.5 border border-border/50">
      <p className="text-[10px] text-muted-foreground font-mono">{label}</p>
      <p className="text-xs font-semibold font-mono mt-0.5">{value ?? "—"}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/60 p-2 text-center">
      <p className="text-[10px] font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p className="text-xs font-semibold tracking-tight mt-0.5">
        {(value * 100).toFixed(1)}%
      </p>
    </div>
  );
}

// ========================================
// DETECTION CARD COMPONENT
// ========================================

function DetectionCard({ detection }: { detection: Detection }) {
  const survivor = detection.analysis.survivorProbability >= 0.5;

  return (
    <Card
      className={`transition-colors ${
        survivor ? "border-destructive/50 bg-destructive/5" : ""
      }`}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={survivor ? "destructive" : "secondary"}>
                {survivor && <AlertTriangle className="mr-1 h-3 w-3" />}
                {detection.detection.type}
              </Badge>
              <span className="font-mono text-xs text-muted-foreground">
                {detection.deviceId}
              </span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {detection.analysis.reason}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:w-auto min-w-60">
            <Metric label="Presence" value={detection.analysis.presenceScore} />
            <Metric label="Movement" value={detection.analysis.movementScore} />
            <Metric
              label="Survivor"
              value={detection.analysis.survivorProbability}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between pt-2 border-t text-[11px] text-muted-foreground">
          <span>Session: {detection.sessionId}</span>
          <time>{new Date(detection.timestamp).toLocaleString()}</time>
        </div>
      </CardContent>
    </Card>
  );
}
