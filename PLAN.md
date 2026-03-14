# SoleSurfer — Build Plan (24-Hour Hackathon)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    PICO Headset (WebXR)                  │
│  ┌───────────────────────────────────────────────────┐  │
│  │         WebSpatial UI Layer (React + Vite)        │  │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────────┐   │  │
│  │  │ Speed   │  │ Pressure │  │ World Labs     │   │  │
│  │  │ HUD     │  │ Heatmap  │  │ Scene Picker   │   │  │
│  │  └─────────┘  └──────────┘  └────────────────┘   │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │           Three.js WebXR Canvas                    │  │
│  │  ┌──────────────┐  ┌────────────────────────┐     │  │
│  │  │ Backcountry   │  │ World Labs Splats/Mesh │     │  │
│  │  │ Physics Engine│  │ (Visual Layer)         │     │  │
│  │  └──────┬───────┘  └────────────────────────┘     │  │
│  │         │                                          │  │
│  │  ┌──────▼───────┐                                  │  │
│  │  │ Snowboarder  │                                  │  │
│  │  │ Character    │                                  │  │
│  │  └──────────────┘                                  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │ Bluetooth
              ┌───────────┴───────────┐
              │   BrilliantSole SDK   │
              │  Left + Right Insoles │
              │  Pressure → Turn/Brake│
              │  IMU → Jump/Tricks    │
              └───────────────────────┘
