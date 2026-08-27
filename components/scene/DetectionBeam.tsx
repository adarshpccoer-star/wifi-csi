"use client";

import React, { useRef } from "react";
import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

interface DetectionBeamProps {
  start: [number, number, number];
  end: [number, number, number];
}

export const DetectionBeam: React.FC<DetectionBeamProps> = ({
  start,
  end,
}) => {
  const beamRef = useRef<any>(null);

  useFrame((state) => {
    const material = beamRef.current?.material;
    if (!material) return;

    const pulse = 0.4 + Math.sin(state.clock.getElapsedTime() * 4) * 0.2;
    material.opacity = pulse;
  });

  return (
    <Line
      ref={beamRef}
      points={[start, end]}
      color="#06b6d4"
      lineWidth={3}
      transparent
      opacity={0.7}
    />
  );
};