import React from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  alert?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  subtext,
  alert,
}) => {
  return (
    <div
      className={`p-3 rounded border bg-slate-900/60 ${alert ? "border-red-500/50 bg-red-950/20" : "border-slate-800"}`}
    >
      <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400">
        {label}
      </div>
      <div className="flex items-baseline gap-1 mt-1">
        <span
          className={`text-xl font-mono font-bold ${alert ? "text-red-400" : "text-cyan-400"}`}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs text-slate-500 font-mono">{unit}</span>
        )}
      </div>
      {subtext && (
        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
          {subtext}
        </div>
      )}
    </div>
  );
};
