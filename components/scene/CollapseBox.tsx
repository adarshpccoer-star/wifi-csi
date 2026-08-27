"use client";

import React from "react";
import * as THREE from "three";

interface CollapseBoxProps {
  position: [number, number, number];
  size?: [number, number, number];
  rotation?: [number, number, number];
  /** True when a presence/heartbeat signal is detected inside the structure */
  occupied?: boolean;
  isHotspot?: boolean;
}

/**
 * Represents the physical rubble/collapse structure (matches the
 * cardboard box rig in the field photo). The shell reads as solid
 * building material (concrete/debris tone) rather than fog. When
 * `occupied` is true, an internal light turns on and the shell's
 * emissive glow rises, so a person inside reads as a warm glow
 * bleeding through the translucent walls.
 */
export const CollapseBox: React.FC<CollapseBoxProps> = ({
  position,
  size = [4.5, 1.75, 1.4],
  rotation = [0, 0, 0],
  occupied = false,
  isHotspot = false,
}) => {
  const emissiveColor = occupied ? "#ff8a3d" : isHotspot ? "#ff2200" : "#000000";
  const emissiveIntensity = occupied ? 1.4 : isHotspot ? 0.8 : 0;
  const shellColor = occupied ? "#3d3226" : isHotspot ? "#5b1a1a" : "#2a2f36";

  return (
    <group position={position} rotation={rotation}>
      {/* Solid translucent shell — reads as concrete/rubble, not fog */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial
  color="#2f343b"
  roughness={0.95}
  metalness={0.05}
  transparent
  opacity={0.18}
/>
      </mesh>

      {/* Internal glow source — only lit when someone is detected inside */}
      {isHotspot && (
  <>
    <mesh position={[0, -size[1] / 2 + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.6, 0.9, 64]} />
      <meshBasicMaterial
        color="#ff5522"
        transparent
        opacity={0.95}
      />
    </mesh>

    <pointLight
      position={[0, 0.1, 0]}
      color="#ff5522"
      intensity={4}
      distance={3}
      decay={2}
    />
  </>
)}

      {/* Edge lines so the box reads as structure, not fog */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
        <lineBasicMaterial
          color={occupied ? "#ffb677" : "#64748b"}
          transparent
          opacity={0.6}
        />
      </lineSegments>
    </group>
  );
};