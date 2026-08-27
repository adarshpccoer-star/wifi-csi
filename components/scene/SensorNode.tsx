"use client";

import React, { useRef, useMemo } from "react";
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

// Fixed palette so colors stay stable across re-renders and re-fetches.
// Extend this if you expect more than 6 concurrent sensors.
const NODE_COLORS = [
  "#06b6d4", // cyan
  "#f59e0b", // amber
  "#a855f7", // purple
  "#22c55e", // green
  "#ec4899", // pink
  "#3b82f6", // blue
];

function colorForDevice(deviceId: string): string {
  let hash = 0;
  for (let i = 0; i < deviceId.length; i++) {
    hash = (hash * 31 + deviceId.charCodeAt(i)) >>> 0;
  }
  return NODE_COLORS[hash % NODE_COLORS.length];
}

export const SensorNode: React.FC<SensorNodeProps> = ({
  device,
  isSelected,
  onSelect,
  activityLevel = 0.04,
}) => {
  const beaconRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const isOnline = device.status === "ONLINE";

  const nodeColor = useMemo(
    () => colorForDevice(device.device_id ?? device.id ?? device.name ?? "default"),
    [device.device_id, device.id, device.name],
  );

  const pos: [number, number, number] = [
    device.location_x ?? 0,
    device.location_z ?? 0,
    device.location_y ?? 0,
  ];

  useFrame((state) => {
    if (beaconRef.current && isOnline) {
      beaconRef.current.scale.y =
        1 + Math.sin(state.clock.getElapsedTime() * 4) * 0.2;
    }
    if (ringRef.current && isSelected) {
      const pulse = 1 + Math.sin(state.clock.getElapsedTime() * 5) * 0.1;
      ringRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group position={pos}>
      {/* Physical Sensor Housing — color = stable device identity */}
      <mesh onClick={() => onSelect(device)}>
      <boxGeometry args={[0.6, 0.3, 0.45]} />        
      <meshStandardMaterial color={nodeColor} metalness={0.5} />
      </mesh>

      {/* Selection indicator — separate from identity color */}
      {isSelected && (
        <mesh ref={ringRef}>
          <boxGeometry args={[0.5, 0.3, 0.4]} />
          <meshBasicMaterial
            color="#ffffff"
            wireframe
            transparent
            opacity={0.7}
          />
        </mesh>
      )}

      {/* Antenna */}
      <mesh position={[0.1, 0.25, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>

      {/* Vertical Status Beacon — color = online/offline, independent of node identity */}
      <mesh ref={beaconRef} position={[0, 1 , 0]}>
        <cylinderGeometry args={[0.01, 0.01, 1]} />
        <meshBasicMaterial
          color={isOnline ? "#10b981" : "#64748b"}
          transparent
          opacity={isOnline ? 0.6 : 0.2}
        />
      </mesh>

      {isOnline && <SensorSignal activityLevel={activityLevel} />}

      <Html distanceFactor={12} position={[0, 0.8, 0]}>
        <div
          onClick={() => onSelect(device)}
          className="cursor-pointer px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap border backdrop-blur-md transition-all"
          style={{
            backgroundColor: isSelected ? "rgba(6,182,212,0.15)" : "rgba(2,6,23,0.8)",
            borderColor: nodeColor,
            color: nodeColor,
            boxShadow: isSelected ? `0 0 10px ${nodeColor}66` : "none",
          }}
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