```

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

## Phased Build Plan (Layered — Each Phase is Demo-Ready)

### Phase 1: Core Game Engine (Hours 0-8) ← MVP
**Goal:** Playable snowboard game in browser with BrilliantSole input

#### 1a. Project Scaffolding (~1hr)
- `npm create vite@latest` with React + TypeScript
- Install dependencies: `brilliantsole`, `three`, `@types/three`
- Install WebSpatial SDK: `@webspatial/react-sdk`, `@webspatial/vite-plugin`
- Set up project structure:
  ```
  src/
    main.tsx              # Entry point
    App.tsx               # Root component
    game/
      physics.ts          # Extracted from backcountry-simulator
      terrain.ts          # Procedural terrain (simplex noise)
      config.ts           # Game constants
      player.ts           # Player state type
    input/
      insole-manager.ts   # BrilliantSole connection + data mapping
      keyboard-fallback.ts # Keyboard controls for testing without insoles
    renderer/
      scene.ts            # Three.js scene setup
      camera.ts           # Third-person camera
      character.ts        # Snowboarder model
      chunks.ts           # Terrain chunk rendering
      particles.ts        # Snow spray effects
    ui/
      HUD.tsx             # Speed, score, pressure viz
      InsoleStatus.tsx    # Connection status + live pressure heatmap
      StartScreen.tsx     # Start/connect flow
  ```

#### 1b. Extract Backcountry Physics (~2hr)
- Port `updatePhysics()`, `CONFIG`, `SimplexNoise`, `getProceduralHeight()` to TypeScript
- Remove all Three.js dependencies from physics (replace THREE.Vector3 with plain objects)
- Keep the sidecut-radius carving model — it's the best part
- Port terrain chunk system and obstacle placement
- **Test:** Physics runs headless with keyboard input, console-log position

#### 1c. BrilliantSole Integration (~2hr)
- Create `InsoleManager` class:
  - Connect left + right insoles via `BS.DevicePair.insoles`
  - Configure sensors: `pressure: 20ms`, `linearAcceleration: 20ms`, `gyroscope: 20ms`
  - Map pressure differential → turn input (-1 to +1)
  - Map total pressure → brake/tuck state
  - Map IMU vertical spike → jump trigger
  - Expose as a simple `{ turnInput, brakeInput, tuckInput, jumpInput, trickSpin }` interface
- Create `KeyboardFallback` with same interface (A/D/W/S/Space)
- **Test:** Connect insoles, see mapped values in console

#### 1d. Three.js Renderer (~3hr)
- Scene setup: sky, fog, directional light, ambient light
- Terrain chunk rendering with vertex colors (port from backcountry sim)
- Procedural snowboarder character (port from backcountry sim)
- Third-person camera with smooth follow
- Snow spray particle system
- Wire up: physics tick → update character position → update camera
- **Test:** Playable snowboard game in browser window

### Phase 2: World Labs Integration (Hours 8-14)
**Goal:** AI-generated mountain scenes as visual environments

#### 2a. Pre-Generate Scenes (~1hr, can run in background)
- Use World Labs API to generate 3-4 mountain scenes:
  - "Steep powder bowl in the Japanese Alps with fresh snowfall"
  - "Wide open alpine meadow above treeline with dramatic peaks"
  - "Narrow tree-lined backcountry chute with deep powder"
  - Upload a real mountain photo → generate from image
- Use `marble-0.1-mini` for speed (30 seconds each)
- Download SPZ (Gaussian splats) + GLB (mesh) assets

#### 2b. Splat/Mesh Rendering (~3hr)
- Integrate World Labs Spark renderer (Three.js Gaussian splat renderer) OR load GLB meshes directly
- Option A (simpler): Use GLB mesh as terrain — extract heightmap from mesh for physics
- Option B (prettier): Render splats for visuals, use GLB mesh for collision heightmap
- Create a `WorldLabsScene` loader that swaps the procedural terrain for a generated one
- **Test:** Ride through an AI-generated mountain

#### 2c. Scene Selection UI (~2hr)
- "Choose Your Mountain" screen showing generated scene thumbnails
- Option to generate a new scene from text prompt (show loading state)
- Store generated worlds locally (IndexedDB or filesystem)
- **Test:** Pick a mountain → load it → ride it

### Phase 3: PICO XR Experience (Hours 14-20)
**Goal:** Immersive spatial experience on PICO headset

#### 3a. WebXR Setup (~3hr)
- Add WebXR session support to Three.js renderer
- Configure VR button to enter immersive mode
- Adjust camera for VR (stereo rendering, head tracking)
- Scale the world appropriately for VR (1 unit = 1 meter)
- Test on PICO browser with WebXR
- **Test:** Put on headset → see the mountain → ride with insoles

#### 3b. WebSpatial UI Panels (~3hr)
- Wrap the app with WebSpatial SDK
- Add `enable-xr` to HUD elements so they float as spatial panels:
  - Speed/score panel with `--xr-background-material: translucent`
  - Pressure heatmap panel showing live insole data
  - Scene picker as a separate spatial window
- Configure `manifest.webmanifest` with `xr_main_scene`
- **Test:** Spatial UI panels float alongside the 3D snowboard scene

### Phase 4: Polish & Demo Prep (Hours 20-24)
**Goal:** Bulletproof demo, fallbacks, presentation

#### 4a. Demo Hardening (~2hr)
- Add fallback modes:
  - No insoles? → keyboard controls
  - No headset? → desktop browser mode
  - World Labs API down? → procedural terrain fallback
- Fix any visual bugs, tune camera, adjust physics feel
- Add a "demo mode" auto-run if all else fails

#### 4b. Visual Polish (~1hr)
- Tune particle effects, snow spray
- Add speed lines / motion blur at high speed
- Sound effects (wind, carving) from backcountry sim's Web Audio setup
- Smooth transitions between scenes

#### 4c. Presentation (~1hr)
- Prepare the demo narrative:
  1. "Describe a mountain" → World Labs generates it (pre-cached, show the API call)
  2. Put on PICO headset → immersive mountain scene
  3. Step on insoles → "you ARE the snowboarder"
  4. Ride the mountain with your feet
- Test the full flow end-to-end 3 times
- Record a backup video in case of hardware failure

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| WebSpatial 3D embedding bugs | Fall back to WebXR-only (no spatial UI panels) — still works in PICO browser |
| BrilliantSole Bluetooth drops | Keyboard fallback always available; reconnection logic |
| World Labs API slow/down | Pre-generate scenes before hackathon; procedural terrain fallback |
| PICO browser WebXR issues | Desktop browser demo still fully functional |
| Physics feel wrong with insoles | Tune CONFIG constants live; have preset "feels good" values |

## Tech Stack Summary

```
Framework:     React + Vite + TypeScript
3D Engine:     Three.js (r160+)
Physics:       Custom (ported from backcountry-simulator)
Input:         BrilliantSole JS SDK (npm: brilliantsole)
Scene Gen:     World Labs API (Marble 0.1-mini)
Splat Render:  Spark.js or direct GLB loading
XR:            WebXR API (native Three.js support)
Spatial UI:    Pico WebSpatial SDK (@webspatial/react-sdk)
Audio:         Web Audio API
```

## Key Dependencies to Install

```bash
npm install brilliantsole three @types/three @react-three/fiber @react-three/drei
npm install @webspatial/react-sdk @webspatial/core-sdk
npm install -D @webspatial/builder @webspatial/vite-plugin
```

## Pre-Hackathon Prep (Do Now)

1. [ ] Get World Labs API key from platform.worldlabs.ai
2. [ ] Pre-generate 3-4 mountain scenes via the API
3. [ ] Pair BrilliantSole insoles with your laptop, verify data flows
4. [ ] Test PICO browser WebXR with a simple Three.js scene
5. [ ] Clone backcountry-simulator, study the physics code
