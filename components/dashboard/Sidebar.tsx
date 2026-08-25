"use client";

import React from "react";
import { GlassPanel } from "../ui/GlassPanel";
import { StatusBadge } from "../ui/StatusBadge";
import { Activity, Cpu, ShieldAlert, Radio, Database } from "lucide-react";

export type TabType = "scene" | "devices" | "detections" | "telemetry";

interface SidebarProps {
  onlineSensorsCount: number;
  totalSensorsCount: number;
  isConnected: boolean;
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onlineSensorsCount,
  totalSensorsCount,
  isConnected,
  activeTab,
  onSelectTab,
}) => {
  const navItems: { id: TabType; name: string; icon: React.ElementType }[] = [
    { id: "scene", name: "Live 3D Scene", icon: Radio },
    { id: "devices", name: "Devices", icon: Cpu },
    { id: "detections", name: "Detections", icon: ShieldAlert },
    { id: "telemetry", name: "Telemetry", icon: Activity },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/95 p-3 flex flex-col gap-4 font-mono text-xs z-10 overflow-y-auto shrink-0">
      <div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
          MISSION CONTROL
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded transition-all text-left ${
                  isActive
                    ? "bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-bold shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent"
                }`}
              >
                <StatusBadge status={isConnected ? "ONLINE" : "OFFLINE"} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <GlassPanel className="space-y-2">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          ACTIVE SESSION
        </div>
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-500">Mission:</span>
            <span className="text-slate-200 font-semibold">Op. Phoenix</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Area:</span>
            <span className="text-slate-300">Collapse Zone A</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Duration:</span>
            <span className="text-cyan-400">01:24:16</span>
          </div>
        </div>
      </GlassPanel>

      <GlassPanel className="space-y-2">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          SYSTEM STATUS
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-cyan-400" /> WS
            </span>
            {/* Added 'as const' to resolve the TypeScript error */}
            <StatusBadge
              status={isConnected ? ("ONLINE" as const) : ("OFFLINE" as const)}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Database className="w-3 h-3 text-cyan-400" /> Database
            </span>
            <StatusBadge status="ONLINE" text="CONNECTED" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-cyan-400" /> Sensors
            </span>
            <span className="text-slate-300 font-mono">
              {onlineSensorsCount} / {totalSensorsCount} ONLINE
            </span>
          </div>
        </div>
      </GlassPanel>
    </aside>
  );
};
