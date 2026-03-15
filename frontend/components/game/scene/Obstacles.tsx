"use client";

import { useRef, useState, useCallback, createRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";

const SPAWN_Z = -55;
const DESPAWN_Z = 4;
const SLOPE_HALF_WIDTH = 7.5;
const BOARD_RADIUS = 0.5;
const SPAWN_INTERVAL = 1.6;
const LASER_DURATION = 0.18;  // seconds laser is visible
const EXPLODE_DURATION = 0.7; // seconds explosion lasts
const PARTICLE_COUNT = 22;
const SHOOT_SCORE = 25;

type ObstacleData = {
  id: string;
  x: number;
  z: number;
  type: "tree" | "rock";
  radius: number;
  ref: React.RefObject<THREE.Group | null>;
};

type LaserData = {
  id: string;
  from: THREE.Vector3Tuple;
  to: THREE.Vector3Tuple;
  born: number;
};

type ExplosionData = {
  id: string;
  position: THREE.Vector3Tuple;
  born: number;
};

let idCounter = 0;

// ── Tree & Rock ─────────────────────────────────────────────────────────────

function ClickCatcher() {
  return (
    <mesh position={[0, 1.5, 0]}>
      <sphereGeometry args={[2, 8, 8]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

const PINE_MAT = new THREE.MeshStandardMaterial({
  color: "#2a7a2a",
  roughness: 0.8,
  metalness: 0.0,
});

function Tree() {
  const { scene } = useGLTF("/pine.glb");
  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        (obj as THREE.Mesh).material = PINE_MAT;
        (obj as THREE.Mesh).castShadow = true;
      }
    });
    return clone;
  }, [scene]);
  return <primitive object={cloned} />;
}

useGLTF.preload("/pine.glb");

function Rock() {
  return (
    <mesh castShadow>
      <dodecahedronGeometry args={[0.55, 0]} />
      <meshStandardMaterial color="#888" roughness={0.9} metalness={0.1} />
    </mesh>
  );
}

// ── Laser beam ───────────────────────────────────────────────────────────────

function LaserBeam({ from, to, born }: LaserData) {
  const matRef = useRef<THREE.LineBasicMaterial>(null!);

  useFrame(() => {
    const age = (Date.now() - born) / 1000;
    if (matRef.current) {
      matRef.current.opacity = Math.max(0, 1 - age / LASER_DURATION);
    }
  });

  return (
    <Line
      points={[from, to]}
      color="#cc44ff"
      lineWidth={4}
      transparent
      opacity={1}
      // @ts-expect-error — drei Line exposes material ref via prop
      materialRef={matRef}
    />
  );
}

// ── Explosion burst ──────────────────────────────────────────────────────────

type ParticleSpec = {
  vel: THREE.Vector3;
  color: string;
  ref: React.RefObject<THREE.Mesh | null>;
};

