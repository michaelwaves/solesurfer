"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";

const SLOPE_HALF_WIDTH = 9;
const STEER_SPEED = 15;
const LEAN_FACTOR = 0.5;

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

function SnowboarderModel({ groupRef }: { groupRef: React.RefObject<THREE.Group> }) {
  const { scene, animations } = useGLTF("/snowboarder.glb");
  const { actions, names } = useAnimations(animations, groupRef);

  // Play the first animation clip if one exists
  useEffect(() => {
    if (names.length > 0) {
      actions[names[0]]?.reset().fadeIn(0.2).play();
    }
  }, [actions, names]);

  return <primitive object={scene} />;
}

useGLTF.preload("/snowboarder.glb");

export default function Board() {
  const groupRef = useRef<THREE.Group>(null!);
  const { phase, boardPitch, boardX, setBoardX, tick } = useGameStore();

  useFrame((_, dt) => {
    if (phase !== "playing") return;

    let steer = boardPitch;
    if (keysRef.left) steer = -0.6;
    if (keysRef.right) steer = 0.6;

    const newX = THREE.MathUtils.clamp(
      boardX + steer * STEER_SPEED * dt,
      -SLOPE_HALF_WIDTH,
      SLOPE_HALF_WIDTH
    );
    setBoardX(newX);
    tick(dt);

    if (groupRef.current) {
      groupRef.current.position.x = newX;
      groupRef.current.rotation.z = -steer * LEAN_FACTOR;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.8, 0]} rotation={[0, Math.PI, 0]}>
      <SnowboarderModel groupRef={groupRef} />
    </group>
  );
}
