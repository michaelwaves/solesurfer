"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";

const SLOPE_HALF_WIDTH = 9;
const STEER_SPEED = 6; // units/sec per radian of roll
const LEAN_FACTOR = 0.5; // how much the board visually tilts

// Keys state (module-level so all components share it)
export const keysRef = { left: false, right: false };

if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") keysRef.left = true;
    if (e.key === "ArrowRight") keysRef.right = true;
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") keysRef.left = false;
    if (e.key === "ArrowRight") keysRef.right = false;
  });
}

export default function Board() {
  const meshRef = useRef<THREE.Group>(null!);
  const { phase, boardRoll, boardX, setBoardX, tick } = useGameStore();

  useFrame((_, dt) => {
    if (phase !== "playing") return;

    // --- Steering ---
    let roll = boardRoll;
    if (keysRef.left) roll = -0.6;
    if (keysRef.right) roll = 0.6;

    const newX = THREE.MathUtils.clamp(
      boardX + roll * STEER_SPEED * dt,
      -SLOPE_HALF_WIDTH,
      SLOPE_HALF_WIDTH
    );
    setBoardX(newX);

    // --- Advance game time ---
    tick(dt);

    // --- Apply transforms ---
    if (meshRef.current) {
      meshRef.current.position.x = newX;
      // Lean into turn
      meshRef.current.rotation.z = -roll * LEAN_FACTOR;
    }
  });

  return (
    <group ref={meshRef} position={[0, 0.25, 0]}>
      {/* Board deck */}
      <mesh castShadow>
        <boxGeometry args={[0.28, 0.06, 1.1]} />
        <meshStandardMaterial color="#e63946" roughness={0.4} />
      </mesh>
      {/* Nose tip */}
      <mesh position={[0, 0.04, 0.55]} rotation={[Math.PI / 6, 0, 0]}>
        <boxGeometry args={[0.28, 0.06, 0.12]} />
        <meshStandardMaterial color="#e63946" roughness={0.4} />
      </mesh>
      {/* Tail tip */}
      <mesh position={[0, 0.04, -0.55]} rotation={[-Math.PI / 6, 0, 0]}>
        <boxGeometry args={[0.28, 0.06, 0.12]} />
        <meshStandardMaterial color="#e63946" roughness={0.4} />
      </mesh>
      {/* Boots */}
      <mesh position={[-0.03, 0.09, 0.2]} castShadow>
        <boxGeometry args={[0.18, 0.12, 0.22]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[-0.03, 0.09, -0.2]} castShadow>
        <boxGeometry args={[0.18, 0.12, 0.22]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
}
