"use client";

import React, { useState, useEffect } from "react";
import { GlassPanel } from "../ui/GlassPanel";
import { StatusBadge } from "../ui/StatusBadge";
import {
  Activity,
  Cpu,
  ShieldAlert,
  Radio,
  Database,
  PlusCircle,
  Square,
  Play,
  FolderOpen,
} from "lucide-react";

export type TabType = "scene" | "devices" | "detections" | "telemetry";
export type SessionStatus = "CREATED" | "ACTIVE" | "COMPLETED";

export interface Session {
  id: string;
  name: string;
  area?: string | null;
  status: SessionStatus;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

interface SidebarProps {
  onlineSensorsCount: number;
  totalSensorsCount: number;
  isConnected: boolean;
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  session: Session | null;
  availableSessions?: Session[];
  onSelectSession?: (sessionId: string) => void;
  onCreateSession?: (name: string, area?: string) => Promise<void>;
  onStartSession?: () => Promise<void>;
  onStopSession?: () => Promise<void>;
}

const SessionDuration: React.FC<{ session: Session }> = ({ session }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (session.status !== "ACTIVE") return;

    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [session.status]);

  if (!session.started_at) {
    return <span className="text-slate-500">--:--:--</span>;
  }

  const start = new Date(session.started_at).getTime();
  const end =
    session.status === "COMPLETED" && session.ended_at
      ? new Date(session.ended_at).getTime()
      : now;

  const seconds = Math.max(0, Math.floor((end - start) / 1000));
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const formatted = [
    hrs.toString().padStart(2, "0"),
    mins.toString().padStart(2, "0"),
    secs.toString().padStart(2, "0"),
  ].join(":");

  return <span className="text-cyan-400 font-bold">{formatted}</span>;
};

