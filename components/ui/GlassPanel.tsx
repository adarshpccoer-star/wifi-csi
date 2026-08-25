import React from "react";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "cyan" | "red" | "green" | "none";
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = "",
  glowColor = "none",
}) => {
  const glowClasses = {
    cyan: "border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]",
    red: "border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-pulse",
    green: "border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]",
    none: "border-slate-800 shadow-black/50",
  };

  return (
    <div
      className={`bg-slate-950/80 backdrop-blur-md border rounded-lg p-4 text-slate-100 transition-all ${glowClasses[glowColor]} ${className}`}
    >
      {children}
    </div>
  );
};
