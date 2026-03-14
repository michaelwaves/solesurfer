# Solesurfer — 3D Snowboarding Game Plan

## Concept

An infinite-runner snowboarding game rendered in 3D (React Three Fiber) where the player
physically tilts their feet to steer the board and dodge obstacles. Sensor data flows from
BrilliantSole insoles → Zustand store → R3F scene every frame.

---

## Sensor Mapping

| Insole data | Game input |
|---|---|
| Combined roll (avg left + right) | Left/right steering |
| Combined pitch (avg left + right) | Brake / nose-dip (future: jump ramp) |
| Yaw delta | Board rotation / carving feel |
| Single-foot weight difference (pressure) | Edge carving (stretch goal) |

The board rotation in the scene is driven directly by the quaternion from the insoles
(slerped for smoothness), not by physics simulation of the input — keeps it tight and
responsive.

---

## Tech Stack

| Layer | Package |
|---|---|
| 3D rendering | `@react-three/fiber` + `three` |
| Helpers / camera | `@react-three/drei` |
| Physics (collisions) | `@react-three/rapier` |
| State | `zustand` |
| Sensor integration | existing `hooks/useDeviceState` + new `hooks/useSensorOrientation` |
| Styling / HUD | Tailwind (already in project) |

---

## Zustand Store Shape

```ts
// store/useGameStore.ts
{
  // phase
  phase: "idle" | "playing" | "dead",
  startGame: () => void,
  killPlayer: () => void,
  resetGame: () => void,

  // board
  boardQuaternion: Quaternion,   // smoothed sensor quaternion
  setBoardQuaternion: (q) => void,
  boardLateralOffset: number,    // derived x position on slope, updated in game loop

  // run
  speed: number,                 // increases over time
  distance: number,              // metres travelled
  tick: (dt: number) => void,    // called from useFrame

  // obstacles
  obstacles: Obstacle[],         // { id, x, z, type }
  spawnObstacle: () => void,
  removeObstacle: (id) => void,

  // sensor connection
  deviceConnected: boolean,
  setDeviceConnected: (v: boolean) => void,
}
```

State that only lives in R3F refs (board mesh position, terrain scroll offset) stays in
refs — no need to put per-frame mutation into Zustand.

---

## File Structure (additions to /frontend)

```
store/
  useGameStore.ts

hooks/
  useSensorOrientation.ts   # reads euler/quat from DeviceContext, writes to store

components/
  game/
    Game.tsx                # R3F <Canvas> + providers, mounts the scene
    scene/
      Board.tsx             # the snowboard mesh, reads boardQuaternion from store
      Terrain.tsx           # infinite tiling snow plane, scrolls on Z
      Obstacles.tsx         # reads obstacles[] from store, renders + triggers collisions
      SkyAndFog.tsx         # environment / atmosphere
      FollowCamera.tsx      # useFrame camera that stays behind the board
    hud/
      HUD.tsx               # overlaid HTML: score, speed, connection badge
      GameOverScreen.tsx
      StartScreen.tsx
```

---

## Data Flow (per frame)

```
BrilliantSole SDK
  → useSensorOrientation (useEffect listener on "quaternion" event)
      → store.setBoardQuaternion(slerped Q)

R3F useFrame (game loop in Game.tsx)
  → store.tick(dt)          updates speed, distance, boardLateralOffset
  → Board.tsx               applies store.boardQuaternion to mesh rotation
  → Terrain.tsx             scrolls terrain by speed * dt
  → Obstacles.tsx           moves obstacles toward camera, despawns off-screen
  → FollowCamera.tsx        lerps camera behind board
  → collision check         if board AABB overlaps any obstacle → store.killPlayer()
```

Collision is a simple AABB check in `useFrame` (no need for full physics for an MVP
infinite runner). Rapier can be layered in later for ragdoll / jump physics.

---

## Implementation Phases

### Phase 1 — Sensor → Store pipeline
- `useSensorOrientation` hook: listens to `"quaternion"` and `"euler"` events on the
  connected device, smooths with slerp, writes to Zustand.
- Keyboard fallback (arrow keys) so the game is playable without a device connected.

### Phase 2 — Scene skeleton
- `<Canvas>` with perspective camera, fog, ambient + directional light.
- Flat snow plane that tiles/scrolls.
- Placeholder box for the board that visually rotates with sensor data.

### Phase 3 — Board steering
- Map `boardLateralOffset` (integrated from roll angle over time) to board X position.
- Clamp to slope width.
- Carving lean: apply partial quaternion roll to board mesh so it visually tips into turns.

### Phase 4 — Obstacles & scoring
- Spawn trees / rocks at random X positions ahead of the player on a timer.
- Scroll them toward camera at current speed.
- AABB hit → game over.
- Score = distance travelled, displayed in HUD.

### Phase 5 — Juice
- Speed ramps up over time.
- Screen-shake on near-miss.
- Particle snow spray on carve.
- Sound effects (web audio, no extra library needed).
- Leaderboard (localStorage for now).

---

## Open Questions / Decisions

- **Two feet vs one**: average both insoles for single steering axis, or map left=lean-left /
  right=lean-right independently for more nuanced carving? Start with average.
- **Sensitivity calibration**: add a "stand flat" calibration step on the start screen so
  the neutral quaternion is zeroed out per session.
- **Model assets**: start with simple Three.js geometries (BoxGeometry board, ConeGeometry
  trees), swap for GLTF models later.
- **Mobile / desktop fallback**: if no device connected, show on-screen tilt arrows or use
  `DeviceMotion` API from the phone's own IMU as a secondary input.
