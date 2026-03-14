# CLAUDE.md

## Project Overview

SoleSurfer is a WebXR snowboarding game controlled by BrilliantSole smart insoles. Built for a 24-hour hackathon.

## Tech Stack

- **Framework:** Next.js 16 + React 19 + TypeScript
- **3D Engine:** Raw Three.js (not R3F) — React handles UI only
- **Physics:** Custom physically-based engine (real gravity, snow friction, aero drag)
- **Input:** BrilliantSole IMU (pitch/roll) via Web Bluetooth, keyboard fallback (A/D + Space)
- **Scene Gen:** World Labs API (Marble 0.1-mini) for Gaussian splat backdrops
- **Splat Render:** SparkJS (@sparkjsdev/spark) — 100k SPZ files
- **XR:** WebXR API (native Three.js support) for PICO headset
- **Sound:** Web Audio API (procedural wind + carving noise)
- **Styling:** Tailwind CSS v4, Inter + JetBrains Mono fonts
- **Hosting:** Vercel (HTTPS required for Web Bluetooth + WebXR)

## Architecture

```
frontend/
  app/                    # Next.js routes
    page.tsx              # Landing page (insole pairing + start)
    play/page.tsx         # Game page (mode select → scene select → play)
  game/                   # Game engine (framework-agnostic)
    config.ts             # Physics constants
    physics.ts            # Physically-based snowboard physics
    terrain.ts            # Halfpipe + freeride terrain (simplex noise)
    state.ts              # Game state machine with transition validation
    loop.ts               # Fixed-timestep game loop
  input/                  # Input system
    input-state.ts        # Shared mutable ref (React writes, game loop reads)
    insole-adapter.ts     # BrilliantSole IMU → InputState
    keyboard-adapter.ts   # Keyboard → InputState
  renderer/               # Three.js rendering
    scene.ts              # Scene, lights, fog
    camera.ts             # Halfpipe (fixed center) / freeride (chase) camera
    character.ts          # 6ft snowboarder model
    chunks.ts             # Terrain chunk manager (ring buffer ≤16)
    particles.ts          # Snow spray (≤200 particles)
    speed-lines.ts        # Velocity streaks at high speed
    splats.ts             # SparkJS Gaussian splat loader
    sound.ts              # Web Audio wind + carving
    vr-hud.ts             # VR HUD (canvas texture on plane)
    xr.ts                 # WebXR session management
  components/             # React UI
    GameCanvas.tsx         # Main game component (dynamic import, ssr: false)
    HUD.tsx               # Speed/distance overlay
    DebugOverlay.tsx       # Debug info (backtick toggle)
    InsolePanel.tsx        # BT connect button on play page
    brilliantsole/        # Existing device pairing UI
  hooks/                  # React hooks
    useDevices.ts          # BS.DeviceManager subscriptions
    useDeviceState.ts      # Device property hooks
    useInsoleInput.ts      # Bridge: devices → insole adapter
  lib/
    worldlabs.ts          # World Labs API client
  context/                # React contexts for device state
```

## Key Patterns

- **Input bridge:** React writes to shared `inputState` ref, game loop reads at 60Hz. No React in the hot path.
- **Terrain modes:** `setTerrainMode("halfpipe" | "freeride")` switches terrain generation globally before chunks render.
- **Physics:** All forces time-scaled (framerate independent). Gravity projected onto slope via `g * ny * nx/nz`. Carving = only speed control.
- **WebXR:** Desktop uses rAF, VR uses `renderer.setAnimationLoop()`. Same `gameRender()` function for both.

## Running

```bash
cd frontend && npm install && npm run dev
```

Game at `http://localhost:3000/play`. HTTPS required for Bluetooth/WebXR (use Vercel deploy or ngrok).

## gstack

For all web browsing, use the `/browse` skill from gstack. Never use `mcp__claude-in-chrome__*` tools.

Available skills:
- `/plan-ceo-review` - CEO-perspective plan review
- `/plan-eng-review` - Engineering plan review
- `/review` - Code review
- `/ship` - Ship code
- `/browse` - Web browsing
- `/qa` - QA testing
- `/setup-browser-cookies` - Set up browser cookies
- `/retro` - Retrospective

# currentDate
Today's date is 2026-03-14.
