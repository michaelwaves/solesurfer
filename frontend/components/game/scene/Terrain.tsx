"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";

const TILE_LENGTH = 80;
const SLOPE_WIDTH = 22;

export default function Terrain() {
  const tileARef = useRef<THREE.Mesh>(null!);
  const tileBRef = useRef<THREE.Mesh>(null!);
  const offsetRef = useRef(0);

  const { phase, speed } = useGameStore();

  useFrame((_, dt) => {
    if (phase !== "playing") return;

    offsetRef.current += speed * dt;

    // Leapfrog tiles
    if (offsetRef.current >= TILE_LENGTH) {
      offsetRef.current -= TILE_LENGTH;
    }

    const zA = offsetRef.current;
    const zB = offsetRef.current - TILE_LENGTH;

    if (tileARef.current) tileARef.current.position.z = zA;
    if (tileBRef.current) tileBRef.current.position.z = zB;
  });

  const snowMaterial = (
    <meshStandardMaterial color="#ddeeff" roughness={0.9} metalness={0} />
  );

  return (
    <group>
      {/* Snow tiles */}
      <mesh ref={tileARef} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[SLOPE_WIDTH, TILE_LENGTH, 1, 1]} />
        {snowMaterial}
      </mesh>
      <mesh ref={tileBRef} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -TILE_LENGTH]}>
        <planeGeometry args={[SLOPE_WIDTH, TILE_LENGTH, 1, 1]} />
        {snowMaterial}
      </mesh>

      {/* Edge markers — dark stripes on the sides */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[SLOPE_WIDTH / 2 + 0.5, 0.01, -40]}>
        <planeGeometry args={[1, TILE_LENGTH * 2]} />
        <meshStandardMaterial color="#334" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-(SLOPE_WIDTH / 2 + 0.5), 0.01, -40]}>
        <planeGeometry args={[1, TILE_LENGTH * 2]} />
        <meshStandardMaterial color="#334" />
      </mesh>
    </group>
  );
}
