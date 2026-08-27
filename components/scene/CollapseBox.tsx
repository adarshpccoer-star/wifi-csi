"use client";

import React from "react";

interface CollapseBoxProps {
  position: [number, number, number];
  size?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * Represents the physical rubble/collapse structure (matches the
 * cardboard box rig in the field photo). Kept semi-transparent so
 * an internal presence marker is visible glowing through the walls.
 */
export const CollapseBox: React.FC<CollapseBoxProps> = ({
  position,
  size = [4.5, 1.0, 1.4],
  rotation = [0, 0, 0],
}) => {
  
  return (
  <group position={position} rotation={rotation}>
      {/* Solid translucent shell */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color="#2b2f38"
          roughness={0.85}
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>

      {/* Edge lines so the box reads as structure, not fog */}
      <lineSegments>
        <edgesGeometry args={[new (require("three").BoxGeometry)(...size)]} />
        <lineBasicMaterial color="#64748b" transparent opacity={0.6} />
      </lineSegments>
    </group>
  );
};