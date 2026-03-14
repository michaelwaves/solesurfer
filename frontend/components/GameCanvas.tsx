"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as THREE from "three";
import { createScene, createRenderer } from "@/renderer/scene";
import { createCamera, updateCamera, handleResize } from "@/renderer/camera";
import { createCharacter, updateCharacter } from "@/renderer/character";
import { TerrainChunkManager } from "@/renderer/chunks";
import { SnowParticles } from "@/renderer/particles";
import { SplatScene } from "@/renderer/splats";
import { VRHud } from "@/renderer/vr-hud";
import { checkXRSupport, enterVR, exitVR } from "@/renderer/xr";
import { createGameState, GameState, GameMode } from "@/game/state";
import { CONFIG } from "@/game/config";
import { updatePhysics } from "@/game/physics";
import { initKeyboardAdapter, pollKeyboard } from "@/input/keyboard-adapter";
import { inputState } from "@/input/input-state";
import { getTerrainHeight, setTerrainMode } from "@/game/terrain";
import { useInsoleInput } from "@/hooks/useInsoleInput";

interface GameCanvasProps {
  mode: GameMode;
  sceneUrl?: string;
  onStateUpdate?: (state: GameState) => void;
  onVRSupported?: (supported: boolean) => void;
  restartKey?: number;
}

export default function GameCanvas({
  mode,
  sceneUrl,
  onStateUpdate,
  onVRSupported,
  restartKey,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const vrSessionRef = useRef<XRSession | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useInsoleInput();

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const testCtx = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!testCtx) {
        setError("WebGL is not supported in this browser.");
        return;
      }

      setTerrainMode(mode);

      const scene = createScene();
      const renderer = createRenderer(canvas);
      rendererRef.current = renderer;
      const camera = createCamera();

      const character = createCharacter();
      scene.add(character);

      const chunkManager = new TerrainChunkManager(scene);
      const snowParticles = new SnowParticles(scene);

      // Splat backdrop
      const splatScene = new SplatScene(scene);
      if (sceneUrl) {
        splatScene.load(sceneUrl).then((ok) => {
          if (ok) console.log("Splat scene loaded");
        });
      }

      // VR HUD
      const vrHud = new VRHud();
      scene.add(vrHud.getGroup());
      vrHud.getGroup().visible = false; // hidden until VR is active

      // Check WebXR support
      checkXRSupport().then((supported) => {
        onVRSupported?.(supported);
      });

      // Game state
      const state = createGameState();
      state.phase = "playing";
      state.player.position.y = getTerrainHeight(0, 0);
      state.player.velocity.z = -5;

      const cleanupKeyboard = initKeyboardAdapter();

      // Shared render function used by both desktop and VR loops
      let lastTime = 0;
      let accumulator = 0;

      function gameRender(time: number) {
        if (lastTime === 0) {
          lastTime = time;
          return;
        }

        let rawDt = (time - lastTime) / 1000;
        lastTime = time;
        rawDt = Math.min(rawDt, CONFIG.maxDt);

        if (state.phase === "playing") {
          pollKeyboard();
          accumulator += rawDt;
          while (accumulator >= CONFIG.fixedDt) {
            updatePhysics(state.player, inputState, CONFIG.fixedDt);
            accumulator -= CONFIG.fixedDt;
          }
          state.time += rawDt;
          state.distance = Math.abs(state.player.position.z);
        }

        chunkManager.update(state.player.position.z);
        updateCharacter(character, state.player);
        updateCamera(camera, state.player);
        snowParticles.update(state.player, rawDt);

        // VR HUD follows camera when in VR
        if (renderer.xr.enabled && renderer.xr.isPresenting) {
          vrHud.getGroup().visible = true;
          vrHud.update(state, camera);
        } else {
          vrHud.getGroup().visible = false;
        }

        renderer.render(scene, camera);
        onStateUpdate?.(state);
      }

      // Desktop: use standard rAF loop
      let desktopRafId = 0;
      let useDesktopLoop = true;

      function desktopTick(time: number) {
        if (!useDesktopLoop) return;
        desktopRafId = requestAnimationFrame(desktopTick);
        gameRender(time);
      }
      desktopRafId = requestAnimationFrame(desktopTick);

      // Expose VR enter/exit on the renderer ref for the parent to call
      (renderer as any).__enterVR = () => {
        enterVR(
          renderer,
          (session) => {
            vrSessionRef.current = session;
            // Switch to Three.js XR animation loop
            useDesktopLoop = false;
            cancelAnimationFrame(desktopRafId);
            lastTime = 0;
            accumulator = 0;
            renderer.setAnimationLoop(gameRender);
          },
          () => {
            // VR session ended — switch back to desktop loop
            vrSessionRef.current = null;
            renderer.setAnimationLoop(null);
            useDesktopLoop = true;
            lastTime = 0;
            accumulator = 0;
            desktopRafId = requestAnimationFrame(desktopTick);
          }
        );
      };

      (renderer as any).__exitVR = () => {
        exitVR(vrSessionRef.current);
      };

      const onResize = () => handleResize(camera, renderer);
      window.addEventListener("resize", onResize);

      return () => {
        useDesktopLoop = false;
        cancelAnimationFrame(desktopRafId);
        renderer.setAnimationLoop(null);
        exitVR(vrSessionRef.current);
        cleanupKeyboard();
        window.removeEventListener("resize", onResize);
        chunkManager.dispose();
        snowParticles.dispose();
        splatScene.dispose();
        vrHud.dispose();
        renderer.dispose();
        scene.clear();
        rendererRef.current = null;
      };
    } catch (e) {
      console.error("Failed to initialize game:", e);
      setError(`Failed to initialize game engine: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [mode, sceneUrl, onStateUpdate, onVRSupported, restartKey]);

  useEffect(() => {
    setError(null);
    const cleanup = init();
    return cleanup;
  }, [init]);

  // Expose VR controls via ref
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      (canvas as any).__getRenderer = () => rendererRef.current;
    }
  });

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
      <canvas ref={canvasRef} id="game-canvas" className="fixed inset-0 w-full h-full" />
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
