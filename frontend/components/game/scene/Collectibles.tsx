"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";

const SPAWN_Z = -55;
const DESPAWN_Z = 4;
const SLOPE_HALF_WIDTH = 7.5;
const COLLECT_RADIUS = 0.9;
const SPAWN_INTERVAL = 2.4;
const COIN_SCORE = 50;

type CoinData = {
  id: string;
  x: number;
  z: number;
  ref: React.RefObject<THREE.Group | null>;
};

let idCounter = 0;

const CRYSTAL_MAT = new THREE.MeshPhysicalMaterial({
  color: "#aa44ff",
  emissive: "#6600cc",
  emissiveIntensity: 0.5,
  roughness: 0.05,
  metalness: 0.1,
  transmission: 0.45,
  thickness: 0.8,
  transparent: true,
});

function Gem() {
  const { scene } = useGLTF("/gem.glb");
  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        (obj as THREE.Mesh).material = CRYSTAL_MAT;
        (obj as THREE.Mesh).castShadow = true;
      }
    });
    return clone;
  }, [scene]);
  return <primitive object={cloned} scale={0.5} />;
}

useGLTF.preload("/gem.glb");

export default function Collectibles() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const coinsRef = useRef<CoinData[]>([]);
  const spawnTimerRef = useRef(0);

  const { phase, speed, boardX, addScore } = useGameStore();

  const spawn = useCallback(() => {
    const x = (Math.random() * 2 - 1) * SLOPE_HALF_WIDTH;
    const coin: CoinData = {
      id: String(idCounter++),
      x,
      z: SPAWN_Z,
      ref: { current: null } as React.RefObject<THREE.Group | null>,
    };
    coinsRef.current = [...coinsRef.current, coin];
    setCoins((prev) => [...prev, coin]);
  }, []);

  useFrame((_, dt) => {
    if (phase !== "playing") return;

    spawnTimerRef.current += dt;
    if (spawnTimerRef.current >= SPAWN_INTERVAL) {
      spawnTimerRef.current = 0;
      spawn();
    }

    const toRemove: string[] = [];

    coinsRef.current.forEach((coin) => {
      coin.z += speed * dt;

      if (coin.ref.current) {
        coin.ref.current.position.z = coin.z;
        // Spin the coin
        coin.ref.current.rotation.y += dt * 3;
      }

      // Despawn
      if (coin.z >= DESPAWN_Z) {
        toRemove.push(coin.id);
        return;
      }

      // Collect
      if (coin.z > -1.5 && coin.z < 1.5) {
        const dx = boardX - coin.x;
        if (Math.abs(dx) < COLLECT_RADIUS) {
          addScore(COIN_SCORE);
          toRemove.push(coin.id);
        }
      }
    });

    if (toRemove.length > 0) {
      coinsRef.current = coinsRef.current.filter((c) => !toRemove.includes(c.id));
      setCoins((prev) => prev.filter((c) => !toRemove.includes(c.id)));
    }
  });

  // Clear on reset
  useFrame(() => {
    if (phase === "idle" && coinsRef.current.length > 0) {
      coinsRef.current = [];
      spawnTimerRef.current = 0;
      setCoins([]);
    }
  });

  return (
    <>
      {coins.map((coin) => (
        <group
          key={coin.id}
          ref={coin.ref as React.RefObject<THREE.Group>}
          position={[coin.x, 1.0, coin.z]}
        >
          <Gem />
        </group>
      ))}
    </>
  );
}
