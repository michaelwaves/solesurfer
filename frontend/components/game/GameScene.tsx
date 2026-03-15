"use client";

import Board from "./scene/Board";
import Terrain from "./scene/Terrain";
import Obstacles from "./scene/Obstacles";
import Collectibles from "./scene/Collectibles";
import FollowCamera from "./scene/FollowCamera";
import SplatBackground from "./scene/SplatBackground";
import SplatErrorBoundary from "./scene/SplatErrorBoundary";

export default function GameScene() {
  return (
    <>
      {/* Icy sky background colour — matches the splat palette */}
      <color attach="background" args={["#a8c8e8"]} />
      <fog attach="fog" args={["#b8d4f0", 40, 90]} />

      <ambientLight intensity={1.2} />
      <directionalLight
        position={[10, 20, 5]}
        intensity={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      <SplatErrorBoundary>
        <SplatBackground />
      </SplatErrorBoundary>
      <Board />
      <Terrain />
      <Obstacles />
      <Collectibles />
      <FollowCamera />
    </>
  );
}
