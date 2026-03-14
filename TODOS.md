# TODOS.md — SoleSurfer

## All Items Complete

### 1. Physics NaN guard + dt clamp — DONE
Implemented in `frontend/game/physics.ts`. NaN detection resets to last good state, dt clamped to 0.1s.

### 2. Insole disconnect graceful degradation — DONE
`InsolePanel` component detects disconnect and falls back to keyboard via `inputState.source`.

### 3. World Labs API error handling + procedural fallback — DONE
`frontend/lib/worldlabs.ts` wraps all API calls in try/catch. Scene select UI has "Skip" option for procedural-only.

### 4. Remove brilliantsole-cloud submodule — DONE
Removed dead submodule and `.gitmodules` file.

### 5. On-screen debug overlay — DONE
`frontend/components/DebugOverlay.tsx` toggled with backtick key. Shows FPS, position, velocity, input state.

### 6. Explicit game state machine — DONE
`frontend/game/state.ts` has `canTransition()`, `transitionPhase()` with valid transition map. Prevents invalid state changes.

### 7. WebGL context loss handling — DONE
`frontend/renderer/scene.ts` listens for `webglcontextlost`, shows reload overlay.

### 8. Sensor subscription error handling — DONE
`frontend/input/insole-adapter.ts` wraps `setSensorConfiguration()` in try/catch.

## Phase 4 Polish — Complete

- Speed lines at high speed — `frontend/renderer/speed-lines.ts`
- Wind + carving sound effects — `frontend/renderer/sound.ts` (Web Audio, procedural noise)
- Game state machine — `frontend/game/state.ts`
- All fallback modes verified: no insoles, no headset, no World Labs, WebGL lost

## Architecture Decisions (from CEO + Eng Reviews)

- **Keep Next.js 16** — existing project has working BrilliantSole integration
- **Raw Three.js** — not R3F. React handles UI only
- **WebSpatial dropped** — incompatible with Three.js canvas
- **Procedural terrain for physics** — World Labs splats are visual backdrop only
- **100k splats default** — for PICO mobile GPU with stereo WebXR rendering
- **SparkJS** (`@sparkjsdev/spark`) — World Labs' official Three.js splat renderer
- **Shared mutable ref** for input bridge — React hooks write, game loop reads
- **Game code in `frontend/game/` and `frontend/renderer/`**
- **Vercel deployment** — stable HTTPS URL for PICO browser
- **API key in client JS** — accepted risk for hackathon
- **Inter + JetBrains Mono fonts** — white/black/red Aspen-style theme
