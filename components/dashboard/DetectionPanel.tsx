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
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          )}
        </div>

        {isSurvivor && detection ? (
          <div className="space-y-3">
            <div className="text-red-400 font-bold text-sm">
              ⚠ POSSIBLE SURVIVOR DETECTED
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MetricCard
                label="Probability"
                value={Math.round(detection.survivor_probability * 100)}
                unit="%"
                alert
              />
              <MetricCard
                label="Movement"
                value={Math.round(detection.movement_score * 100)}
                unit="%"
                alert
              />
            </div>
            <div className="text-[10px] text-slate-300 space-y-1 border-t border-slate-800 pt-2">
              <div>
                Zone:{" "}
                <span className="text-slate-100">
                  {detection.zone || "Central Collapse"}
                </span>
              </div>
              <div>
                Status:{" "}
                <span className="text-amber-400">{detection.status}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-slate-500 text-xs py-2 text-center">
            NO ACTIVE SURVIVOR ALERT
          </div>
        )}
      </GlassPanel>

      {/* Real-Time Telemetry Data */}
      <GlassPanel className="flex-1 space-y-2 border border-white rounded-lg shadow-lg shadow-white/20 p-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          LIVE TELEMETRY
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