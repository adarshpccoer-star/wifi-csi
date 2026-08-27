"use client";

import React from "react";

interface RescueZoneProps {
  name: string;
  bounds: [number, number, number]; // width, height, depth
  position: [number, number, number];
  status?: "NORMAL" | "INVESTIGATING";
}

export const RescueZone: React.FC<RescueZoneProps> = ({
  bounds,
  position,
  status = "NORMAL",
}) => {
  const isInvestigating = status === "INVESTIGATING";

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={bounds} />
        <meshBasicMaterial
  color={isInvestigating ? "#ef4444" : "#06b6d4"}
  transparent
  opacity={0.04}
/>
      </mesh>
    </group>
  );
};
