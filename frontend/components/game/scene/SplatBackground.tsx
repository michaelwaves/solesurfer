"use client";

import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";

// Transform from scene.json:
//   translation: [0, 13.12, 0]
//   quaternion:  [1, 0, 0, ~0]  → 180° around X axis
//   scale:       7.056
// Z is offset to place the mountain behind the slope.
const POSITION: [number, number, number] = [0, 8, -15];
const QUATERNION: [number, number, number, number] = [1, 0, 0, 0]; // THREE: (x,y,z,w)
const SCALE = 7.056;

export default function SplatBackground() {
  const { gl } = useThree();

  const spark = useMemo(() => {
    try {
      return new SparkRenderer({ renderer: gl, maxStdDev: Math.sqrt(5) });
    } catch (e) {
      console.warn("[SplatBackground] SparkRenderer init failed:", e);
      return null;
    }
  }, [gl]);

  const splatMesh = useMemo(() => {
    if (!spark) return null;
    try {
      const mesh = new SplatMesh({
        url: "/scenes/icy-mountain-ski-resort.spz",
      });
      mesh.position.set(...POSITION);
      mesh.quaternion.set(...QUATERNION);
      mesh.scale.setScalar(SCALE);
      return mesh;
    } catch (e) {
      console.warn("[SplatBackground] SplatMesh init failed:", e);
      return null;
    }
  }, [spark]);

  if (!spark || !splatMesh) return null;

  return (
    <>
      <primitive object={spark} />
      <primitive object={splatMesh} />
    </>
  );
}
