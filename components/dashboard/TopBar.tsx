"use client";

import React, { useState, useEffect } from "react";
import { StatusBadge } from "../ui/StatusBadge";
import { formatTimestampIST } from "@/lib/formatting";
import { Radio, Presentation } from "lucide-react";

interface TopBarProps {
  isConnected: boolean;
  isPresentationMode: boolean;
  onTogglePresentation: () => void;

  onlineSensors?: number;
  totalSensors?: number;
  survivorProbability?: number;
  activeSession?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  isConnected,
  isPresentationMode,
  onTogglePresentation,
  onlineSensors = 0,
  totalSensors = 3,
  survivorProbability = 0,
  activeSession = false,
}) => {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const timer = setInterval(
      () => setTimeStr(formatTimestampIST(new Date().toISOString())),
      1000,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/90 px-4 flex items-center justify-between text-slate-100 font-mono z-20">
      <div className="flex items-center gap-3">
        <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
        <div>
          <h1 className="text-sm font-bold tracking-wider text-slate-100">
            RESQSENSE
          </h1>
          <p className="text-[9px] text-slate-400 tracking-tight">
            REAL-TIME WI-FI CSI SURVIVOR DETECTION
          </p>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-3">
  <div className="px-3 py-1 rounded-lg bg-slate-900 border border-cyan-900">
    <div className="text-cyan-400 text-lg font-bold">
      {onlineSensors}/{totalSensors}
    </div>
    <div className="text-[10px] text-slate-400 uppercase">
      Sensors
    </div>
  </div>

  <div className="px-3 py-1 rounded-lg bg-slate-900 border border-emerald-900">
    <div className="text-emerald-400 text-lg font-bold">
      {activeSession ? "LIVE" : "IDLE"}
    </div>
    <div className="text-[10px] text-slate-400 uppercase">
      Session
    </div>
  </div>

  <div className="px-3 py-1 rounded-lg bg-slate-900 border border-red-900">
    <div className="text-red-400 text-lg font-bold">
      {Math.round(survivorProbability)}%
    </div>
    <div className="text-[10px] text-slate-400 uppercase">
      Survivor
    </div>
  </div>

  <div className="px-3 py-1 rounded-lg bg-slate-900 border border-cyan-900">
    <div className="text-cyan-400 text-lg font-bold">
      {isConnected ? "LIVE" : "OFF"}
    </div>
    <div className="text-[10px] text-slate-400 uppercase">
      CSI Feed
    </div>
  </div>
</div>

      <div className="flex items-center gap-4 text-xs">
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-slate-500">WS:</span>
          <span className={isConnected ? "text-emerald-400" : "text-amber-500"}>
            {isConnected ? "CONNECTED" : "DEMO MODE"}
          </span>
        </div>
        <div className="text-slate-400 font-mono w-16 text-right">
          {timeStr}
        </div>

        <button
          onClick={onTogglePresentation}
          className={`px-2.5 py-1 rounded border text-xs flex items-center gap-1.5 transition-all ${
            isPresentationMode
              ? "bg-cyan-950 text-cyan-300 border-cyan-500"
              : "bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200"
          }`}
        >
          <Presentation className="w-3.5 h-3.5" />
          <span>{isPresentationMode ? "EXIT" : "PRESENT"}</span>
        </button>
      </div>
    </header>
  );
};
