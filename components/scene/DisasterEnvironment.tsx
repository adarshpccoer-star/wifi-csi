"use client";

import React from "react";

export const DisasterEnvironment: React.FC = () => {
  return (
    <group>
<gridHelper args={[30, 30, "#1e3a4a", "#0f1a24"]} position={[0, -0.01, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#020617" roughness={0.8} />
      </mesh>

      {/* Peripheral debris only — kept off-center so it never competes
          visually with the central collapse box */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh
          key={i}
          position={[Math.sin(i * 1.6) * 9, 0.15, Math.cos(i * 1.6) * 9]}
          rotation={[i, i * 0.5, 0]}
        >
          <dodecahedronGeometry args={[0.2 + (i % 3) * 0.1]} />
          <meshStandardMaterial color="#0f172a" roughness={1} />
        </mesh>
      ))}
    </group>
  );
};