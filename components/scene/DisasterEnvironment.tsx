"use client";

import React from "react";

export const DisasterEnvironment: React.FC = () => {
  return (
    <group>
      {/* Tactical Floor Grid */}
      <gridHelper
        args={[30, 30, "#06b6d4", "#1e293b"]}
        position={[0, -0.01, 0]}
      />

      {/* Ground Plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        receiveShadow
      >
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#020617" roughness={0.8} />
      </mesh>

      {/* Concrete Collapsed Slabs */}
      <mesh position={[2, 0.4, 3]} rotation={[0.2, 0.4, -0.1]}>
        <boxGeometry args={[4, 0.3, 3]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>

      <mesh position={[-3, 0.6, -2]} rotation={[-0.3, 0.2, 0.4]}>
        <boxGeometry args={[5, 0.4, 2.5]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>

      {/* Structural Beams */}
      <mesh position={[0, 1.2, 0]} rotation={[0.5, 0, 0.8]}>
        <cylinderGeometry args={[0.1, 0.1, 6]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>

      {/* Rubble and Debris Clusters */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh
          key={i}
          position={[Math.sin(i * 1.5) * 8, 0.15, Math.cos(i * 1.5) * 8]}
          rotation={[i, i * 0.5, 0]}
        >
          <dodecahedronGeometry args={[0.2 + (i % 3) * 0.1]} />
          <meshStandardMaterial color="#0f172a" roughness={1} />
        </mesh>
      ))}
    </group>
  );
};
