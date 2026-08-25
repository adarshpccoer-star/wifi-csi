"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SensorSignalProps {
  activityLevel: number;
}

export const SensorSignal: React.FC<SensorSignalProps> = ({
  activityLevel,
}) => {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      const speed = 1 + activityLevel * 10;
      const scale = (state.clock.getElapsedTime() * speed) % 4;
      ringRef.current.scale.set(scale, scale, scale);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(
        0,
        1 - scale / 4,
      );
    }
  });

  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <ringGeometry args={[0.8, 0.85, 32]} />
      <meshBasicMaterial
        color="#06b6d4"
        transparent
        opacity={0.5}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};
