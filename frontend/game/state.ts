export type GamePhase = "menu" | "connecting" | "loading" | "playing" | "paused";
export type GameMode = "halfpipe" | "freeride" | "gem_grab";

const VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  menu: ["loading", "playing"],
  connecting: ["loading", "menu"],
  loading: ["playing", "menu"],
  playing: ["paused", "menu"],
  paused: ["playing", "menu"],
};

export function canTransition(from: GamePhase, to: GamePhase): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionPhase(state: GameState, to: GamePhase): boolean {
  if (canTransition(state.phase, to)) {
    state.phase = to;
    return true;
  }
  console.warn(`Invalid state transition: ${state.phase} → ${to}`);
  return false;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface TrickState {
  name: string;
  points: number;
  timestamp: number;
}

export interface PlayerState {
  position: Vec3;
  velocity: Vec3;
  rotation: number;
  edgeAngle: number;
  speed: number;
  airborne: boolean;
  airborneTime: number;
  trickRotation: number;
  lastGoodPosition: Vec3;
  // Trick tracking
  maxAirHeight: number;
  totalSpinInAir: number;
  lastTrick: TrickState | null;
  // Collision
  crashed: boolean;
}

export function createPlayerState(): PlayerState {
  return {
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: -0.1 },
    rotation: 0,
    edgeAngle: 0,
    speed: 0,
    airborne: false,
    airborneTime: 0,
    trickRotation: 0,
    lastGoodPosition: { x: 0, y: 0, z: 0 },
    maxAirHeight: 0,
    totalSpinInAir: 0,
    lastTrick: null,
    crashed: false,
  };
}

export interface GameState {
  phase: GamePhase;
  player: PlayerState;
  score: number;
  trickScore: number;
  distance: number;
  time: number;
  runTimer: number;         // seconds remaining (halfpipe mode)
  trickFeed: TrickState[];  // recent tricks for display
}

export function createGameState(): GameState {
  return {
    phase: "menu",
    player: createPlayerState(),
    score: 0,
    trickScore: 0,
    distance: 0,
    time: 0,
    runTimer: 60,
    trickFeed: [],
  };
}
