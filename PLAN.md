# SoleSurfer — Build Plan (24-Hour Hackathon)

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                    Next.js 16 App (Client-Side)                      │
│                                                                      │
│  ┌───────────────────────┐    ┌──────────────────────────────────┐  │
│  │  React UI (existing)  │    │  Three.js Game Canvas            │  │
│  │                       │    │  (dynamic import, ssr: false)    │  │
│  │  - Device pairing ✓   │    │                                  │  │
│  │  - Connection status ✓│    │  ┌───────────┐  ┌────────────┐  │  │
│  │  - Battery display ✓  │    │  │ Procedural│  │ SparkJS    │  │  │
│  │  - BT not-supported ✓ │    │  │ Terrain   │  │ 100k Splats│  │  │
│  │                       │    │  │ (physics) │  │ (visual)   │  │  │
│  │  NEW:                 │    │  └─────┬─────┘  └────────────┘  │  │
│  │  - HUD overlay        │    │        │                         │  │
│  │  - Scene picker       │    │  ┌─────▼─────┐  ┌────────────┐  │  │
│  │  - Start screen       │    │  │ Character │  │ Particles  │  │  │
│  │  - Debug overlay      │    │  │ + Camera  │  │ (≤200)     │  │  │
│  │  - IMU telemetry      │    │  └───────────┘  └────────────┘  │  │
│  └───────────┬───────────┘    └──────────┬───────────────────────┘  │
│              │                            │                          │
│  ┌───────────▼────────────────────────────▼──────────────────────┐  │
│  │                    Game Loop (rAF / XR rAF)                   │  │
│  │  Input Manager ──▶ Physics (fixed 60Hz) ──▶ Renderer (vSync) │  │
│  └──────────────────────────┬────────────────────────────────────┘  │
│                              │                                      │
│  ┌───────────────────────────▼──────────────────────────────────┐  │
│  │  Input Manager (shared mutable ref)                           │  │
│  │  ┌──────────────────┐  ┌──────────────────┐                   │  │
│  │  │ Insole adapter   │  │ Keyboard adapter │  ← same interface │  │
│  │  │ pitch=turn       │  │ (A/D/Space)      │                   │  │
│  │  │ roll>7°=jump     │  │                  │                   │  │
│  │  │ roll<-7°=brake   │  │                  │                   │  │
│  │  └──────────────────┘  └──────────────────┘                   │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
           │                                     │
     ┌─────▼─────┐                        ┌──────▼──────────┐
     │ Web BT    │                        │ World Labs API  │
     │ Insoles   │                        │ (cached in IDB) │
     └───────────┘                        └─────────────────┘
