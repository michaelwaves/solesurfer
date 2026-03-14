import { CONFIG } from "./config";
import { GameState } from "./state";
import { inputState } from "@/input/input-state";
import { pollKeyboard } from "@/input/keyboard-adapter";
import { updatePhysics } from "./physics";

export type RenderCallback = (state: GameState, dt: number) => void;

export function createGameLoop(state: GameState, onRender: RenderCallback) {
  let accumulator = 0;
  let lastTime = 0;
  let animFrameId = 0;
  let running = false;

  function tick(time: number) {
    if (!running) return;
    animFrameId = requestAnimationFrame(tick);

    if (lastTime === 0) {
      lastTime = time;
      return;
    }

    let rawDt = (time - lastTime) / 1000;
    lastTime = time;

    // Clamp dt to prevent physics explosion on alt-tab
    rawDt = Math.min(rawDt, CONFIG.maxDt);

    if (state.phase === "playing") {
      // Poll keyboard input
      pollKeyboard();

      // Fixed timestep physics
      accumulator += rawDt;
      while (accumulator >= CONFIG.fixedDt) {
        updatePhysics(state.player, inputState, CONFIG.fixedDt);
        accumulator -= CONFIG.fixedDt;
      }

      state.time += rawDt;
      state.distance = Math.abs(state.player.position.z);
    }

    // Render every frame regardless of game phase
    onRender(state, rawDt);
  }

  return {
    start() {
      if (running) return;
      running = true;
      lastTime = 0;
      accumulator = 0;
      animFrameId = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(animFrameId);
    },
    getState() {
      return state;
    },
  };
}
