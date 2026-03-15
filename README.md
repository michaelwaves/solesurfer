# SoleSurfer

Snowboard with your feet. A WebXR snowboarding game controlled by BrilliantSole smart insoles, with AI-generated mountain backdrops from World Labs.

## What is this?

SoleSurfer turns your feet into a snowboard controller. BrilliantSole smart insoles track your foot orientation via IMU — lean forward/back to steer, stomp to jump. The game runs in the browser and optionally in VR on a PICO headset via WebXR.

World Labs AI generates 3D mountain scenes as Gaussian splat backdrops. The procedural terrain handles physics while the splats provide visual immersion.

## Features

- **Foot-controlled snowboarding** — BrilliantSole IMU pitch (lean forward/back) controls turning, vertical acceleration triggers jump
- **Three game modes** — Halfpipe (trick scoring, 60s timed runs), Freeride (dodge trees, terrain variation), Gem Grab (endless runner, collect gems)
- **Trick scoring** — Air time + height + spin = points. Named tricks: 180, 360, 540, 720, 1080, Big Air
- **AI-generated mountains** — World Labs Marble API creates 3D Gaussian splat scenes from text prompts
- **WebXR support** — Enter VR on PICO headset with stereo rendering, head tracking, and VR HUD
- **Physically-based physics** — Real gravity (9.81 m/s²), snow friction (μ=0.04), aerodynamic drag (½ρv²CdA), sidecut carving model
- **Procedural audio** — Wind and carving sounds via Web Audio (no external files)
- **Keyboard fallback** — A/D to carve, Space to jump. No insoles required.

## Getting Started

### Prerequisites

