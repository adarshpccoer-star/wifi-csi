"use client";

import React, { useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Detection } from "@/app/types/detection";

interface SurvivorMarkerProps {
  detection: Detection;
  position?: [number, number, number];
}

export const SurvivorMarker: React.FC<SurvivorMarkerProps> = ({
  detection,
  position = [2, 0.5, 3],
}) => {
  const markerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (markerRef.current) {
      const pulse = 1 + Math.sin(state.clock.getElapsedTime() * 6) * 0.15;
      markerRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group position={position}>
      {/* Dynamic Red Pulsing Sphere */}
      <mesh ref={markerRef}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshBasicMaterial color="#ef4444" wireframe />
      </mesh>

      {/* Rescue Beam */}
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.05, 0.2, 5]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.3} />
      </mesh>

      {/* Floating Tactical Alert Label */}
      <Html distanceFactor={10} position={[0, 1.2, 0]}>
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
