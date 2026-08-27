"use client";

import React, { useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Detection } from "@/app/types/detection";

interface SurvivorMarkerProps {
  detection: Detection;
  position: [number, number, number];
}

export const SurvivorMarker: React.FC<SurvivorMarkerProps> = ({
  detection,
  position,
}) => {
  const coreRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const intensity = 0.6 + detection.survivor_probability * 1.4;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const pulse = 1 + Math.sin(t * 6) * 0.15;

    if (coreRef.current) coreRef.current.scale.setScalar(pulse);
    if (haloRef.current) {
      const haloPulse = 1 + Math.sin(t * 3) * 0.3;
      haloRef.current.scale.setScalar(haloPulse);
      (haloRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.25 + Math.sin(t * 3) * 0.1;
    }
    if (lightRef.current) {
      lightRef.current.intensity = intensity * (0.8 + Math.sin(t * 6) * 0.2);
    }
  });

  return (
    <group position={position}>
      {/* Light source: this is what actually "shows through" the box walls */}
      <pointLight
        ref={lightRef}
        color="#ef4444"
        intensity={intensity}
        distance={4}
        decay={2}
      />

      {/* Bright solid core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshBasicMaterial color="#ff6b6b" />
      </mesh>

      {/* Additive glow halo — reads as "light bleeding," not a decal */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshBasicMaterial
          color="#ef4444"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <Html distanceFactor={10} position={[0, 1.6, 0]}>
        <div className="bg-red-950/90 border border-red-500 text-red-200 p-2 rounded shadow-[0_0_15px_rgba(239,68,68,0.5)] font-mono text-xs w-48 backdrop-blur-md">
          <div className="font-bold flex items-center justify-between text-red-400">
            <span>⚠ POSSIBLE SURVIVOR</span>
            <span className="text-[10px] bg-red-500/20 px-1 rounded">
              {Math.round(detection.survivor_probability * 100)}%
            </span>
          </div>
          <div className="mt-1 text-[10px] space-y-0.5 text-slate-300">
            <div>Zone: {detection.zone || "Central Collapse"}</div>
            <div>Movement: {Math.round(detection.movement_score * 100)}%</div>
            <div>Presence: {Math.round(detection.presence_score * 100)}%</div>
          </div>
        </div>
      </Html>
    </group>
  );
};