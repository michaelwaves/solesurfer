"use client";

import { useFrame } from "@react-three/fiber";
import { useGameStore } from "@/store/useGameStore";

const CAM_Y = 4;
const CAM_Z = 7;
const CAM_LOOK_Z = -4;
const LERP_SPEED = 8;

export default function FollowCamera() {
  const boardX = useGameStore((s) => s.boardX);

  useFrame(({ camera }, dt) => {
    camera.position.x += (boardX - camera.position.x) * Math.min(LERP_SPEED * dt, 1);
    camera.position.y = CAM_Y;
    camera.position.z = CAM_Z;
    camera.lookAt(camera.position.x, 0, CAM_LOOK_Z);
  });

  return null;
}
