# CLAUDE.md

## Project Overview

SoleSurfer is a WebXR snowboarding game controlled by BrilliantSole smart insoles. Three game modes: Halfpipe (trick scoring), Freeride (dodge trees), Gem Grab (endless runner). Built for a 24-hour hackathon.

## Tech Stack

- **Framework:** Next.js 16 + React 19 + TypeScript
- **3D Engine:** Raw Three.js (Halfpipe/Freeride) + React Three Fiber (Gem Grab)
- **Physics:** Custom physically-based engine (real gravity, snow friction, aero drag, trick scoring)
- **Input:** BrilliantSole IMU pitch (lean forward/back = turn) via Web Bluetooth, keyboard fallback (A/D + Space)
- **Scene Gen:** World Labs API (Marble 0.1-mini) for Gaussian splat backdrops
- **Splat Render:** SparkJS (@sparkjsdev/spark) — 100k SPZ files
- **XR:** WebXR API (native Three.js support) for PICO headset
- **Sound:** Web Audio API (procedural wind + carving noise)
- **State:** Zustand (Gem Grab), vanilla state machine (Halfpipe/Freeride)
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
    physics.ts            # Snowboard physics + trick scoring + tree collision
    terrain.ts            # Halfpipe + freeride terrain (simplex noise)
    state.ts              # Game state machine + trick state types
    loop.ts               # Fixed-timestep game loop
  input/                  # Input system
    input-state.ts        # Shared mutable ref (React writes, game loop reads)
    insole-adapter.ts     # BrilliantSole IMU → InputState (pitch = turn)
    keyboard-adapter.ts   # Keyboard → InputState
  renderer/               # Three.js rendering
    scene.ts              # Scene, lights, fog
    camera.ts             # Halfpipe (fixed center) / freeride (chase) camera
    character.ts          # 6ft snowboarder model
    chunks.ts             # Terrain chunk manager (ring buffer ≤16) + trees
    particles.ts          # Rooster tail snow spray (≤200 particles)
    speed-lines.ts        # Velocity streaks at high speed
    splats.ts             # SparkJS Gaussian splat loader
    sound.ts              # Web Audio wind + carving
    vr-hud.ts             # VR HUD (canvas texture on plane)
    xr.ts                 # WebXR session management
  components/             # React UI
    GameCanvas.tsx         # Main game component (dynamic import, ssr: false)
    HUD.tsx               # Speed, score, trick feed, timer, wipeout/run-complete screens
    DebugOverlay.tsx       # Debug info (backtick toggle)
    InsolePanel.tsx        # BT connect + calibrate button on play page
    IMUPanel.tsx           # Live IMU telemetry + sensitivity slider
    InsoleSection.tsx      # Landing page insole pairing (dynamic import)
    brilliantsole/        # Existing device pairing UI components
    game/                 # Gem Grab mode (R3F, self-contained)
  store/
    useGameStore.ts       # Zustand store for Gem Grab
  hooks/                  # React hooks
    useDevices.ts          # BS.DeviceManager subscriptions
    useDeviceState.ts      # Device property hooks
    useInsoleInput.ts      # Bridge: devices → insole adapter
    useSensorOrientation.ts # Gem Grab sensor hook
  lib/
    worldlabs.ts          # World Labs API client
  context/                # React contexts for device state
```

## Key Patterns

- **Input:** All modes use pitch (lean forward/back) for steering, matching Gem Grab. IMU `gameRotation` quaternion → Three.js euler (YXZ) → pitch axis. Auto-calibrated baseline on connect.
- **Input bridge:** React writes to shared `inputState` ref, game loop reads at 60Hz. No React in the hot path.
- **Terrain modes:** `setTerrainMode("halfpipe" | "freeride")` switches terrain generation globally before chunks render.
- **Physics:** All forces time-scaled (framerate independent). Gravity projected onto slope via `g * ny * nx/nz`. Carving = only speed control.
- **Trick scoring:** On landing: air time × 50 + max height × 20 + spin bonus. Named tricks: 180-1080.
- **Tree collision:** Freeride mode, radius-based against tree positions from terrain noise.
- **WebXR:** Desktop uses rAF, VR uses `renderer.setAnimationLoop()`. Same `gameRender()` function for both.
- **Two rendering systems:** Halfpipe/Freeride = raw Three.js. Gem Grab = React Three Fiber. Both coexist in the same Next.js app.

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
