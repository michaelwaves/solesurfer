export type GamePhase = "menu" | "connecting" | "loading" | "playing" | "paused";
export type GameMode = "halfpipe" | "freeride";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface PlayerState {
  position: Vec3;
  velocity: Vec3;
  rotation: number; // Y-axis rotation (heading)
  edgeAngle: number; // current carving edge angle
  speed: number; // scalar speed
  airborne: boolean;
  airborneTime: number;
  trickRotation: number; // accumulated trick spin
  lastGoodPosition: Vec3;
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
  };
}

export interface GameState {
  phase: GamePhase;
  player: PlayerState;
  score: number;
  distance: number;
  time: number;
}

export function createGameState(): GameState {
  return {
    phase: "menu",
    player: createPlayerState(),
    score: 0,
    distance: 0,
    time: 0,
  };
}
