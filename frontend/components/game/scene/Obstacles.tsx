"use client";

import { useRef, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";

const SPAWN_Z = -55;
const DESPAWN_Z = 4;
const SLOPE_HALF_WIDTH = 7.5;
const BOARD_RADIUS = 0.5;
const SPAWN_INTERVAL = 1.6; // seconds between spawns

type ObstacleData = {
  id: string;
  x: number;
  z: number;
  type: "tree" | "rock";
  radius: number;
  ref: React.RefObject<THREE.Group | null>;
};

let idCounter = 0;

function Tree() {
  return (
    <group>
      <mesh position={[0, 0.6, 0]} castShadow>
        <coneGeometry args={[0.5, 2.2, 7]} />
        <meshStandardMaterial color="#1a5c1a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.8, 0]} castShadow>
        <coneGeometry args={[0.35, 1.8, 7]} />
        <meshStandardMaterial color="#1e6b1e" roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.9, 0]} castShadow>
        <coneGeometry args={[0.2, 1.2, 7]} />
        <meshStandardMaterial color="#236b23" roughness={0.8} />
      </mesh>
      {/* trunk */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 0.7, 6]} />
        <meshStandardMaterial color="#5c3d1e" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Rock() {
  return (
    <mesh castShadow>
      <dodecahedronGeometry args={[0.55, 0]} />
      <meshStandardMaterial color="#888" roughness={0.9} metalness={0.1} />
    </mesh>
  );
}

export default function Obstacles() {
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const obstaclesRef = useRef<ObstacleData[]>([]);
  const spawnTimerRef = useRef(0);

  const { phase, speed, boardX, killPlayer } = useGameStore();

  const spawn = useCallback(() => {
    const x = (Math.random() * 2 - 1) * SLOPE_HALF_WIDTH;
    const type: ObstacleData["type"] = Math.random() > 0.4 ? "tree" : "rock";
    const obs: ObstacleData = {
      id: String(idCounter++),
      x,
      z: SPAWN_Z,
      type,
      radius: type === "tree" ? 0.55 : 0.55,
      ref: { current: null } as React.RefObject<THREE.Group | null>,
    };
    obstaclesRef.current = [...obstaclesRef.current, obs];
    setObstacles((prev) => [...prev, obs]);
  }, []);

  useFrame((_, dt) => {
    if (phase !== "playing") return;

    // Spawn timer
    spawnTimerRef.current += dt;
    if (spawnTimerRef.current >= SPAWN_INTERVAL) {
      spawnTimerRef.current = 0;
      spawn();
    }

    // Move obstacles and check collisions
    const toRemove: string[] = [];
    obstaclesRef.current.forEach((obs) => {
      obs.z += speed * dt;

      if (obs.ref.current) {
        obs.ref.current.position.z = obs.z;
      }

      // Despawn
      if (obs.z >= DESPAWN_Z) {
        toRemove.push(obs.id);
        return;
      }

      // Collision (simple 2D circle check near z=0)
      if (obs.z > -1.5 && obs.z < 1.5) {
        const dx = boardX - obs.x;
        if (Math.abs(dx) < obs.radius + BOARD_RADIUS) {
          killPlayer();
        }
      }
    });

    if (toRemove.length > 0) {
      obstaclesRef.current = obstaclesRef.current.filter(
        (o) => !toRemove.includes(o.id)
      );
      setObstacles((prev) => prev.filter((o) => !toRemove.includes(o.id)));
    }
  });

  // Reset obstacles when phase changes
  useFrame(() => {
    if (phase === "idle" && obstaclesRef.current.length > 0) {
      obstaclesRef.current = [];
      spawnTimerRef.current = 0;
      setObstacles([]);
    }
  });

  return (
    <>
      {obstacles.map((obs) => (
        <group
          key={obs.id}
          ref={obs.ref as React.RefObject<THREE.Group>}
          position={[obs.x, 0, obs.z]}
        >
          {obs.type === "tree" ? <Tree /> : <Rock />}
        </group>
      ))}
    </>
  );
}