function ExplosionBurst({ position, born, onDone }: ExplosionData & { onDone: () => void }) {
  const particles = useMemo<ParticleSpec[]>(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          Math.random() * 8 + 2,
          (Math.random() - 0.5) * 10
        ),
        color: i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#cc44ff" : "#ff7700",
        ref: createRef<THREE.Mesh>(),
      })),
    []
  );

  const doneRef = useRef(false);

  useFrame((_, dt) => {
    const age = (Date.now() - born) / 1000;
    const progress = age / EXPLODE_DURATION;

    particles.forEach((p) => {
      const m = p.ref.current;
      if (!m) return;
      // gravity arc
      m.position.set(
        position[0] + p.vel.x * age,
        position[1] + p.vel.y * age - 5 * age * age,
        position[2] + p.vel.z * age
      );
      const opacity = Math.max(0, 1 - progress);
      (m.material as THREE.MeshStandardMaterial).opacity = opacity;
      m.scale.setScalar(Math.max(0, 1 - progress) * 0.28);
    });

    if (!doneRef.current && age > EXPLODE_DURATION) {
      doneRef.current = true;
      onDone();
    }
  });

  return (
    <>
      {particles.map((p, i) => (
        <mesh key={i} ref={p.ref as React.RefObject<THREE.Mesh>}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={p.color}
            emissive={p.color}
            emissiveIntensity={1.2}
            transparent
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Obstacles() {
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const obstaclesRef = useRef<ObstacleData[]>([]);
  const spawnTimerRef = useRef(0);

  const [lasers, setLasers] = useState<LaserData[]>([]);
  const [explosions, setExplosions] = useState<ExplosionData[]>([]);

  const { phase, speed, boardX, killPlayer, addScore } = useGameStore();

  // ── Spawn ────────────────────────────────────────────────────────────────
  const spawn = useCallback(() => {
    const x = (Math.random() * 2 - 1) * SLOPE_HALF_WIDTH;
    const type: ObstacleData["type"] = Math.random() > 0.4 ? "tree" : "rock";
    const obs: ObstacleData = {
      id: String(idCounter++),
      x,
      z: SPAWN_Z,
      type,
      radius: 0.55,
      ref: { current: null } as React.RefObject<THREE.Group | null>,
    };
    obstaclesRef.current = [...obstaclesRef.current, obs];
    setObstacles((prev) => [...prev, obs]);
  }, []);

  // ── Shoot ────────────────────────────────────────────────────────────────
  const shoot = useCallback((obs: ObstacleData) => {
    if (phase !== "playing") return;

    const from: THREE.Vector3Tuple = [boardX, 1.2, 0];
    const to: THREE.Vector3Tuple = [obs.x, 1.2, obs.z];
    const now = Date.now();

    // Laser
    setLasers((prev) => [...prev, { id: String(idCounter++), from, to, born: now }]);

    // Explosion at obstacle world position
    setExplosions((prev) => [
      ...prev,
      { id: String(idCounter++), position: to, born: now },
    ]);

    // Remove obstacle immediately
    obstaclesRef.current = obstaclesRef.current.filter((o) => o.id !== obs.id);
    setObstacles((prev) => prev.filter((o) => o.id !== obs.id));

    addScore(SHOOT_SCORE);

    // Expire laser after its duration
    setTimeout(() => {
      setLasers((prev) => prev.filter((l) => l.from !== from));
    }, LASER_DURATION * 1000 + 50);
  }, [phase, boardX, addScore]);

  // ── Game loop ────────────────────────────────────────────────────────────
  useFrame((_, dt) => {
    if (phase !== "playing") return;

    spawnTimerRef.current += dt;
    if (spawnTimerRef.current >= SPAWN_INTERVAL) {
      spawnTimerRef.current = 0;
      spawn();
    }

    const toRemove: string[] = [];
    obstaclesRef.current.forEach((obs) => {
      obs.z += speed * dt;
      if (obs.ref.current) obs.ref.current.position.z = obs.z;

      if (obs.z >= DESPAWN_Z) { toRemove.push(obs.id); return; }

      if (obs.z > -1.5 && obs.z < 1.5) {
        if (Math.abs(boardX - obs.x) < obs.radius + BOARD_RADIUS) killPlayer();
      }
    });

    if (toRemove.length > 0) {
      obstaclesRef.current = obstaclesRef.current.filter((o) => !toRemove.includes(o.id));
      setObstacles((prev) => prev.filter((o) => !toRemove.includes(o.id)));
    }
  });

  // Reset on idle
  useFrame(() => {
    if (phase === "idle" && obstaclesRef.current.length > 0) {
      obstaclesRef.current = [];
      spawnTimerRef.current = 0;
      setObstacles([]);
      setLasers([]);
      setExplosions([]);
    }
  });

  return (
    <>
      {/* Obstacles */}
      {obstacles.map((obs) => (
        <group
          key={obs.id}
          ref={obs.ref as React.RefObject<THREE.Group>}
          position={[obs.x, 0, obs.z]}
          onClick={(e) => { e.stopPropagation(); shoot(obs); }}
        >
          {obs.type === "tree" ? <Tree /> : <Rock />}
          <ClickCatcher />
        </group>
      ))}

      {/* Laser beams */}
      {lasers.map((l) => (
        <LaserBeam key={l.id} {...l} />
      ))}

      {/* Explosions */}
      {explosions.map((ex) => (
        <ExplosionBurst
          key={ex.id}
          {...ex}
          onDone={() => setExplosions((prev) => prev.filter((e) => e.id !== ex.id))}
        />
      ))}
    </>
  );
}
