import React from "react";

interface StatusBadgeProps {
  status: "ONLINE" | "OFFLINE" | "ACTIVE" | "COMPLETED" | "UNVERIFIED";
  text?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, text }) => {
  const styles = {
    ONLINE: "bg-emerald-950/80 text-emerald-400 border-emerald-500/40",
    ACTIVE: "bg-cyan-950/80 text-cyan-400 border-cyan-500/40",
    OFFLINE: "bg-slate-900 text-slate-500 border-slate-700",
    COMPLETED: "bg-purple-950/80 text-purple-400 border-purple-500/40",
    UNVERIFIED: "bg-amber-950/80 text-amber-400 border-amber-500/40",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium border ${styles[status]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${status === "ONLINE" || status === "ACTIVE" ? "bg-emerald-400 animate-ping" : "bg-current"}`}
      />
      {text || status}
    </span>
  );
};
