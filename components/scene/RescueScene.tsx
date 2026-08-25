"use client";

import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Device } from "@/app/types/device";
import { Detection } from "@/app/types/detection";
import { DisasterEnvironment } from "./DisasterEnvironment";
import { SensorNode } from "./SensorNode";
import { SurvivorMarker } from "./SurvivorMarker";
import { RescueZone } from "./RescueZone";

interface RescueSceneProps {
  devices: Device[];
  selectedDevice: Device | null;
  onSelectDevice: (device: Device) => void;
  activeDetection: Detection | null;
  latestActivity: number;
}

export const RescueScene: React.FC<RescueSceneProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  activeDetection,
  latestActivity,
}) => {
  return (
    <div className="w-full h-full relative bg-black">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[12, 12, 14]} fov={45} />
        <OrbitControls
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={5}
          maxDistance={40}
        />

        {/* Lighting Setup */}
        <ambientLight intensity={0.2} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={0.8}
          color="#cff4fc"
          castShadow
        />
        <pointLight position={[0, 5, 0]} intensity={0.5} color="#06b6d4" />

        {/* Tactical Disaster Environment */}
        <DisasterEnvironment />

        {/* Render Zones */}
        <RescueZone
          name="Zone A"
          bounds={[10, 4, 10]}
          position={[0, 2, 0]}
          status={activeDetection ? "INVESTIGATING" : "NORMAL"}
        />

        {/* ESP32 Sensor Nodes */}
        {devices.map((device) => (
          <SensorNode
            key={device.id}
            device={device}
            isSelected={selectedDevice?.id === device.id}
            onSelect={onSelectDevice}
            activityLevel={latestActivity}
          />
        ))}

        {/* Survivor Alert Markers */}
        {activeDetection && activeDetection.survivor_probability > 0.5 && (
          <SurvivorMarker detection={activeDetection} position={[2, 0.4, 3]} />
        )}
      </Canvas>
    </div>
  );
};
