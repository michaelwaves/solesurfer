"use client";

import { Canvas } from "@react-three/fiber";
import GameScene from "./GameScene";
import HUD from "./hud/HUD";
import StartScreen from "./hud/StartScreen";
import GameOverScreen from "./hud/GameOverScreen";
import { useSensorOrientation } from "@/hooks/useSensorOrientation";

export default function Game() {
  // Wire sensor → store (runs at top level so it lives for the game lifetime)
  useSensorOrientation();

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <Canvas
        shadows
        camera={{ position: [0, 4, 7], fov: 65 }}
        className="absolute inset-0"
      >
        <GameScene />
      </Canvas>

      {/* HTML overlays — absolutely positioned over canvas */}
      <HUD />
      <StartScreen />
      <GameOverScreen />
    </div>
  );
}
