# TODOS.md — SoleSurfer

## P1 — Must Do

### 1. Physics NaN guard + dt clamp
- **What:** Add `Math.min(dt, 0.1)` clamp and NaN detection/reset to physics update loop
- **Why:** NaN propagation (player flies to infinity) and dt spikes (alt-tab teleportation) are the #1 and #2 most common bugs when porting game physics
- **Effort:** S
- **Depends on:** Phase 1b physics port

### 2. Partial insole graceful degradation
- **What:** If only one insole connects or one disconnects mid-session, use remaining insole for limited control rather than producing erratic input
- **Why:** Bluetooth connections drop. One insole = tilt/lean only, fall back to keyboard for missing axes
- **Effort:** S
- **Depends on:** Phase 1c insole integration

### 3. World Labs API error handling + procedural fallback
- **What:** Wrap all World Labs API calls in try/catch. On any failure (401, 429, timeout, malformed): log error, show toast, fall back to procedural terrain
- **Why:** Pre-generated scenes reduce risk, but if cache is lost or API is called live, failures must not crash the demo
- **Effort:** S
- **Depends on:** Phase 2a World Labs integration

### 4. Remove brilliantsole-cloud submodule
- **What:** Remove the empty git submodule and `.gitmodules` file
- **Why:** The repo at github.com/zakaton/brilliantsole-cloud.git returns 404. Dead weight that confuses the project structure.
- **Effort:** S
- **Depends on:** Nothing — do before implementation starts

### 5. On-screen debug overlay
- **What:** Toggleable overlay (backtick key) showing: FPS, physics dt, insole connection state, raw input values, splat count, WebXR session state
- **Why:** #1 debugging tool when things break on stage. Can't use browser devtools on PICO headset.
- **Effort:** M
- **Depends on:** Phase 1d renderer

### 7. WebGL context loss handling
- **What:** Listen for `webglcontextlost` event on the canvas. Show a "Please reload the page" message instead of a black screen.
- **Why:** GPU OOM or browser resource reclamation kills the game silently. 5 lines of code prevents the worst demo failure mode.
- **Effort:** S
- **Depends on:** Phase 1d renderer

## P2 — Should Do

### 6. Explicit game state machine
- **What:** Define game states (menu → connecting → loading → playing → paused) with valid transitions. Each state knows what inputs it accepts and what UI it shows.
- **Why:** Without it, edge cases like 'enter VR while loading' or 'disconnect during play' have no structured handling. Implicit boolean flags create impossible-state bugs.
- **Effort:** M
- **Depends on:** Phase 1a project setup

### 8. Sensor subscription error handling
- **What:** Wrap insole sensor configuration in try/catch. On rejection (InvalidStateError), log warning and continue with available sensors.
- **Why:** Device can reject sensor config if sensors are already active or unsupported. Prevents crash during insole setup.
- **Effort:** S
- **Depends on:** Phase 1c insole integration

## Resolved (from plan reviews)

- ~~Update PLAN.md for WebSpatial removal~~ — Done. PLAN.md fully rewritten.
- ~~HTTPS hosting + pre-hackathon deployment~~ — Added to PLAN.md pre-hackathon checklist.

## Architecture Decisions (from CEO + Eng Reviews)

- **Keep Next.js 16** — existing project has working BrilliantSole integration. Don't rebuild with Vite.
- **Raw Three.js** — not R3F. React handles UI only. Easier backcountry-simulator port.
- **WebSpatial dropped** — incompatible with Three.js canvas (flattens to 2D panel). WebXR only for PICO.
- **Procedural terrain for physics** — World Labs splats are visual backdrop only. No GLB collision alignment.
- **100k splats default** — for PICO mobile GPU with stereo WebXR rendering.
- **SparkJS** (`@sparkjsdev/spark`) — World Labs' official Three.js Gaussian splat renderer.
- **Shared mutable ref** for input bridge — React hooks write insole state, game loop reads synchronously.
- **Game code in `frontend/game/` and `frontend/renderer/`** — peers to existing `components/`, `hooks/`.
- **Vercel deployment** — stable HTTPS URL for PICO browser.
- **API key in client JS** — accepted risk for hackathon. Use `.env` + `.gitignore`.
- **Dynamic import with `ssr: false`** for Three.js GameCanvas component.
- **Ring buffer of ≤16 terrain chunks** — prevents OOM on PICO.
- **≤200 particles** with billboard sprites — reduce/disable if FPS < 72 in WebXR.
