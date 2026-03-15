import { CONFIG } from "./config";
import { GameState, PlayerState, Vec3, TrickState } from "./state";
import { InputState } from "@/input/input-state";
import { getTerrainHeight, getTerrainNormal, getTreesInRange, getTerrainMode } from "./terrain";

function isNaNVec3(v: Vec3): boolean {
  return isNaN(v.x) || isNaN(v.y) || isNaN(v.z);
}

function copyVec3(src: Vec3): Vec3 {
  return { x: src.x, y: src.y, z: src.z };
}

function vec3Length(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

// Score a trick based on air time, height, and spin
function scoreTrick(player: PlayerState): TrickState | null {
  if (player.airborneTime < 0.4) return null; // too short to count

  const spinDeg = Math.abs(player.totalSpinInAir) * (180 / Math.PI);
  let points = 0;
  let name = "";

  // Air time points
  const airPoints = Math.floor(player.airborneTime * 50);
  points += airPoints;

  // Height bonus
  const heightBonus = Math.floor(player.maxAirHeight * 20);
  points += heightBonus;

  // Spin tricks
  if (spinDeg > 300) {
    name = "1080";
    points += 300;
  } else if (spinDeg > 200) {
    name = "720";
    points += 200;
  } else if (spinDeg > 140) {
    name = "540";
    points += 150;
  } else if (spinDeg > 80) {
    name = "360";
    points += 100;
  } else if (spinDeg > 30) {
    name = "180";
    points += 50;
  }

  // Name based on what happened
  if (!name) {
    if (player.airborneTime > 1.5) name = "Big Air";
    else if (player.maxAirHeight > 2) name = "Method";
    else name = "Air";
  }

  if (points < 10) return null;

  return { name, points, timestamp: performance.now() };
}

// Check tree collision for freeride mode
function checkTreeCollision(player: PlayerState): boolean {
  if (getTerrainMode() !== "freeride") return false;

  const trees = getTreesInRange(
    player.position.z - 2,
    player.position.z + 2
  );

  const collisionRadius = 0.6; // player radius
  for (const tree of trees) {
    const dx = player.position.x - tree.x;
    const dz = player.position.z - tree.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const treeRadius = 0.3 * tree.scale;
    if (dist < collisionRadius + treeRadius) {
      return true;
    }
  }
  return false;
}

export function updatePhysics(player: PlayerState, input: InputState, dt: number, gameState?: GameState): void {
  dt = Math.min(dt, CONFIG.maxDt);
  if (dt <= 0) return;
  if (player.crashed) return;

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

    // Track max height above terrain for trick scoring
    const heightAboveTerrain = player.position.y - terrainY;
    if (heightAboveTerrain > player.maxAirHeight) {
      player.maxAirHeight = heightAboveTerrain;
    }

    // Track total spin
    player.totalSpinInAir += input.turnInput * 1.5 * dt;

    // Gravity
    player.velocity.y -= CONFIG.gravity * dt;

    // Aerodynamic drag
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

    // Air steering
    player.rotation += input.turnInput * 1.5 * dt;

    // Trick spin (visual)
    player.trickRotation += input.trickSpin * dt * 5;

  } else {
    // === ON SNOW ===

    // Landing — score the trick
    if (wasAirborne && player.airborneTime > 0.2) {
      const trick = scoreTrick(player);
      if (trick && gameState) {
        player.lastTrick = trick;
        gameState.trickScore += trick.points;
        gameState.score += trick.points;
        gameState.trickFeed.push(trick);
        // Keep only last 5 tricks in feed
        if (gameState.trickFeed.length > 5) {
          gameState.trickFeed.shift();
        }
      }
      player.trickRotation = 0;
    }
    player.airborneTime = 0;
    player.maxAirHeight = 0;
    player.totalSpinInAir = 0;

    // Terrain following
    player.position.y = terrainY;
    const terrainAheadY = getTerrainHeight(
      player.position.x + player.velocity.x * dt * 3,
      player.position.z + player.velocity.z * dt * 3
    );
    player.velocity.y = (terrainAheadY - terrainY) / (dt * 3 + 0.001);

    // 1. EDGE CONTROL
    const targetEdge = input.turnInput * CONFIG.maxEdgeAngle;
    player.edgeAngle += (targetEdge - player.edgeAngle) * CONFIG.edgeEngagement;

    // 2. GRAVITY on slope
    const gravAlongSlopeX = CONFIG.gravity * normal.y * normal.x;
    const gravAlongSlopeZ = CONFIG.gravity * normal.y * normal.z;
    player.velocity.x += gravAlongSlopeX * dt;
    player.velocity.z += gravAlongSlopeZ * dt;

    // 3. CARVING
    if (Math.abs(player.edgeAngle) > 0.03 && player.speed > 0.3) {
      const turnRadius = CONFIG.sidecutRadius / Math.sin(Math.abs(player.edgeAngle));
      const angularVel = player.speed / Math.max(turnRadius, 1);
      player.rotation += Math.sign(player.edgeAngle) * angularVel * dt;
    }

    // Board aligns toward velocity
    if (player.speed > 1) {
      const velAngle = Math.atan2(player.velocity.x, -player.velocity.z);
      let angleDiff = velAngle - player.rotation;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      const alignStrength = Math.abs(input.turnInput) > 0.1 ? 0.02 : 0.08;
      player.rotation += angleDiff * alignStrength;
    }

    // 4. FRICTION
    const dirX = Math.sin(player.rotation);
    const dirZ = -Math.cos(player.rotation);

    const vForward = player.velocity.x * dirX + player.velocity.z * dirZ;
    const vLateralX = player.velocity.x - vForward * dirX;
    const vLateralZ = player.velocity.z - vForward * dirZ;
    const vLateral = Math.sqrt(vLateralX * vLateralX + vLateralZ * vLateralZ);

    const snowDecel = CONFIG.snowFriction * CONFIG.gravity;
    const edgeAngleAbs = Math.abs(player.edgeAngle);
    const edgeDecel = edgeAngleAbs * edgeAngleAbs * CONFIG.carveFrictionCoeff * CONFIG.gravity;
    const totalDecel = snowDecel + edgeDecel;
    if (player.speed > 0.01) {
      const frictionFactor = Math.max(0, 1 - (totalDecel * dt) / player.speed);
      player.velocity.x = vForward * frictionFactor * dirX + vLateralX;
      player.velocity.z = vForward * frictionFactor * dirZ + vLateralZ;
    }

    // Lateral grip
    const gripStrength = CONFIG.lateralGripBase + edgeAngleAbs * CONFIG.lateralGripEdge;
    const clampedGrip = Math.min(gripStrength, 0.95);
    if (vLateral > 0.01) {
      const lateralDecel = clampedGrip * CONFIG.gravity * 2;
      const lateralReduction = Math.min(lateralDecel * dt, vLateral);
      const lateralFactor = 1 - lateralReduction / vLateral;
      player.velocity.x -= vLateralX * (1 - lateralFactor);
      player.velocity.z -= vLateralZ * (1 - lateralFactor);
    }

    // Braking — speedInput < 0 applies extra friction
    if (input.speedInput < 0 && player.speed > 0.1) {
      const brakeStrength = 20; // m/s² max brake deceleration
      const brakeDecel = -input.speedInput * brakeStrength;
      const brakeFactor = Math.max(0, 1 - (brakeDecel * dt) / player.speed);
      player.velocity.x *= brakeFactor;
      player.velocity.z *= brakeFactor;
    }

    // Aerodynamic drag
    if (player.speed > 0.5) {
      const dragForce = 0.5 * CONFIG.airDensity * player.speed * player.speed
        * CONFIG.airDragCoeff * CONFIG.airDragArea;
      const dragDecel = dragForce / CONFIG.riderMass;
      const dragFactor = Math.max(0, 1 - (dragDecel * dt) / player.speed);
      player.velocity.x *= dragFactor;
      player.velocity.z *= dragFactor;
    }

    // 5. JUMP (consume input so it only fires once)
    if (input.jumpInput && !player.airborne) {
      player.velocity.x += normal.x * CONFIG.jumpForce * 0.5;
      player.velocity.y = CONFIG.jumpForce;
      player.velocity.z += normal.z * CONFIG.jumpForce * 0.5;
      player.position.y = terrainY + 0.2; // lift off terrain so airborne check passes
      player.airborne = true;
      input.jumpInput = false; // consume — prevents re-triggering across physics ticks
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

  // Speed
  player.speed = Math.sqrt(
    player.velocity.x * player.velocity.x + player.velocity.z * player.velocity.z
  );

  // Terminal velocity
  if (player.speed > CONFIG.maxSpeed) {
    const scale = CONFIG.maxSpeed / player.speed;
    player.velocity.x *= scale;
    player.velocity.z *= scale;
    player.speed = CONFIG.maxSpeed;
  }

  // Tree collision (freeride)
  if (!player.airborne && checkTreeCollision(player)) {
    player.crashed = true;
    player.velocity = { x: 0, y: 0, z: 0 };
    player.speed = 0;
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
