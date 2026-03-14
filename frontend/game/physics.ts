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

export function updatePhysics(player: PlayerState, input: InputState, dt: number): void {
  // dt clamp — prevents teleportation on alt-tab
  dt = Math.min(dt, CONFIG.maxDt);
  if (dt <= 0) return;

  // Save last known good state for NaN recovery
  if (!isNaNVec3(player.position)) {
    player.lastGoodPosition = copyVec3(player.position);
  }

  const terrainY = getTerrainHeight(player.position.x, player.position.z);
  const normal = getTerrainNormal(player.position.x, player.position.z);

  // Ground check
  const wasAirborne = player.airborne;
  player.airborne = player.position.y > terrainY + 0.3;

  if (player.airborne) {
    player.airborneTime += dt;
    // Gravity
    player.velocity.y -= CONFIG.gravity * dt;
    // Air drag
    player.velocity.x *= (1 - CONFIG.airDrag);
    player.velocity.z *= (1 - CONFIG.airDrag);
    // Trick spin while airborne
    player.trickRotation += input.trickSpin * dt * 5;
  } else {
    // Landing — reset airborne state
    if (wasAirborne && player.airborneTime > 0.3) {
      // Score tricks based on airborne time and rotation
      player.trickRotation = 0;
    }
    player.airborneTime = 0;
    player.trickRotation = 0;

    // Snap to terrain
    player.position.y = terrainY;

    // Turning — sidecut radius carving model
    const targetEdgeAngle = input.turnInput * CONFIG.maxEdgeAngle;
    player.edgeAngle += (targetEdgeAngle - player.edgeAngle) * 0.1;

    // Turn radius from sidecut
    if (Math.abs(player.edgeAngle) > 0.01) {
      const turnRadius = CONFIG.sidecutRadius / Math.sin(Math.abs(player.edgeAngle));
      const angularVelocity = player.speed / turnRadius;
      player.rotation += Math.sign(player.edgeAngle) * angularVelocity * dt;
    }

    // Slope acceleration — project gravity onto slope direction
    const slopeAccel = CONFIG.gravity * (1 - normal.y) * CONFIG.slopeSteepness;

    // Direction vector from rotation
    const dirX = Math.sin(player.rotation);
    const dirZ = -Math.cos(player.rotation);

    // Speed control from input
    let dragMultiplier = 1;
    if (input.speedInput < -0.3) {
      // Braking (lean back)
      dragMultiplier = 1 + Math.abs(input.speedInput) * CONFIG.brakeDeceleration * dt;
    } else if (input.speedInput > 0.3) {
      // Tucking (lean forward) — reduce drag
      dragMultiplier = 1 - input.speedInput * 0.5 * dt;
    }

    // Apply slope acceleration
    player.velocity.x += dirX * slopeAccel * dt;
    player.velocity.z += dirZ * slopeAccel * dt;

    // Ground friction + edge grip
    const grip = CONFIG.edgeGrip - Math.abs(player.edgeAngle) * 0.1;
    player.velocity.x *= (1 - CONFIG.groundFriction * dragMultiplier) * grip;
    player.velocity.z *= (1 - CONFIG.groundFriction * dragMultiplier) * grip;

    // Jump
    if (input.jumpInput && !player.airborne) {
      player.velocity.y = CONFIG.jumpForce;
      player.airborne = true;
    }
  }

  // Update position
  player.position.x += player.velocity.x * dt;
  player.position.y += player.velocity.y * dt;
  player.position.z += player.velocity.z * dt;

  // Floor clamp when not airborne
  if (!player.airborne && player.position.y < terrainY) {
    player.position.y = terrainY;
    player.velocity.y = 0;
  }

  // Speed scalar
  player.speed = Math.sqrt(
    player.velocity.x * player.velocity.x + player.velocity.z * player.velocity.z
  );

  // Speed cap
  if (player.speed > CONFIG.maxSpeed) {
    const scale = CONFIG.maxSpeed / player.speed;
    player.velocity.x *= scale;
    player.velocity.z *= scale;
    player.speed = CONFIG.maxSpeed;
  }

  // NaN guard — reset to last known good position
  if (isNaNVec3(player.position) || isNaNVec3(player.velocity)) {
    console.warn("Physics NaN detected, resetting to last good state");
    player.position = copyVec3(player.lastGoodPosition);
    player.velocity = { x: 0, y: 0, z: -0.1 };
    player.speed = 0;
    player.edgeAngle = 0;
  }
}
