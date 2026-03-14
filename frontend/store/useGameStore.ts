import { create } from "zustand";

export type GamePhase = "idle" | "playing" | "dead";

export type QuatRaw = { x: number; y: number; z: number; w: number };

interface GameState {
  phase: GamePhase;
  // Sensor — euler
  boardRoll: number;
  boardPitch: number;
  boardYaw: number;
  // Sensor — raw quaternion
  quatRaw: QuatRaw;
  // World
  boardX: number;
  speed: number;
  distance: number;
  score: number;
  deviceConnected: boolean;

  setBoardRoll: (roll: number) => void;
  setBoardPitch: (pitch: number) => void;
  setBoardYaw: (yaw: number) => void;
  setQuatRaw: (q: QuatRaw) => void;
  setBoardX: (x: number) => void;
  setDeviceConnected: (v: boolean) => void;
  addScore: (pts: number) => void;
  startGame: () => void;
  killPlayer: () => void;
  resetGame: () => void;
  tick: (dt: number) => void;
}

const INITIAL_SPEED = 8;

export const useGameStore = create<GameState>((set, get) => ({
  phase: "idle",
  boardRoll: 0,
  boardPitch: 0,
  boardYaw: 0,
  quatRaw: { x: 0, y: 0, z: 0, w: 1 },
  boardX: 0,
  speed: INITIAL_SPEED,
  distance: 0,
  score: 0,
  deviceConnected: false,

  setBoardRoll: (boardRoll) => set({ boardRoll }),
  setBoardPitch: (boardPitch) => set({ boardPitch }),
  setBoardYaw: (boardYaw) => set({ boardYaw }),
  setQuatRaw: (quatRaw) => set({ quatRaw }),
  setBoardX: (boardX) => set({ boardX }),
  setDeviceConnected: (deviceConnected) => set({ deviceConnected }),
  addScore: (pts) => set({ score: get().score + pts }),

  startGame: () =>
    set({ phase: "playing", speed: INITIAL_SPEED, distance: 0, score: 0, boardX: 0 }),

  killPlayer: () => set({ phase: "dead" }),

  resetGame: () =>
    set({ phase: "idle", speed: INITIAL_SPEED, distance: 0, score: 0, boardX: 0 }),

  tick: (dt) => {
    const { speed, distance, score } = get();
    const nextSpeed = Math.min(speed + 0.4 * dt, 40);
    // 1 point per meter
    set({ speed: nextSpeed, distance: distance + speed * dt, score: score + speed * dt });
  },
}));