```

## Architecture Decisions

- **Keep Next.js 16** — existing project has working BrilliantSole integration. Don't rebuild.
- **Raw Three.js** for Halfpipe/Freeride — React handles UI only. **React Three Fiber** for Gem Grab (self-contained).
- **WebSpatial dropped** — incompatible with Three.js canvas (flattens to 2D panel). WebXR only for PICO.
- **Procedural terrain for physics** — World Labs splats are visual backdrop only. No GLB collision alignment.
- **100k splats** — for PICO mobile GPU with stereo WebXR rendering.
- **SparkJS** (`@sparkjsdev/spark`) — World Labs' official Three.js Gaussian splat renderer. Requires SparkRenderer.
- **Pitch for steering** — lean forward/back to turn. Roll for jump (+7°) and brake (-7°).
- **gameRotation sensor** — quaternion via `sensorData` event, converted to euler (YXZ) with Three.js. Auto-calibrated baseline.
- **Shared mutable ref** for input — React hooks write insole state, game loop reads synchronously at 60Hz.
- **Flat terrain** — no bumps/moguls. Gentle slope (0.15 grade, ~8.5°). Jumps are player-initiated only.
- **Scene caching** — World Labs SPZ cached in IndexedDB, metadata in localStorage. No re-generation needed.
- **Immersive Mode** — selectable from mode menu, auto-enters WebXR VR on PICO.
- **Vercel deployment** — stable HTTPS URL required for Web Bluetooth + WebXR.

## Input Mapping: BrilliantSole → Snowboard Controls

| IMU Motion | Game Action | Threshold |
|---|---|---|
| Pitch (lean forward/back) | Turn left/right | ±5° deadzone, full at 45° |
| Roll > +7° (tilt right) | Jump | Player lifted 0.2m, force 5 m/s |
| Roll < -7° (tilt left) | Brake | Progressive up to 20 m/s² decel |

### Insole Degradation
| State | Behavior |
|---|---|
| Insole connected | Pitch → turn, roll → jump/brake. Auto-calibrated on connect. |
| No insole connected | Keyboard fallback (A/D → turn, Space → jump) |

## Completed Features

### Phase 1: Core Game Engine ✅
- [x] Physics engine: gravity, friction, drag, carving, trick scoring
- [x] Terrain: halfpipe geometry + freeride flat slope with trees
- [x] Three.js renderer: character, chunks, camera, particles, speed lines
- [x] BrilliantSole IMU integration: pitch=turn, roll=jump/brake
- [x] Keyboard fallback (A/D + Space)
- [x] NaN guard + dt clamp
- [x] Fixed-timestep game loop (60Hz)

### Phase 2: World Labs Integration ✅
- [x] World Labs API client (Marble 0.1-mini)
- [x] SparkJS splat rendering with SparkRenderer
- [x] Scene selection UI with generate/skip options
- [x] SPZ caching in IndexedDB (reuse without API key)
- [x] Splat follows camera each frame
- [x] Fog pushed back when splat loaded

### Phase 3: WebXR + Immersive Mode ✅
- [x] WebXR session management (enter/exit VR)
- [x] Immersive Mode in mode select (auto-enters VR)
- [x] VR HUD (canvas texture on plane)
- [x] Stereo rendering + head tracking on PICO

### Phase 4: Polish ✅
- [x] Flat terrain (no bumps/moguls, no unforced jumps)
- [x] Roll-based jump (+7°) and brake (-7°)
- [x] Stronger braking (20 m/s²)
- [x] Jump physics fix (lift 0.2m above terrain for airborne detection)
- [x] Extended terrain visibility (40 chunks ahead, 2000m)
- [x] Gentle slope grade (0.15, ~8.5°)
- [x] Closer camera (distance 6m, height 3m)
- [x] IMU panel: roll bar, jump/brake indicators
- [x] Gem Grab: calibration + recalibrate button
- [x] Procedural audio (wind + carving)
- [x] Speed lines at high velocity
- [x] Debug overlay (backtick toggle)
- [x] WebGL context loss handling

## Game Loop Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    requestAnimationFrame                  │
│              (or XRSession.requestAnimationFrame)         │
│                                                          │
│  1. Read InputState ref (shared mutable, written by      │
│     React insole adapter or keyboard adapter)            │
│                                                          │
│  2. Physics update (fixed 60Hz timestep)                 │
│     - dt = Math.min(rawDt, 0.1)  ← prevents teleport    │
│     - if (isNaN(pos.x)) reset()  ← prevents fly-away    │
│     - accumulator pattern for fixed timestep             │
│     - Roll > +7° → jump (lift 0.2m off terrain)          │
│     - Roll < -7° → brake (up to 20 m/s²)                │
│                                                          │
│  3. Render (vSync / XR frame rate)                       │
│     - Update character mesh position/rotation            │
│     - Update camera follow                               │
│     - Update terrain chunks (ring buffer, ≤64 active)    │
│     - Update splat position (follow camera)              │
│     - Update particle system (≤200 particles)            │
│     - SparkRenderer renders splat backdrop                │
│     - Update HUD values                                  │
└─────────────────────────────────────────────────────────┘
```

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| BrilliantSole Bluetooth drops | Keyboard fallback always available; partial insole degradation |
| World Labs API slow/down | Scene cached in IndexedDB. Procedural terrain fallback on any API error. |
| PICO browser WebXR issues | Desktop browser demo still fully functional |
| Physics feel wrong with insoles | Tune CONFIG constants live; IMU sensitivity slider (0.3x-3.0x) |
| WebGL context lost | Show "reload page" message. Cannot recover without page reload. |
| Three.js SSR in Next.js | Dynamic import with `ssr: false`. Existing pattern in codebase. |
| PICO GPU overload | 100k splats, ≤200 particles, ≤64 terrain chunks. |

## Tech Stack Summary

```
Framework:     Next.js 16 + React 19 + TypeScript
Styling:       Tailwind CSS v4
3D Engine:     Three.js (raw) + React Three Fiber (Gem Grab)
Physics:       Custom (gravity, friction, drag, braking, trick scoring)
Input:         BrilliantSole JS SDK (npm: brilliantsole)
Scene Gen:     World Labs API (Marble 0.1-mini), cached in IndexedDB
Splat Render:  SparkJS (@sparkjsdev/spark) with SparkRenderer — 100k SPZ
XR:            WebXR API (Immersive Mode + toggle)
Audio:         Web Audio API (procedural wind + carving)
Hosting:       Vercel (HTTPS required for Web BT + WebXR)
```
