import { CONFIG } from "./config";
import { PlayerState, Vec3 } from "./state";
import { InputState } from "@/input/input-state";
import { getTerrainHeight, getTerrainNormal } from "./terrain";

function isNaNVec3(v: Vec3): boolean {
  return isNaN(v.x) || isNaN(v.y) || isNaN(v.z);
}

function copyVec3(src: Vec3): Vec3 {
  return { x: src.x, y: src.y, z: src.z };
}

function vec3Length(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

// ================================================================
// SNOWBOARD PHYSICS — PHYSICALLY BASED
//
// All forces are in Newtons, accelerations in m/s².
// Friction uses real coefficients. Drag uses drag equation.
// Everything is properly time-scaled (no per-frame multipliers).
//
//   Forces on rider:
//   1. Gravity (9.81 m/s² projected onto slope surface)
//   2. Snow friction (μ_k ≈ 0.04 for waxed base)
//   3. Edge friction (increases with edge angle²)
//   4. Aerodynamic drag (½ρv²CdA)
//   5. Lateral edge grip (prevents sideslip)
// ================================================================

export function updatePhysics(player: PlayerState, input: InputState, dt: number): void {
  dt = Math.min(dt, CONFIG.maxDt);
  if (dt <= 0) return;

  if (!isNaNVec3(player.position)) {
    player.lastGoodPosition = copyVec3(player.position);
  }

  const terrainY = getTerrainHeight(player.position.x, player.position.z);
  const normal = getTerrainNormal(player.position.x, player.position.z);

  const wasAirborne = player.airborne;
  player.airborne = player.position.y > terrainY + 0.1;

  if (player.airborne) {
    // === AIRBORNE ===
    player.airborneTime += dt;

    // Gravity
    player.velocity.y -= CONFIG.gravity * dt;

    // Aerodynamic drag in air (same formula as ground, applied to full velocity)
    const speed3D = vec3Length(player.velocity);
    if (speed3D > 0.1) {
      const dragForce = 0.5 * CONFIG.airDensity * speed3D * speed3D
        * CONFIG.airDragCoeff * CONFIG.airDragArea;
      const dragAccel = dragForce / CONFIG.riderMass;
      const dragFactor = Math.max(0, 1 - (dragAccel * dt) / speed3D);
      player.velocity.x *= dragFactor;
      player.velocity.y *= dragFactor;
      player.velocity.z *= dragFactor;
    }

    // Subtle air steering
    player.rotation += input.turnInput * 1.5 * dt;

    // Trick spin
    player.trickRotation += input.trickSpin * dt * 5;

  } else {
    // === ON SNOW ===

    if (wasAirborne && player.airborneTime > 0.2) {
      player.trickRotation = 0;
    }
    player.airborneTime = 0;
    player.trickRotation = 0;

    // --- Terrain following ---
    // Set position to terrain, compute y velocity from slope
    player.position.y = terrainY;
    const lookAhead = Math.max(player.speed * dt * 3, 0.3);
    const terrainAheadY = getTerrainHeight(
      player.position.x + player.velocity.x * dt * 3,
      player.position.z + player.velocity.z * dt * 3
    );
    player.velocity.y = (terrainAheadY - terrainY) / (dt * 3 + 0.001);

    // ========================================
    // 1. EDGE CONTROL
    // ========================================
    const targetEdge = input.turnInput * CONFIG.maxEdgeAngle;
    player.edgeAngle += (targetEdge - player.edgeAngle) * CONFIG.edgeEngagement;

    // ========================================
    // 2. GRAVITY on slope surface
    // ========================================
    // Project gravity (0, -g, 0) onto slope plane with normal n:
    //   g_slope = g - (g·n)n
    //   XZ components = (g * ny * nx, g * ny * nz)
    // This naturally pushes downhill — the ONLY driving force.
    const gravAlongSlopeX = CONFIG.gravity * normal.y * normal.x;
    const gravAlongSlopeZ = CONFIG.gravity * normal.y * normal.z;

    player.velocity.x += gravAlongSlopeX * dt;
    player.velocity.z += gravAlongSlopeZ * dt;

    // ========================================
    // 3. CARVING — sidecut turn
    // ========================================
    if (Math.abs(player.edgeAngle) > 0.03 && player.speed > 0.3) {
      const turnRadius = CONFIG.sidecutRadius / Math.sin(Math.abs(player.edgeAngle));
      const angularVel = player.speed / Math.max(turnRadius, 1);
      player.rotation += Math.sign(player.edgeAngle) * angularVel * dt;
    }

    // Board aligns toward velocity direction (gradual, doesn't fight carving)
    if (player.speed > 1) {
      const velAngle = Math.atan2(player.velocity.x, -player.velocity.z);
      let angleDiff = velAngle - player.rotation;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      // Only align when NOT actively carving — carving overrides alignment
      const alignStrength = Math.abs(input.turnInput) > 0.1 ? 0.02 : 0.08;
      player.rotation += angleDiff * alignStrength;
    }

    // ========================================
    // 4. FRICTION (physically based)
    // ========================================
    const dirX = Math.sin(player.rotation);
    const dirZ = -Math.cos(player.rotation);

    // Decompose velocity into forward (along board) and lateral (across board)
    const vForward = player.velocity.x * dirX + player.velocity.z * dirZ;
    const vLateralX = player.velocity.x - vForward * dirX;
    const vLateralZ = player.velocity.z - vForward * dirZ;
    const vLateral = Math.sqrt(vLateralX * vLateralX + vLateralZ * vLateralZ);

    // a) Snow friction — F = μmg, deceleration = μg
    // Applied along the forward direction (opposes motion)
    const snowDecel = CONFIG.snowFriction * CONFIG.gravity;

    // b) Edge friction — increases with edge angle squared
    const edgeAngleAbs = Math.abs(player.edgeAngle);
    const edgeDecel = edgeAngleAbs * edgeAngleAbs * CONFIG.carveFrictionCoeff * CONFIG.gravity;

    // Total friction deceleration (can't reverse direction)
    const totalDecel = snowDecel + edgeDecel;
    if (player.speed > 0.01) {
      const frictionFactor = Math.max(0, 1 - (totalDecel * dt) / player.speed);
      player.velocity.x = vForward * frictionFactor * dirX + vLateralX;
      player.velocity.z = vForward * frictionFactor * dirZ + vLateralZ;
    }

    // c) Lateral grip — edges resist sideslip
    // More edge angle = more grip. Flat base = sloppy.
    const gripStrength = CONFIG.lateralGripBase + edgeAngleAbs * CONFIG.lateralGripEdge;
    const clampedGrip = Math.min(gripStrength, 0.95);
    if (vLateral > 0.01) {
      // Apply grip as a deceleration, not an instant multiplier
      const lateralDecel = clampedGrip * CONFIG.gravity * 2; // grip force
      const lateralReduction = Math.min(lateralDecel * dt, vLateral);
      const lateralFactor = 1 - lateralReduction / vLateral;
      player.velocity.x -= vLateralX * (1 - lateralFactor);
      player.velocity.z -= vLateralZ * (1 - lateralFactor);
    }

    // d) Aerodynamic drag — F = ½ρv²CdA
    if (player.speed > 0.5) {
      const dragForce = 0.5 * CONFIG.airDensity * player.speed * player.speed
        * CONFIG.airDragCoeff * CONFIG.airDragArea;
      const dragDecel = dragForce / CONFIG.riderMass;
      const dragFactor = Math.max(0, 1 - (dragDecel * dt) / player.speed);
      player.velocity.x *= dragFactor;
      player.velocity.z *= dragFactor;
    }

    // ========================================
    // 5. JUMP
    // ========================================
    if (input.jumpInput) {
      // Ollie: launch perpendicular to surface
      player.velocity.x += normal.x * CONFIG.jumpForce * 0.5;
      player.velocity.y = CONFIG.jumpForce; // set, not add (consistent jump height)
      player.velocity.z += normal.z * CONFIG.jumpForce * 0.5;
      player.airborne = true;
    }
  }

  // === UPDATE POSITION ===
  player.position.x += player.velocity.x * dt;
  player.position.y += player.velocity.y * dt;
  player.position.z += player.velocity.z * dt;

  // Floor clamp
  const newTerrainY = getTerrainHeight(player.position.x, player.position.z);
  if (!player.airborne && player.position.y < newTerrainY) {
    player.position.y = newTerrainY;
    player.velocity.y = 0;
  }

  // Speed (horizontal only)
  player.speed = Math.sqrt(
    player.velocity.x * player.velocity.x + player.velocity.z * player.velocity.z
  );

  // Terminal velocity (90 km/h = 25 m/s)
  if (player.speed > CONFIG.maxSpeed) {
    const scale = CONFIG.maxSpeed / player.speed;
    player.velocity.x *= scale;
    player.velocity.z *= scale;
    player.speed = CONFIG.maxSpeed;
  }

  // NaN guard
  if (isNaNVec3(player.position) || isNaNVec3(player.velocity)) {
    console.warn("Physics NaN detected, resetting");
    player.position = copyVec3(player.lastGoodPosition);
    player.velocity = { x: 0, y: 0, z: -0.1 };
    player.speed = 0;
    player.edgeAngle = 0;
  }
}
