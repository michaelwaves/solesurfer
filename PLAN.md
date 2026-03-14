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
│  │                       │    │  └───────────┘  └────────────┘  │  │
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
│  │  │ (extends existing│  │ (A/D/W/S/Space)  │                   │  │
│  │  │  hooks/contexts) │  │                  │                   │  │
│  │  └──────────────────┘  └──────────────────┘                   │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
           │                                     │
     ┌─────▼─────┐                        ┌──────▼──────────┐
     │ Web BT    │                        │ World Labs API  │
     │ Insoles   │                        │ (pre-gen scenes)│
     └───────────┘                        └─────────────────┘
```

## Architecture Decisions

- **Keep Next.js 16** — existing project has working BrilliantSole integration. Don't rebuild.
- **Raw Three.js** — not React Three Fiber. React handles UI only. Easier backcountry-simulator port.
- **WebSpatial dropped** — incompatible with Three.js canvas (flattens to 2D panel). WebXR only for PICO.
- **Procedural terrain for physics** — World Labs splats are visual backdrop only. No GLB collision alignment.
- **100k splats** — for PICO mobile GPU with stereo WebXR rendering.
- **SparkJS** (`@sparkjsdev/spark`) — World Labs' official Three.js Gaussian splat renderer.
- **Shared mutable ref** for input — React hooks write insole state, game loop reads synchronously at 60Hz.
- **Vercel deployment** — stable HTTPS URL required for Web Bluetooth + WebXR.
- **API key in client JS** — accepted risk for hackathon. Use `.env` + `.gitignore`.

## Input Mapping: BrilliantSole → Snowboard Controls

| Insole Data | Game Action | How |
|---|---|---|
| Left insole pressure > Right | Turn left (toeside) | Pressure difference → edge angle |
| Right insole pressure > Left | Turn right (heelside) | Pressure difference → edge angle |
| Both insoles high pressure | Brake / pizza stop | Combined pressure sum → drag |
| Both insoles low pressure | Tuck / speed boost | Low total pressure → reduced drag |
| Sharp vertical acceleration (IMU) | Jump | `linearAcceleration.y` spike → jump trigger |
| Gyroscope spin while airborne | Trick spin | `gyroscope.z` → spin rotation |
| Center of pressure shift (toe/heel) | Forward/back lean | `pressureData.center.y` → weight distribution |

### Partial Insole Degradation
| State | Behavior |
|---|---|
| Both insoles connected | Full control (differential pressure + IMU) |
| One insole connected | Tilt/lean from single insole, no differential turning. Keyboard supplements missing axes. |
| No insoles connected | Full keyboard fallback (A/D/W/S/Space) |

## Phased Build Plan (Layered — Each Phase is Demo-Ready)

### Phase 1: Core Game Engine (Hours 0-8) ← MVP
**Goal:** Playable snowboard game in browser with BrilliantSole input

#### 1a. Project Setup (~30min)
- Install new dependencies in `frontend/`:
  ```bash
  npm install three @types/three @sparkjsdev/spark
  ```
- Add new directories:
  ```
  frontend/
    game/
      physics.ts          # Extracted from backcountry-simulator
      terrain.ts          # Procedural terrain (simplex noise)
      config.ts           # Game constants
      state.ts            # Game state machine + player state
      loop.ts             # Game loop (fixed timestep physics, vSync render)
    input/
      input-state.ts      # Shared mutable InputState ref
      insole-adapter.ts   # Maps BS sensor data → InputState (extends existing hooks)
      keyboard-adapter.ts # Maps keyboard → InputState (A/D/W/S/Space)
    renderer/
      scene.ts            # Three.js scene setup
      camera.ts           # Third-person camera
      character.ts        # Snowboarder model
      chunks.ts           # Terrain chunk rendering (ring buffer, ≤16 chunks)
      particles.ts        # Snow spray (≤200 particles, billboard sprites)
    components/
      GameCanvas.tsx       # "use client" wrapper, dynamic import (ssr: false)
      HUD.tsx             # Speed, score overlay (CSS overlay on canvas)
      DebugOverlay.tsx    # Toggleable debug info (backtick key)
    app/
      play/page.tsx       # Game page route (/play)
  ```
- Remove `brilliantsole-cloud` submodule and `.gitmodules`
- **Existing code reused as-is:** All `components/brilliantsole/*`, `hooks/*`, `context/*`

#### 1b. Extract Backcountry Physics (~2hr)
- Port `updatePhysics()`, `CONFIG`, `SimplexNoise`, `getProceduralHeight()` to TypeScript
- Remove all Three.js dependencies from physics (replace THREE.Vector3 with plain `{x,y,z}`)
- Keep the sidecut-radius carving model — it's the best part
- Port terrain chunk system and obstacle placement
- **Critical:** Add `Math.min(dt, 0.1)` clamp to prevent teleportation on alt-tab
- **Critical:** Add NaN guard — if any position/velocity is NaN, reset to last known good state
- **Test:** Physics runs headless with keyboard input, console-log position

#### 1c. BrilliantSole Sensor Integration (~1.5hr)
- Create `insole-adapter.ts` that:
  - Subscribes to sensor events on connected devices (pressure, linearAcceleration, gyroscope)
  - Configure sensors: `pressure: 20ms`, `linearAcceleration: 20ms`, `gyroscope: 20ms`
  - Maps sensor data → shared `InputState` ref:
    - Pressure differential → `turnInput` (-1 to +1)
    - Total pressure → `brakeInput` / `tuckInput`
    - IMU vertical spike → `jumpInput` (debounced)
    - Gyroscope Z → `trickSpin`
  - Handles partial insole connection (one insole = degraded control)
- Create `keyboard-adapter.ts` with same `InputState` interface
- **Reuses:** Existing device connection/pairing UI — no changes needed
- **Test:** Connect insoles, see mapped values in debug overlay

#### 1d. Three.js Renderer (~3hr)
- `GameCanvas.tsx`: dynamically imported with `next/dynamic` + `ssr: false`
- Scene setup: sky, fog, directional light, ambient light
- Terrain chunk rendering with vertex colors (port from backcountry sim)
  - Ring buffer of 12-16 chunks, recycle farthest when new one needed
- Procedural snowboarder character (port from backcountry sim)
- Third-person camera with smooth follow
- Snow spray particle system (≤200 particles, billboard sprites)
- Wire up: game loop reads InputState → physics tick → update character → update camera
- Debug overlay: FPS, physics dt, insole state, input values (toggle with backtick)
- **Test:** Playable snowboard game at `/play`

### Phase 2: World Labs Integration (Hours 8-14)
**Goal:** AI-generated mountain scenes as visual backdrop

#### 2a. Pre-Generate Scenes (~1hr, can run in background)
- Use World Labs API to generate 3-4 mountain scenes:
  - "Steep powder bowl in the Japanese Alps with fresh snowfall"
  - "Wide open alpine meadow above treeline with dramatic peaks"
  - "Narrow tree-lined backcountry chute with deep powder"
  - Upload a real mountain photo → generate from image
- Use `marble-0.1-mini` for speed (30 seconds each)
- Download **100k SPZ** (Gaussian splats) for PICO performance
- Store scene metadata (thumbnails, captions) for the scene picker

#### 2b. SparkJS Splat Rendering (~3hr)
- Integrate SparkJS (`@sparkjsdev/spark`) for Gaussian splat rendering
- `SparkRenderer` manages GPU-accelerated sorting (web worker)
- `SplatMesh` extends `THREE.Object3D` — add to existing Three.js scene
- Splats render as **visual backdrop only** — procedural terrain handles all physics
- Set `antialias: false` on `THREE.WebGLRenderer` (splats don't benefit, saves GPU)
- Error handling: if SPZ load fails (corrupt, OOM), fall back to procedural-only with toast
- **Test:** Ride procedural terrain with AI-generated mountain visible in background

#### 2c. Scene Selection UI (~2hr)
- "Choose Your Mountain" screen showing generated scene thumbnails + captions
- Option to generate a new scene from text prompt (show loading state, 60s timeout)
- Wrap API calls in try/catch — on any failure (401, 429, timeout), fall back to procedural with toast
- Store pre-generated scene assets in `public/scenes/` (bundled with deploy)
- **Test:** Pick a mountain → load it → ride it

### Phase 3: PICO WebXR Experience (Hours 14-20)
**Goal:** Immersive VR experience on PICO headset

#### 3a. WebXR Setup (~3hr)
- Add WebXR session support to Three.js renderer
- Use `XRSession.requestAnimationFrame` instead of standard rAF when in VR
- Configure VR button to enter immersive mode
- Adjust camera for VR (stereo rendering, head tracking)
- Scale the world appropriately for VR (1 unit = 1 meter)
- Handle session end gracefully (pause game, show re-enter button)
- **Test:** Put on headset → see the mountain → ride with insoles

#### 3b. VR HUD Overlays (~2hr)
- Speed/score as Three.js text rendered on a plane anchored to camera
- Or use `CSS2DRenderer` for HTML overlays in VR space
- Insole connection status indicator (green/yellow/red dot)
- Keep HUD minimal — VR real estate is precious
- **Test:** HUD visible and readable in VR

### Phase 4: Polish & Demo Prep (Hours 20-24)
**Goal:** Bulletproof demo, fallbacks, presentation

#### 4a. Demo Hardening (~2hr)
- Verify all fallback modes:
  - No insoles → keyboard controls
  - No headset → desktop browser mode
  - World Labs API down → procedural terrain fallback
  - WebGL context lost → show "reload" message
- Fix any visual bugs, tune camera, adjust physics feel
- Add a "demo mode" auto-run if all else fails
- Reduce/disable particles in WebXR if FPS < 72

#### 4b. Visual Polish (~1hr)
- Tune particle effects, snow spray
- Add speed lines / motion blur at high speed
- Sound effects (wind, carving) if time allows
- Smooth transitions between scenes

#### 4c. Presentation + Pre-Demo Verification (~1hr)
- Prepare the demo narrative:
  1. "Describe a mountain" → World Labs generates it (pre-cached, show the API call)
  2. Put on PICO headset → immersive mountain scene
  3. Step on insoles → "you ARE the snowboarder"
  4. Ride the mountain with your feet
- **Pre-demo verification checklist:**
  - [ ] Desktop + keyboard full playthrough (60 seconds)
  - [ ] Insole disconnect mid-play → keyboard takes over
  - [ ] Single insole connection → degraded control works
  - [ ] Alt-tab during play → no teleportation (dt clamp works)
  - [ ] World Labs fallback → block API, procedural loads
  - [ ] WebXR enter/exit → no crash
  - [ ] Scene switching → clean transition, no memory leak
- Test the full flow end-to-end 3 times
- Record a backup video in case of hardware failure

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
│                                                          │
│  3. Render (vSync / XR frame rate)                       │
│     - Update character mesh position/rotation            │
│     - Update camera follow                               │
│     - Update terrain chunks (ring buffer, ≤16 active)    │
│     - Update particle system (≤200 particles)            │
│     - SparkJS renders splat backdrop                     │
│     - Update HUD values                                  │
└─────────────────────────────────────────────────────────┘
```

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| BrilliantSole Bluetooth drops | Keyboard fallback always available; partial insole degradation |
| World Labs API slow/down | Pre-generate scenes, bundle in public/. Procedural terrain fallback on any API error. |
| PICO browser WebXR issues | Desktop browser demo still fully functional |
| Physics feel wrong with insoles | Tune CONFIG constants live; have preset "feels good" values |
| WebGL context lost | Show "reload page" message. Cannot recover without page reload. |
| Three.js SSR in Next.js | Dynamic import with `ssr: false`. Existing pattern in codebase. |
| Bundle size (Three.js ~600KB) | Dynamic import loads after initial page paint. User pairs insoles while game loads. |
| PICO GPU overload | 100k splats, ≤200 particles, ≤16 terrain chunks. Reduce particles if FPS < 72. |

## Tech Stack Summary

```
Framework:     Next.js 16 + React 19 + TypeScript
Styling:       Tailwind CSS v4
3D Engine:     Three.js (raw, not R3F)
Physics:       Custom (ported from backcountry-simulator)
Input:         BrilliantSole JS SDK (npm: brilliantsole)
Scene Gen:     World Labs API (Marble 0.1-mini)
Splat Render:  SparkJS (@sparkjsdev/spark) — 100k SPZ
XR:            WebXR API (native Three.js support)
Hosting:       Vercel (HTTPS required for Web BT + WebXR)
```

## Key Dependencies to Install

```bash
cd frontend
npm install three @types/three @sparkjsdev/spark
```

Existing deps (already installed): `brilliantsole`, `react`, `react-dom`, `next`, `tailwindcss`

## Pre-Hackathon Prep (Do Now)

1. [ ] Get World Labs API key from platform.worldlabs.ai
2. [ ] Pre-generate 3-4 mountain scenes via the API, download 100k SPZ files
3. [ ] Pair BrilliantSole insoles with your laptop, verify sensor data flows
4. [ ] Test PICO browser WebXR with a simple Three.js scene
5. [ ] Clone backcountry-simulator, study the physics code
6. [ ] Set up Vercel deployment, verify PICO browser loads the HTTPS URL
7. [ ] Verify Web Bluetooth works over HTTPS on deployed URL
8. [ ] Remove brilliantsole-cloud submodule
