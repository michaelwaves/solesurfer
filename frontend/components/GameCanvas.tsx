"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as THREE from "three";
import { createScene, createRenderer } from "@/renderer/scene";
import { createCamera, createCameraRig, updateCamera, handleResize } from "@/renderer/camera";
import { createCharacter, updateCharacter } from "@/renderer/character";
import { TerrainChunkManager } from "@/renderer/chunks";
import { SnowParticles } from "@/renderer/particles";
import { SpeedLines } from "@/renderer/speed-lines";
import { SplatScene } from "@/renderer/splats";
import { SoundManager } from "@/renderer/sound";
import { VRHud } from "@/renderer/vr-hud";
import { checkXRSupport, enterVR, exitVR } from "@/renderer/xr";
import { createGameState, GameState, GameMode, transitionPhase } from "@/game/state";
import { CONFIG } from "@/game/config";
import { updatePhysics } from "@/game/physics";
import { initKeyboardAdapter, pollKeyboard } from "@/input/keyboard-adapter";
import { inputState } from "@/input/input-state";
import { getTerrainHeight, setTerrainMode } from "@/game/terrain";

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

      // Camera rig for WebXR — head tracking is relative to this group
      createCameraRig(camera, scene);

      const chunkManager = new TerrainChunkManager(scene);
      const snowParticles = new SnowParticles(scene);
      const speedLines = new SpeedLines(scene);

      // Sound — init on first user interaction
      const sound = new SoundManager();
      const initSound = () => {
        sound.init();
        window.removeEventListener("keydown", initSound);
        window.removeEventListener("click", initSound);
      };
      window.addEventListener("keydown", initSound);
      window.addEventListener("click", initSound);

      // Splat environment
      const splatScene = new SplatScene(scene, renderer);
      if (sceneUrl) {
        splatScene.load(sceneUrl).then((ok) => {
          if (ok) {
            // Push fog back so it doesn't wash out the splat
            if (scene.fog instanceof THREE.Fog) {
              scene.fog.near = 200;
              scene.fog.far = 800;
            }
            console.log("Splat scene loaded");
          }
        });
      }

      // VR HUD
      const vrHud = new VRHud();
      scene.add(vrHud.getGroup());
      vrHud.getGroup().visible = false;

      checkXRSupport().then((supported) => {
        onVRSupported?.(supported);
      });

      // Game state (use state machine transitions)
      const state = createGameState();
      transitionPhase(state, "playing");
      state.player.position.y = getTerrainHeight(0, 0);
      state.player.velocity.z = -5;

      const cleanupKeyboard = initKeyboardAdapter();

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
            updatePhysics(state.player, inputState, CONFIG.fixedDt, state);
            accumulator -= CONFIG.fixedDt;
          }
          state.time += rawDt;
          state.distance = Math.abs(state.player.position.z);

          // Halfpipe run timer (60s runs)
          if (mode === "halfpipe") {
            state.runTimer -= rawDt;
            if (state.runTimer <= 0) {
              state.runTimer = 0;
              transitionPhase(state, "paused");
            }
          }
        }

        chunkManager.update(state.player.position.z);
        updateCharacter(character, state.player);
        const isVR = renderer.xr.enabled && renderer.xr.isPresenting;
        updateCamera(camera, state.player, isVR);
        splatScene.update(camera);
        snowParticles.update(state.player, rawDt);
        speedLines.update(state.player, camera, rawDt);
        sound.update(state.player);

        if (renderer.xr.enabled && renderer.xr.isPresenting) {
          vrHud.getGroup().visible = true;
          vrHud.update(state, camera);
        } else {
          vrHud.getGroup().visible = false;
        }

        renderer.render(scene, camera);
        onStateUpdate?.(state);
      }

      // Desktop loop
      let desktopRafId = 0;
      let useDesktopLoop = true;

      function desktopTick(time: number) {
        if (!useDesktopLoop) return;
        desktopRafId = requestAnimationFrame(desktopTick);
        gameRender(time);
      }
      desktopRafId = requestAnimationFrame(desktopTick);

      // VR enter/exit
      (renderer as any).__enterVR = () => {
        enterVR(
          renderer,
          (session) => {
            vrSessionRef.current = session;
            useDesktopLoop = false;
            cancelAnimationFrame(desktopRafId);
            lastTime = 0;
            accumulator = 0;
            renderer.setAnimationLoop(gameRender);
          },
          () => {
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
        window.removeEventListener("keydown", initSound);
        window.removeEventListener("click", initSound);
        chunkManager.dispose();
        snowParticles.dispose();
        speedLines.dispose();
        splatScene.dispose();
        sound.dispose();
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      (canvas as any).__getRenderer = () => rendererRef.current;
    }
  });

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white max-w-md px-6">
          <p className="text-xl font-bold mb-4">Unable to Start Game</p>
          <p className="text-[#707278] text-sm mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-red px-6 py-3 text-sm uppercase tracking-widest">
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
        className="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      >
        <div className="text-center text-white">
          <p className="text-xl font-bold mb-4">WebGL Context Lost</p>
          <button onClick={() => window.location.reload()} className="btn-red px-6 py-3 text-sm uppercase tracking-widest">
            Reload
          </button>
        </div>
      </div>
    </>
  );
}