export const Sidebar: React.FC<SidebarProps> = ({
  onlineSensorsCount,
  totalSensorsCount,
  isConnected,
  activeTab,
  onSelectTab,
  session,
  availableSessions = [],
  onSelectSession,
  onCreateSession,
  onStartSession,
  onStopSession,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [sessionArea, setSessionArea] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName.trim() || !onCreateSession) return;

    try {
      setIsSubmitting(true);
      await onCreateSession(
        sessionName.trim(),
        sessionArea.trim() || undefined,
      );
      setSessionName("");
      setSessionArea("");
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Failed to create session:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const navItems: { id: TabType; name: string; icon: React.ElementType }[] = [
    { id: "scene", name: "Live 3D Scene", icon: Radio },
    { id: "devices", name: "Devices", icon: Cpu },
    { id: "detections", name: "Detections", icon: ShieldAlert },
    { id: "telemetry", name: "Telemetry", icon: Activity },
  ];

  return (
    <>
      <aside className="w-64 border-r border-slate-800 bg-slate-950/95 p-3 flex flex-col gap-4 font-mono text-xs z-10 overflow-y-auto shrink-0">
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            MISSION CONTROL
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
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

        {/* ACTIVE SESSION PANEL */}
        <GlassPanel className="space-y-3">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
            <span>SESSION CONTROL</span>
            {session?.status === "ACTIVE" && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>

          {!session ? (
            <div className="space-y-2">
              <div className="text-[11px] text-slate-500 text-center py-1">
                No session selected
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 transition-colors text-[10px] font-bold"
                >
                  <PlusCircle className="w-3 h-3" /> NEW
                </button>
                <button
                  onClick={() => setIsSelectModalOpen(true)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 transition-colors text-[10px] font-bold"
                >
                  <FolderOpen className="w-3 h-3" /> CHOOSE
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Session:</span>
                  <span
                    className="text-slate-200 font-semibold truncate max-w-30"
                    title={session.name}
                  >
                    {session.name}
                  </span>
                </div>

                {session.area && (
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Area:</span>
                    <span
                      className="text-slate-300 truncate max-w-30"
                      title={session.area}
                    >
                      {session.area}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Status:</span>
                  <span
                    className={
                      session.status === "ACTIVE"
                        ? "text-emerald-400 font-bold"
                        : session.status === "CREATED"
                          ? "text-amber-400 font-bold"
                          : "text-slate-400 font-bold"
                    }
                  >
                    {session.status}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Started:</span>
                  <span className="text-slate-300">
                    {session.started_at
                      ? new Date(session.started_at).toLocaleTimeString()
                      : "--:--:--"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <SessionDuration session={session} />
                </div>
              </div>

              {/* ACTION BUTTONS BASED ON LIFECYCLE */}
              <div className="space-y-2 pt-1">
                {session.status === "CREATED" && onStartSession && (
                  <button
                    onClick={async () => {
                      setIsSubmitting(true);
                      await onStartSession();
                      setIsSubmitting(false);
                    }}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 transition-colors text-[10px] font-bold disabled:opacity-50"
                  >
                    <Play className="w-3 h-3 fill-emerald-300" />
                    <span>
                      {isSubmitting ? "STARTING..." : "START SESSION"}
                    </span>
                  </button>
                )}

                {session.status === "ACTIVE" && onStopSession && (
                  <button
                    onClick={async () => {
                      setIsSubmitting(true);
                      await onStopSession();
                      setIsSubmitting(false);
                    }}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded border border-rose-500/40 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50 transition-colors text-[10px] font-bold disabled:opacity-50"
                  >
                    <Square className="w-3 h-3 fill-rose-300" />
                    <span>{isSubmitting ? "STOPPING..." : "END SESSION"}</span>
                  </button>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex-1 py-1 rounded border border-cyan-500/30 bg-cyan-950/20 text-cyan-300 hover:bg-cyan-900/40 transition-colors text-[9px]"
                  >
                    + NEW
                  </button>
                  <button
                    onClick={() => setIsSelectModalOpen(true)}
                    className="flex-1 py-1 rounded border border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800 transition-colors text-[9px]"
                  >
                    SWITCH
                  </button>
                </div>
              </div>
            </>
          )}
        </GlassPanel>

        {/* SYSTEM STATUS PANEL */}
        <GlassPanel className="space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            SYSTEM STATUS
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-cyan-400" /> WS
              </span>
              <StatusBadge
                status={
                  isConnected ? ("ONLINE" as const) : ("OFFLINE" as const)
                }
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

      {/* CREATE SESSION MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 w-full max-w-sm shadow-xl space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-cyan-400">
              CREATE NEW SESSION
            </h3>
            <form onSubmit={handleModalSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">
                  Session Name *
                </label>
                <input
                  type="text"
                  required
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g. Operation Phoenix"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  Area / Zone (Optional)
                </label>
                <input
                  type="text"
                  value={sessionArea}
                  onChange={(e) => setSessionArea(e.target.value)}
                  placeholder="e.g. Collapse Zone A"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded bg-cyan-600 text-white hover:bg-cyan-500 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SELECT SESSION MODAL */}
      {isSelectModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 w-full max-w-md shadow-xl space-y-4 font-mono text-xs max-h-[80vh] flex flex-col">
            <h3 className="text-sm font-bold text-cyan-400">
              SELECT EXISTING SESSION
            </h3>
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {availableSessions.length === 0 ? (
                <div className="text-slate-500 text-center py-4">
                  No sessions found in database.
                </div>
              ) : (
                availableSessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (onSelectSession) onSelectSession(s.id);
                      setIsSelectModalOpen(false);
                    }}
                    className={`w-full p-2.5 text-left rounded border transition-colors flex items-center justify-between ${
                      session?.id === s.id
                        ? "border-cyan-500 bg-cyan-950/40 text-cyan-200"
                        : "border-slate-800 bg-slate-950/50 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div>
                      <div className="font-bold">{s.name}</div>
                      {s.area && (
                        <div className="text-[10px] text-slate-400">
                          {s.area}
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-bold ${
                        s.status === "ACTIVE"
                          ? "text-emerald-400"
                          : s.status === "CREATED"
                            ? "text-amber-400"
                            : "text-slate-500"
                      }`}
                    >
                      {s.status}
                    </span>
                  </button>
                ))
              )}
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsSelectModalOpen(false)}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
