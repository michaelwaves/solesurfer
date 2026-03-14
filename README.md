# SoleSurfer

Snowboard with your feet. A WebXR snowboarding game controlled by BrilliantSole smart insoles, with AI-generated mountain backdrops from World Labs.

## What is this?

SoleSurfer turns your feet into a snowboard controller. BrilliantSole smart insoles track your foot orientation via IMU — roll to carve, lean to control speed, stomp to jump. The game runs in the browser and optionally in VR on a PICO headset via WebXR.

World Labs AI generates 3D mountain scenes as Gaussian splat backdrops. The procedural terrain handles physics while the splats provide visual immersion.

## Features

- **Foot-controlled snowboarding** — BrilliantSole IMU maps roll → turning, pitch → speed, vertical acceleration → jump
- **Two game modes** — Halfpipe (carve wall-to-wall, launch off the lip) and Freeride (open mountain with trees to dodge)
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

### Controls

| Input | Action |
|---|---|
| A / Left Arrow | Carve left |
| D / Right Arrow | Carve right |
| Space | Jump |
| ` (backtick) | Toggle debug overlay |

With insoles connected, roll your foot to carve and stomp to jump.

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
│   │  │ (IMU roll/pitch)│  │ (A/D + Space)    │                 │   │
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
    physics.ts            # Snowboard physics
    terrain.ts            # Halfpipe + freeride terrain
    state.ts              # Game state machine
    loop.ts               # Fixed-timestep game loop
  input/                  # Input system
    input-state.ts        # Shared mutable ref
    insole-adapter.ts     # BrilliantSole IMU → game input
    keyboard-adapter.ts   # Keyboard → game input
  renderer/               # Three.js rendering
    scene.ts, camera.ts, character.ts, chunks.ts,
    particles.ts, speed-lines.ts, splats.ts,
    sound.ts, vr-hud.ts, xr.ts
  components/             # React UI
    GameCanvas.tsx         # Main game component
    HUD.tsx, DebugOverlay.tsx, InsolePanel.tsx
    brilliantsole/        # Device pairing UI
  lib/
    worldlabs.ts          # World Labs API client
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 + React 19 + TypeScript |
| 3D Engine | Three.js (raw, not React Three Fiber) |
| Physics | Custom (real gravity, snow friction, aero drag) |
| Input | BrilliantSole JS SDK (Web Bluetooth) |
| Scene Gen | World Labs API (Marble 0.1-mini, 100k SPZ) |
| Splat Render | SparkJS (@sparkjsdev/spark) |
| XR | WebXR API |
| Audio | Web Audio API (procedural) |
| Styling | Tailwind CSS v4 |
| Fonts | Inter + JetBrains Mono |
| Hosting | Vercel |

## Game Modes

### Halfpipe
Olympic-style superpipe. Carve wall-to-wall, ride up the transitions, launch off the lip. Camera stays centered on the pipe for a broadcast-style view. Gravity on the curved walls naturally redirects you.

### Freeride
Open mountain run with procedural terrain and pine trees. Third-person chase camera follows behind the rider. Dodge trees, carve through powder, ride the natural terrain features.

## Physics

The physics engine is physically based:

- **Gravity** is the only engine — projected onto the slope surface via terrain normals
- **Carving is braking** — edge angle increases snow friction. Flat base = fastest. No separate brake control.
- **Snow friction** — μ=0.04 (waxed base on packed snow), applied as deceleration = μg
- **Aerodynamic drag** — F = ½ρv²CdA, naturally limits terminal velocity
- **Sidecut carving** — turn radius = sidecut_radius / sin(edge_angle), matching real board geometry
- **Edge grip** — lateral force prevents sideslip, increases with edge angle
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
