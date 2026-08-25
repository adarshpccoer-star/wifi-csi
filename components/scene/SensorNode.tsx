"use client";

import React, { useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Device } from "@/app/types/device";
import { SensorSignal } from "./SensorSignal";

interface SensorNodeProps {
  device: Device;
  isSelected: boolean;
  onSelect: (device: Device) => void;
  activityLevel?: number;
}

export const SensorNode: React.FC<SensorNodeProps> = ({
  device,
  isSelected,
  onSelect,
  activityLevel = 0.04,
}) => {
  const beaconRef = useRef<THREE.Mesh>(null);
  const isOnline = device.status === "ONLINE";
  const pos: [number, number, number] = [
    device.location_x ?? 0,
    device.location_z ?? 0, // Y in R3F is up, mapping Z to Y height
    device.location_y ?? 0,
  ];

  useFrame((state) => {
    if (beaconRef.current && isOnline) {
      beaconRef.current.scale.y =
        1 + Math.sin(state.clock.getElapsedTime() * 4) * 0.2;
    }
  });

  return (
    <group position={pos}>
      {/* Physical Sensor Housing */}
      <mesh onClick={() => onSelect(device)}>
        <boxGeometry args={[0.4, 0.2, 0.3]} />
        <meshStandardMaterial
          color={isSelected ? "#06b6d4" : "#1e293b"}
          metalness={0.5}
        />
      </mesh>

      {/* Antenna */}
      <mesh position={[0.1, 0.25, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>

      {/* Vertical Status Beacon */}
      <mesh ref={beaconRef} position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 1]} />
        <meshBasicMaterial
          color={isOnline ? "#10b981" : "#64748b"}
          transparent
          opacity={isOnline ? 0.6 : 0.2}
        />
      </mesh>

      {/* CSI Wave Signal propagation */}
      {isOnline && <SensorSignal activityLevel={activityLevel} />}

      {/* Hover/Selection Node Label */}
      <Html distanceFactor={12} position={[0, 0.8, 0]}>
        <div
          onClick={() => onSelect(device)}
          className={`cursor-pointer px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap border backdrop-blur-md transition-all ${
            isSelected
              ? "bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
              : "bg-slate-950/80 border-slate-700 text-slate-300"
          }`}
        >
          <div className="font-bold">{device.name || device.device_id}</div>
          <div className="text-[8px] text-slate-400">
            {isOnline ? "ONLINE • CSI Active" : "OFFLINE"}
          </div>
        </div>
      </Html>
    </group>
  );
};
