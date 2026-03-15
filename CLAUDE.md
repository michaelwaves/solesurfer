# CLAUDE.md

## Project Overview

SoleSurfer is a WebXR snowboarding game controlled by BrilliantSole smart insoles. Four game modes: Halfpipe (trick scoring), Freeride (dodge trees), Gem Grab (endless runner), Immersive VR (freeride in WebXR). Built for a 24-hour hackathon.

## Tech Stack

- **Framework:** Next.js 16 + React 19 + TypeScript
- **3D Engine:** Raw Three.js (Halfpipe/Freeride) + React Three Fiber (Gem Grab)
- **Physics:** Custom physically-based engine (real gravity, snow friction, aero drag, trick scoring, braking)
- **Input:** BrilliantSole IMU via Web Bluetooth — pitch (turn), roll > +7° (jump), roll < -7° (brake). Keyboard fallback (A/D + Space)
- **Scene Gen:** World Labs API (Marble 0.1-mini) for Gaussian splat backdrops, cached locally in IndexedDB
- **Splat Render:** SparkJS (@sparkjsdev/spark) with SparkRenderer — 100k SPZ files
- **XR:** WebXR API (native Three.js support) for PICO headset. Immersive Mode auto-enters VR from mode select.
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
    config.ts             # Physics constants (slope 0.15, camera dist 6, fog 500-3000)
    physics.ts            # Snowboard physics + trick scoring + tree collision + braking
    terrain.ts            # Halfpipe + freeride terrain (flat slope, no bumps)
    state.ts              # Game state machine + trick state types
    loop.ts               # Fixed-timestep game loop
  input/                  # Input system
    input-state.ts        # Shared mutable ref (React writes, game loop reads)
    insole-adapter.ts     # BrilliantSole IMU → InputState (pitch=turn, roll=jump/brake)
    keyboard-adapter.ts   # Keyboard → InputState
  renderer/               # Three.js rendering
    scene.ts              # Scene, lights, fog
    camera.ts             # Halfpipe (fixed center) / freeride (chase) camera, far plane 5000
    character.ts          # 6ft snowboarder model
    chunks.ts             # Terrain chunk manager (ring buffer ≤64, 40 ahead) + trees
    particles.ts          # Rooster tail snow spray (≤200 particles)
    speed-lines.ts        # Velocity streaks at high speed
    splats.ts             # SparkJS Gaussian splat loader with SparkRenderer
    sound.ts              # Web Audio wind + carving
    vr-hud.ts             # VR HUD (canvas texture on plane)
    xr.ts                 # WebXR session management
  components/             # React UI
    GameCanvas.tsx         # Main game component (dynamic import, ssr: false)
    HUD.tsx               # Speed, score, trick feed, timer, wipeout/run-complete screens
    DebugOverlay.tsx       # Debug info (backtick toggle)
    InsolePanel.tsx        # BT connect + calibrate button on play page
    IMUPanel.tsx           # Live IMU telemetry + sensitivity slider + jump/brake indicators
    InsoleSection.tsx      # Landing page insole pairing (dynamic import)
    brilliantsole/        # Existing device pairing UI components
    game/                 # Gem Grab mode (R3F, self-contained)
  store/
    useGameStore.ts       # Zustand store for Gem Grab
  hooks/                  # React hooks
    useDevices.ts          # BS.DeviceManager subscriptions
    useDeviceState.ts      # Device property hooks
    useInsoleInput.ts      # Bridge: devices → insole adapter
    useSensorOrientation.ts # Gem Grab sensor hook (with calibration + recalibrate)
  lib/
    worldlabs.ts          # World Labs API client + IndexedDB scene caching
  context/                # React contexts for device state
```

## Key Patterns

- **Input mapping:** Pitch ±5° deadzone for turning (full turn at 45°). Roll > +7° triggers jump. Roll < -7° triggers progressive braking (up to 20 m/s²). IMU `gameRotation` quaternion → Three.js euler (YXZ). Auto-calibrated baseline on connect.
- **Input bridge:** React writes to shared `inputState` ref, game loop reads at 60Hz. No React in the hot path.
- **Terrain:** Flat slope (grade 0.15, ~8.5°). No bumps, moguls, or terrain launch. Jumps are player-initiated only. 40 chunks ahead (2000m visible).
- **Physics:** All forces time-scaled (framerate independent). Gravity projected onto slope via terrain normals. Jump lifts player 0.2m above terrain to ensure airborne detection. Jump force 5 m/s.
- **Braking:** Roll-based (< -7°). Progressive deceleration up to 20 m/s².
- **Trick scoring:** On landing: air time × 50 + max height × 20 + spin bonus. Named tricks: 180-1080.
- **Tree collision:** Freeride mode, radius-based against tree positions from terrain noise.
- **Splat rendering:** Requires SparkRenderer bound to WebGL renderer (same as Gem Grab). Splat follows camera each frame. Fog pushed back when splat loaded.
- **Scene caching:** Generated World Labs scenes cached in IndexedDB (SPZ binary) + localStorage (metadata). Reusable without API key.
- **WebXR:** Desktop uses rAF, VR uses `renderer.setAnimationLoop()`. Immersive Mode auto-enters VR from mode select. Same `gameRender()` function for both.
- **Two rendering systems:** Halfpipe/Freeride = raw Three.js. Gem Grab = React Three Fiber. Both coexist in the same Next.js app.
- **Gem Grab calibration:** useSensorOrientation hook has baseline calibration (30 samples) + recalibrate button in HUD.

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
