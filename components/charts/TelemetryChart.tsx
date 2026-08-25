"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface TelemetryChartProps {
  data: Array<{ time: string; movement: number; presence: number }>;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({ data }) => {
  return (
    <div className="h-36 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
        >
          <XAxis
            dataKey="time"
            stroke="#475569"
            fontSize={10}
            tickLine={false}
          />
          <YAxis
            domain={[0, 1]}
            stroke="#475569"
            fontSize={10}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#020617",
              borderColor: "#334155",
              fontSize: "11px",
            }}
          />
          <Line
            type="monotone"
            dataKey="movement"
            stroke="#06b6d4"
            strokeWidth={1.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="presence"
            stroke="#10b981"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
