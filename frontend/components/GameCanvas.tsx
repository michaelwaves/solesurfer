"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as THREE from "three";
import { createScene, createRenderer } from "@/renderer/scene";
import { createCamera, updateCamera, handleResize } from "@/renderer/camera";
import { createCharacter, updateCharacter } from "@/renderer/character";
import { TerrainChunkManager } from "@/renderer/chunks";
import { SnowParticles } from "@/renderer/particles";
import { SplatScene } from "@/renderer/splats";
import { createGameState, GameState, GameMode } from "@/game/state";
import { createGameLoop } from "@/game/loop";
import { initKeyboardAdapter } from "@/input/keyboard-adapter";
import { getTerrainHeight, setTerrainMode } from "@/game/terrain";
import { useInsoleInput } from "@/hooks/useInsoleInput";

interface GameCanvasProps {
  mode: GameMode;
  sceneUrl?: string;
  onStateUpdate?: (state: GameState) => void;
  restartKey?: number;
}

export default function GameCanvas({ mode, sceneUrl, onStateUpdate, restartKey }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useInsoleInput();

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const testCtx = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!testCtx) {
        setError("WebGL is not supported in this browser. Please use Chrome, Firefox, or Edge.");
        return;
      }

      setTerrainMode(mode);

      const scene = createScene();
      const renderer = createRenderer(canvas);
      const camera = createCamera();

      const character = createCharacter();
      scene.add(character);

      const chunkManager = new TerrainChunkManager(scene);
      const snowParticles = new SnowParticles(scene);

      // Load World Labs splat backdrop if URL is provided
      const splatScene = new SplatScene(scene);
      if (sceneUrl) {
        splatScene.load(sceneUrl).then((ok) => {
          if (ok) console.log("Splat scene loaded");
          else console.warn("Splat scene failed to load, using procedural backdrop");
        });
      }

      const state = createGameState();
      state.phase = "playing";
      state.player.position.y = getTerrainHeight(0, 0);
      state.player.velocity.z = -5;

      const cleanupKeyboard = initKeyboardAdapter();

      const onRender = (gameState: GameState, dt: number) => {
        chunkManager.update(gameState.player.position.z);
        updateCharacter(character, gameState.player);
        updateCamera(camera, gameState.player);
        snowParticles.update(gameState.player, dt);
        renderer.render(scene, camera);
        onStateUpdate?.(gameState);
      };

      const loop = createGameLoop(state, onRender);
      loop.start();

      const onResize = () => handleResize(camera, renderer);
      window.addEventListener("resize", onResize);

      return () => {
        loop.stop();
        cleanupKeyboard();
        window.removeEventListener("resize", onResize);
        chunkManager.dispose();
        snowParticles.dispose();
        splatScene.dispose();
        renderer.dispose();
        scene.clear();
      };
    } catch (e) {
      console.error("Failed to initialize game:", e);
      setError(`Failed to initialize game engine: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [mode, sceneUrl, onStateUpdate, restartKey]);

  useEffect(() => {
    setError(null);
    const cleanup = init();
    return cleanup;
  }, [init]);

  if (error) {
    return (
      <div className="fixed inset-0 bg-zinc-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md px-6">
          <p className="text-2xl font-bold mb-4">Unable to Start Game</p>
          <p className="text-zinc-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
