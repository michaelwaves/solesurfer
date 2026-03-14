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

### 3. Update PLAN.md for WebSpatial removal
- **What:** Remove WebSpatial from architecture diagram, rewrite Phase 3b to use Three.js HUD overlays, update dependency list
- **Why:** WebSpatial is architecturally incompatible with Three.js canvas rendering (canvas content flattened to 2D panel). Decision made during CEO review.
- **Effort:** S
- **Depends on:** Nothing — do before implementation starts

### 4. HTTPS hosting + pre-hackathon deployment
- **What:** Set up Vercel/Netlify deployment. Add to pre-hackathon checklist: deploy to HTTPS, verify PICO browser loads the URL, verify Web Bluetooth and WebXR work over HTTPS
- **Why:** Web Bluetooth and WebXR both require secure context (HTTPS). Plan's pre-hackathon checklist was missing this.
- **Effort:** S
- **Depends on:** Phase 1a scaffolding (need a project to deploy)

### 5. On-screen debug overlay
- **What:** Toggleable overlay (backtick key) showing: FPS, physics dt, insole connection state, raw input values, splat count, WebXR session state
- **Why:** #1 debugging tool when things break on stage. Can't use browser devtools on PICO headset.
- **Effort:** M
- **Depends on:** Phase 1d renderer

### 7. World Labs API error handling + procedural fallback
- **What:** Wrap all World Labs API calls in try/catch. On any failure (401, 429, timeout, malformed): log error, show toast, fall back to procedural terrain
- **Why:** Pre-generated scenes reduce risk, but if cache is lost or API is called live, failures must not crash the demo
- **Effort:** S
- **Depends on:** Phase 2a World Labs integration

## P2 — Should Do

### 6. Explicit game state machine
- **What:** Define game states (menu → connecting → loading → playing → paused) with valid transitions. Each state knows what inputs it accepts and what UI it shows.
- **Why:** Without it, edge cases like 'enter VR while loading' or 'disconnect during play' have no structured handling. Implicit boolean flags create impossible-state bugs.
- **Effort:** M
- **Depends on:** Phase 1a scaffolding

## Architecture Decisions (from CEO Review)

- **WebSpatial dropped** — incompatible with Three.js. Using WebXR only for PICO.
- **Raw Three.js** — not R3F. React handles UI only. Easier backcountry-simulator port.
- **Procedural terrain for physics** — World Labs splats are visual backdrop only. No GLB collision alignment issues.
- **100k splats default** — for PICO mobile GPU with stereo WebXR rendering.
- **API key in client JS** — accepted risk for hackathon. Use .env + .gitignore.
- **Vercel/Netlify deployment** — stable HTTPS URL for PICO browser.
- **SparkJS** (@sparkjsdev/spark) — World Labs' official Three.js splat renderer.
