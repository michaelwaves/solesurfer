"use client";

import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { createScene, createRenderer } from "@/renderer/scene";
import { createCamera, updateCamera, handleResize } from "@/renderer/camera";
import { createCharacter, updateCharacter } from "@/renderer/character";
import { TerrainChunkManager } from "@/renderer/chunks";
import { SnowParticles } from "@/renderer/particles";
import { createGameState, GameState } from "@/game/state";
import { createGameLoop } from "@/game/loop";
import { initKeyboardAdapter } from "@/input/keyboard-adapter";
import { getTerrainHeight } from "@/game/terrain";
import { useInsoleInput } from "@/hooks/useInsoleInput";

interface GameCanvasProps {
  onStateUpdate?: (state: GameState) => void;
}

export default function GameCanvas({ onStateUpdate }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<ReturnType<typeof createGameLoop> | null>(null);

  // Bridge: auto-connects insole IMU when a BrilliantSole device is connected
  useInsoleInput();

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Three.js setup
    const scene = createScene();
    const renderer = createRenderer(canvas);
    const camera = createCamera();

    // Character
    const character = createCharacter();
    scene.add(character);

    // Terrain chunks
    const chunkManager = new TerrainChunkManager(scene);

    // Particles
    const snowParticles = new SnowParticles(scene);

    // Game state
    const state = createGameState();
    state.phase = "playing";

    // Set initial player height to terrain
    state.player.position.y = getTerrainHeight(0, 0);

    // Give initial downhill velocity so the player starts moving
    state.player.velocity.z = -2;

    // Keyboard input
    const cleanupKeyboard = initKeyboardAdapter();

    // Render callback
    const onRender = (gameState: GameState, dt: number) => {
      // Update terrain chunks
      chunkManager.update(gameState.player.position.z);

      // Update character mesh
      updateCharacter(character, gameState.player);

      // Update camera
      updateCamera(camera, gameState.player);

      // Update particles
      snowParticles.update(gameState.player, dt);

      // Render
      renderer.render(scene, camera);

      // Notify parent of state update
      onStateUpdate?.(gameState);
    };

    // Create and start game loop
    const loop = createGameLoop(state, onRender);
    gameRef.current = loop;
    loop.start();

    // Resize handler
    const onResize = () => handleResize(camera, renderer);
    window.addEventListener("resize", onResize);

    // Cleanup
    return () => {
      loop.stop();
      cleanupKeyboard();
      window.removeEventListener("resize", onResize);
      chunkManager.dispose();
      snowParticles.dispose();
      renderer.dispose();
      scene.clear();
    };
  }, [onStateUpdate]);

  useEffect(() => {
    const cleanup = init();
    return cleanup;
  }, [init]);

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" />
      <div
        id="webgl-lost-overlay"
        className="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      >
        <div className="text-center text-white">
          <p className="text-2xl font-bold mb-4">WebGL Context Lost</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    </>
  );
}
