"use client";

import React from "react";
import { GlassPanel } from "../ui/GlassPanel";
import { MetricCard } from "../ui/MetricCard";
import { Detection } from "@/app/types/detection";
import { TelemetryData } from "@/app/types/telemetry";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface DetectionPanelProps {
  detection: Detection | null;
  telemetry: TelemetryData | null;
}

export const DetectionPanel: React.FC<DetectionPanelProps> = ({
  detection,
  telemetry,
}) => {
  const isSurvivor = Boolean(detection && detection.survivor_probability > 0.5);
  const hasTelemetry = Boolean(telemetry);

const isInvestigating =
  !isSurvivor &&
  hasTelemetry &&
  (telemetry?.frameDifference ?? 0) > 0.15;

  return (
    <aside className="w-80 border-l border-slate-800 bg-slate-950/95 p-4 flex flex-col h-full gap-4 font-mono z-10 overflow-y-auto">
      {/* Live Survivor Alert Banner */}
      <GlassPanel
        glowColor={isSurvivor ? "red" : "none"}
        className="flex-1 border border-white rounded-lg shadow-lg shadow-white/20 p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            LIVE DETECTION
          </span>
          {isSurvivor ? (
  <AlertTriangle className="w-4 h-4 text-red-500 animate-bounce" />
) : isInvestigating ? (
  <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
) : (
  <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
)}
        </div>

        {isSurvivor && detection ? (
  <div className="space-y-4">
    <div className="text-center">
      <div className="text-red-400 text-4xl font-bold">
        {Math.round(detection.survivor_probability * 100)}%
      </div>

      <div className="text-red-300 text-xs uppercase tracking-widest">
        Survivor Probability
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2">
      <MetricCard
        label="Movement"
        value={Math.round(detection.movement_score * 100)}
        unit="%"
        alert
      />

      <MetricCard
        label="Confidence"
        value={Math.round(detection.survivor_probability * 100)}
        unit="%"
        alert
      />
    </div>

    <div className="text-center text-red-400 font-bold animate-pulse">
      POSSIBLE SURVIVOR DETECTED
    </div>
  </div>
) : isInvestigating ? (
  <div className="space-y-4 text-center">
    <div className="w-20 h-20 rounded-full border-4 border-amber-400 mx-auto animate-pulse flex items-center justify-center">
      <span className="text-amber-300 text-xs">SCAN</span>
    </div>

    <div className="text-amber-400 font-bold">
      MOVEMENT DETECTED
    </div>

    <div className="text-slate-400 text-xs">
      Investigating signal anomaly...
    </div>
  </div>
) : (
  <div className="space-y-4 text-center">
    <div className="w-20 h-20 rounded-full border-4 border-cyan-400 mx-auto animate-pulse flex items-center justify-center">
      <span className="text-cyan-300 text-xs">CSI</span>
    </div>

    <div className="text-cyan-400 font-bold">
      SCANNING AREA
    </div>

    <div className="text-slate-500 text-xs">
      Awaiting telemetry stream...
    </div>
  </div>
)}
      </GlassPanel>

      {/* Real-Time Telemetry Data */}
      <GlassPanel className="flex-1 space-y-2 border border-white rounded-lg shadow-lg shadow-white/20 p-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <div className="flex items-center justify-between">
  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
    LIVE TELEMETRY
  </div>

  <div
    className={`w-2 h-2 rounded-full ${
      telemetry
        ? "bg-emerald-400 animate-pulse"
        : "bg-slate-600"
    }`}
  />
</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label="RSSI"
            value={telemetry?.rssi != null ? telemetry.rssi : "--"}
            unit="dBm"
          />
          <MetricCard
            label="Mean Amp"
            value={
              telemetry?.meanAmplitude != null
                ? telemetry.meanAmplitude.toFixed(1)
                : "--"
            }
          />
          <MetricCard
            label="Frame Diff"
            value={
              telemetry?.frameDifference != null
                ? telemetry.frameDifference.toFixed(3)
                : "--"
            }
          />
          <MetricCard
            label="Roll Var"
            value={
              telemetry?.rollingVariation != null
                ? telemetry.rollingVariation.toFixed(3)
                : "--"
            }
          />
        </div>
      </GlassPanel>
    </aside>
  );
};