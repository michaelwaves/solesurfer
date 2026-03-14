"use client";

import { Sky } from "@react-three/drei";
import Board from "./scene/Board";
import Terrain from "./scene/Terrain";
import Obstacles from "./scene/Obstacles";
import Collectibles from "./scene/Collectibles";
import FollowCamera from "./scene/FollowCamera";

export default function GameScene() {
  return (
    <>
      <Sky sunPosition={[100, 80, -200]} />
      <fog attach="fog" args={["#b8d4f0", 30, 80]} />
      <ambientLight intensity={1.2} />
      <directionalLight
        position={[10, 20, 5]}
        intensity={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      <Board />
      <Terrain />
      <Obstacles />
      <Collectibles />
      <FollowCamera />
    </>
  );
}