- Node.js 18+
- A modern browser with WebGL2 (Chrome, Firefox, Edge)
- Optional: BrilliantSole smart insoles (Web Bluetooth)
- Optional: PICO headset (WebXR)
- Optional: World Labs API key from [platform.worldlabs.ai](https://platform.worldlabs.ai)

### Install & Run

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page. Click **Drop In** to start.

### Deploy (required for Bluetooth + WebXR)

Web Bluetooth and WebXR require HTTPS. Deploy to Vercel:

```bash
cd frontend
npx vercel
```

Alternatively: use ngrok to open a tunnel from localhost and expose the port your server is running on to the internet
```bash
ngrok config add-authtoken your-auth-token
ngrok http 3000
```

### Controls

| Input | Action |
|---|---|
| A / Left Arrow | Carve left |
| D / Right Arrow | Carve right |
| Space | Jump |
| ` (backtick) | Toggle debug overlay |

With insoles connected, lean forward/back to steer and stomp to jump. Sensitivity adjustable via IMU panel in-game.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Next.js 16 App (Client-Side)                  │
│                                                                  │
│   React UI                    Three.js Game Canvas               │
│   ┌──────────────┐            ┌─────────────────────────────┐   │
│   │ Landing Page │            │ Procedural    SparkJS       │   │
│   │ Mode Select  │            │ Terrain       Gaussian      │   │
│   │ Scene Select │            │ (physics)     Splats        │   │
│   │ HUD / Debug  │            │               (visual)      │   │
│   └──────┬───────┘            │ Character   Snow Particles  │   │
│          │                    │ Camera      Speed Lines      │   │
│          │                    └──────────┬──────────────────┘   │
│          │                               │                      │
│   ┌──────▼───────────────────────────────▼──────────────────┐   │
│   │              Game Loop (rAF / XR rAF)                    │   │
│   │   Input ──▶ Physics (60Hz fixed) ──▶ Render (vSync)      │   │
│   └──────────────────────┬───────────────────────────────────┘   │
│                           │                                      │
│   ┌───────────────────────▼──────────────────────────────────┐   │
│   │  Input (shared mutable ref)                               │   │
│   │  ┌────────────────┐  ┌──────────────────┐                 │   │
│   │  │ Insole adapter │  │ Keyboard adapter │                 │   │
│   │  │ (IMU pitch)    │  │ (A/D + Space)    │                 │   │
│   │  └────────────────┘  └──────────────────┘                 │   │
│   └───────────────────────────────────────────────────────────┘   │
└──────────┬───────────────────────────────────┬───────────────────┘
           │                                   │
     ┌─────▼─────┐                      ┌──────▼──────────┐
     │ Web BT    │                      │ World Labs API  │
     │ Insoles   │                      │ Marble 0.1-mini │
     └───────────┘                      └─────────────────┘
```

## Project Structure

```
frontend/
  app/                    # Next.js routes
    page.tsx              # Landing page
    play/page.tsx         # Game (mode → scene → play)
  game/                   # Game engine (framework-agnostic)
    config.ts             # Physics constants
    physics.ts            # Snowboard physics + trick scoring
    terrain.ts            # Halfpipe + freeride terrain
    state.ts              # Game state machine + trick state
    loop.ts               # Fixed-timestep game loop
  input/                  # Input system
    input-state.ts        # Shared mutable ref
    insole-adapter.ts     # BrilliantSole IMU → game input (pitch = turn)
    keyboard-adapter.ts   # Keyboard → game input
  renderer/               # Three.js rendering
    scene.ts, camera.ts, character.ts, chunks.ts,
    particles.ts, speed-lines.ts, splats.ts,
    sound.ts, vr-hud.ts, xr.ts
  components/             # React UI
    GameCanvas.tsx         # Main game component
    HUD.tsx               # Speed, score, trick feed, timer, wipeout screen
    DebugOverlay.tsx, InsolePanel.tsx, IMUPanel.tsx
    brilliantsole/        # Device pairing UI
    game/                 # Gem Grab mode (R3F-based, self-contained)
  store/
    useGameStore.ts       # Zustand store for Gem Grab mode
  lib/
    worldlabs.ts          # World Labs API client
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 + React 19 + TypeScript |
| 3D Engine | Three.js (raw) + React Three Fiber (Gem Grab) |
| Physics | Custom (real gravity, snow friction, aero drag) |
| Input | BrilliantSole JS SDK (Web Bluetooth) |
| Scene Gen | World Labs API (Marble 0.1-mini, 100k SPZ) |
| Splat Render | SparkJS (@sparkjsdev/spark) |
| XR | WebXR API |
| Audio | Web Audio API (procedural) |
| State | Zustand (Gem Grab), vanilla (Halfpipe/Freeride) |
| Styling | Tailwind CSS v4 |
| Fonts | Inter + JetBrains Mono |
| Hosting | Vercel |

## Game Modes

### Halfpipe
Olympic-style superpipe with trick scoring. Carve wall-to-wall, ride up the transitions, launch off the lip. Camera stays centered on the pipe. **60-second timed runs** — score as many trick points as possible. Tricks scored on landing based on air time, height, and spin (180 through 1080).

### Freeride
Open mountain run with procedural terrain, pine trees, and terrain variation. Third-person chase camera follows behind the rider. **Dodge trees** (collision = wipeout), ride natural bumps that launch you at speed, navigate steeper sections that ramp up every ~150m.

### Gem Grab
Endless runner on an infinite slope. Steer left/right to dodge trees and rocks while collecting purple gems (+50 pts each). Speed increases over time up to 40 u/s. Uses React Three Fiber with a Gaussian splat mountain backdrop. Self-contained game system with Zustand state management.

## Insole Input

All three modes use the same insole mapping via BrilliantSole `gameRotation` sensor:

| IMU Data | Game Action | How |
|---|---|---|
| Pitch (lean forward/back) | Turn left/right | Pitch angle → edge angle → carve direction |
| Vertical acceleration spike | Jump / Ollie | `linearAcceleration.y` > threshold → jump |

**Auto-calibration:** On connect, the adapter averages 30 IMU samples (~0.6s) to establish a flat baseline. All input is relative to this baseline. Recalibrate button available in-game.

**Sensitivity:** Adjustable via IMU panel slider (0.3x to 3.0x) during gameplay.

**Deadzone:** 10 degrees — small tilts are ignored to prevent drift.

## Physics

The physics engine is physically based:

- **Gravity** is the only engine — projected onto the slope surface via terrain normals
- **Carving is braking** — edge angle increases snow friction. Flat base = fastest. No separate brake control.
- **Snow friction** — μ=0.04 (waxed base on packed snow), applied as deceleration = μg
- **Aerodynamic drag** — F = ½ρv²CdA, naturally limits terminal velocity
- **Sidecut carving** — turn radius = sidecut_radius / sin(edge_angle), matching real board geometry
- **Edge grip** — lateral force prevents sideslip, increases with edge angle
- **Trick scoring** — air time × 50 + max height × 20 + spin bonus (180-1080)
- **Tree collision** — freeride mode, radius-based collision detection
- **Terrain launch** — natural bumps launch the player when hit at speed
- **Terminal velocity** — 90 km/h (25 m/s)
- **NaN guard + dt clamp** — prevents physics explosion on alt-tab or bad input

## World Labs Integration

Generate AI-powered 3D mountain backdrops:

1. Enter your World Labs API key on the scene select screen
2. Describe a mountain ("Steep powder bowl in the Japanese Alps")
3. The API generates a 3D Gaussian splat scene (~30s with marble-0.1-mini)
4. SparkJS renders the 100k splats as a visual backdrop behind the procedural terrain

Or skip to ride on procedural-only terrain.

## WebXR (PICO)

On a WebXR-capable device:

1. Click **Enter VR** in the top-right
2. The game switches to stereo rendering with head tracking
3. VR HUD shows speed/distance on a canvas-textured plane attached to the camera
4. Insole input works the same — your feet control the board

Requires HTTPS (deploy to Vercel or use ngrok).

## License

Hackathon project.
