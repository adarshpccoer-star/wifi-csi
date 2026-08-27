"use client";

import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Device } from "@/app/types/device";
import { Detection } from "@/app/types/detection";
import { DisasterEnvironment } from "./DisasterEnvironment";
import { CollapseBox } from "./CollapseBox";
import { SensorNode } from "./SensorNode";
import { SurvivorMarker } from "./SurvivorMarker";
import { RescueZone } from "./RescueZone";
import { DetectionBeam } from "./DetectionBeam";

interface RescueSceneProps {
  devices: Device[];
  selectedDevice: Device | null;
  onSelectDevice: (device: Device) => void;
  activeDetection: Detection | null;
  latestActivity: number;
}

const BOX_SIZE: [number, number, number] = [4.5, 1.8, 1.4]; // length, height, breadth
const BOX_CENTER: [number, number, number] = [0, BOX_SIZE[1] / 2, 0];

export const RescueScene: React.FC<RescueSceneProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  activeDetection,
  latestActivity,
}) => {
  const survivorPosition: [number, number, number] = [
  0,
  0.7,
  0,
];
  return (
    <div className="w-full h-full relative bg-black">
      <Canvas shadows>
        <PerspectiveCamera
  makeDefault
  position={[8, 7, 10]}
  fov={50}
/>
        <OrbitControls maxPolarAngle={Math.PI / 2 - 0.05} minDistance={5} maxDistance={40} />

        {/* Neutral white ambient instead of cyan-tinted — lets node identity colors read true */}
<ambientLight intensity={0.35} color="#ffffff" />
<directionalLight
  position={[10, 20, 10]}
  intensity={0.9}
  color="#ffffff"
  castShadow
/>
{/* Drop the always-on cyan point light, or dim it hard — it's tinting everything */}
<pointLight position={[0, 5, 0]} intensity={0.15} color="#94a3b8" />

        <DisasterEnvironment />

        <RescueZone
          name="Zone A"
          bounds={[10, 4, 10]}
          position={[0, 2, 0]}
          status={activeDetection ? "INVESTIGATING" : "NORMAL"}
        />

        <CollapseBox
        isHotspot={Boolean(
  activeDetection &&
  activeDetection.survivor_probability > 0.5
)} 
        position={BOX_CENTER} size={BOX_SIZE} />

        {devices.map((device) => (
          <SensorNode
            key={device.id}
            device={device}
            isSelected={selectedDevice?.id === device.id}
            onSelect={onSelectDevice}
            activityLevel={latestActivity}
          />
        ))}
        {activeDetection &&
  activeDetection.survivor_probability > 0.5 &&
  devices.map((device) => {
    const start: [number, number, number] = [
      device.location_x ?? 0,
      device.location_z ?? 0,
      device.location_y ?? 0,
    ];

    return (
      <DetectionBeam
        key={`beam-${device.id}`}
        start={start}
        end={survivorPosition}
      />
    );
  })}

       {activeDetection && activeDetection.survivor_probability > 0.5 && (
  <SurvivorMarker detection={activeDetection} position={BOX_CENTER} />
)}
      </Canvas>
    </div>
  );
};