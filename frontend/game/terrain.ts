import { CONFIG } from "./config";
import { GameMode } from "./state";

class SimplexNoise {
  private perm: number[];

  constructor(seed = 42) {
    this.perm = new Array(512);
    const p = new Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807 + 0) % 2147483647;
      const j = s % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }

  private grad2(hash: number, x: number, y: number): number {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -2 * v : 2 * v);
  }

  noise2D(x: number, y: number): number {
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = x - X0;
    const y0 = y - Y0;
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    const ii = i & 255;
    const jj = j & 255;
    let n0 = 0, n1 = 0, n2 = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 > 0) { t0 *= t0; n0 = t0 * t0 * this.grad2(this.perm[ii + this.perm[jj]], x0, y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 > 0) { t1 *= t1; n1 = t1 * t1 * this.grad2(this.perm[ii + i1 + this.perm[jj + j1]], x1, y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 > 0) { t2 *= t2; n2 = t2 * t2 * this.grad2(this.perm[ii + 1 + this.perm[jj + 1]], x2, y2); }
    return 70 * (n0 + n1 + n2);
  }
}

const noise = new SimplexNoise(42);

// Current mode — set before terrain generation
let currentMode: GameMode = "halfpipe";

export function setTerrainMode(mode: GameMode) {
  currentMode = mode;
}

export function getTerrainMode(): GameMode {
  return currentMode;
}

// Halfpipe dimensions
const PIPE_WIDTH = 10;
const PIPE_WALL_HEIGHT = 3.5;
const PIPE_LIP_WIDTH = 3;
const PIPE_TOTAL_HALF = PIPE_WIDTH / 2 + PIPE_LIP_WIDTH;

// Tree positions — deterministic from noise so they're consistent across chunks
export interface TreePosition {
  x: number;
  z: number;
  scale: number;
}

export function getTreesInRange(zMin: number, zMax: number): TreePosition[] {
  if (currentMode !== "freeride") return [];
  const trees: TreePosition[] = [];
  // Place trees in a grid with noise-based jitter
  const spacing = 8;
  const runWidth = 40;
  const safeZone = 3; // no trees within 3m of center line

  for (let gz = Math.floor(zMin / spacing) * spacing; gz < zMax; gz += spacing) {
    for (let gx = -runWidth; gx <= runWidth; gx += spacing) {
      // Noise-based jitter and probability
      const jx = noise.noise2D(gx * 0.7, gz * 0.7) * spacing * 0.4;
      const jz = noise.noise2D(gx * 0.3 + 100, gz * 0.3 + 100) * spacing * 0.4;
      const tx = gx + jx;
      const tz = gz + jz;

      // Skip trees too close to center (the rideable path)
      if (Math.abs(tx) < safeZone) continue;

      // Probability — denser at edges, sparser near center
      const density = noise.noise2D(tx * 0.1 + 200, tz * 0.1 + 200);
      if (density < 0.1) continue;

      const scale = 0.8 + noise.noise2D(tx * 0.5 + 300, tz * 0.5 + 300) * 0.4;
      trees.push({ x: tx, z: tz, scale: Math.max(0.5, scale) });
    }
  }
  return trees;
}

function getHalfpipeHeight(x: number, z: number): number {
  const slope = z * CONFIG.slopeGrade;
  const absX = Math.abs(x);
  let pipeProfile = 0;

  if (absX <= PIPE_WIDTH / 2) {
    pipeProfile = 0;
  } else if (absX <= PIPE_TOTAL_HALF) {
    const t = (absX - PIPE_WIDTH / 2) / PIPE_LIP_WIDTH;
    pipeProfile = PIPE_WALL_HEIGHT * (1 - Math.cos(t * Math.PI / 2));
  } else {
    // Beyond the lip — gentle rise, no harsh wall
    const beyondLip = absX - PIPE_TOTAL_HALF;
    pipeProfile = PIPE_WALL_HEIGHT + beyondLip * 0.3;
  }

  return slope + pipeProfile;
}

function getFreerideHeight(x: number, z: number): number {
  const slope = z * CONFIG.slopeGrade;
  return slope;
}

export function getTerrainHeight(x: number, z: number): number {
  if (currentMode === "halfpipe") {
    return getHalfpipeHeight(x, z);
  }
  return getFreerideHeight(x, z);
}

export function getTerrainNormal(x: number, z: number): { x: number; y: number; z: number } {
  const eps = 0.5;
  const hL = getTerrainHeight(x - eps, z);
  const hR = getTerrainHeight(x + eps, z);
  const hD = getTerrainHeight(x, z - eps);
  const hU = getTerrainHeight(x, z + eps);

  const nx = hL - hR;
  const ny = 2 * eps;
  const nz = hD - hU;
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

  return { x: nx / len, y: ny / len, z: nz / len };
}
