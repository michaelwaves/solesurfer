import { inputState } from "./input-state";
import { CONFIG } from "@/game/config";

let cleanup: (() => void) | null = null;
let lastJumpTime = 0;
let jumpArmed = true; // Must return below threshold before next jump

// Smoothed values to reduce jitter
let smoothedRoll = 0;
let smoothedPitch = 0;

// Calibration baseline — captured when user stands flat
let baselineRoll = 0;
let baselinePitch = 0;
let calibrated = false;

// Auto-calibration: average the first N samples to find "flat"
const AUTO_CAL_SAMPLES = 30; // ~0.6s at 20ms rate
let calSamples: { roll: number; pitch: number }[] = [];

// Raw IMU telemetry (readable by UI)
export const imuTelemetry = {
  rawRoll: 0,
  rawPitch: 0,
  rawYaw: 0,
  adjRoll: 0,
  adjPitch: 0,
  baselineRoll: 0,
  baselinePitch: 0,
};

// Sensitivity multipliers — adjustable at runtime
export const imuSensitivity = {
  roll: 1.0,
  pitch: 1.0,
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function applyDeadzone(value: number, deadzone: number, maxAngle: number): number {
  if (Math.abs(value) < deadzone) return 0;
  const sign = value > 0 ? 1 : -1;
  // Map from [deadzone, maxAngle] to [0, 1]
  return sign * Math.min(1, (Math.abs(value) - deadzone) / (maxAngle - deadzone));
}

// Convert quaternion to euler angles using Three.js (YXZ order)
// This matches the teammate's working useSensorOrientation.ts exactly.
// Returns degrees: x=pitch, y=yaw, z=roll
let _threeLoaded = false;
let _tempQ: any = null;
let _tempE: any = null;

async function ensureThree() {
  if (_threeLoaded) return;
  const THREE = await import("three");
  _tempQ = new THREE.Quaternion();
  _tempE = new THREE.Euler(0, 0, 0, "YXZ");
  _threeLoaded = true;
}

function quatToEuler(q: { x: number; y: number; z: number; w: number }) {
  if (!_tempQ || !_tempE) {
    // Fallback before Three.js loads
    return { roll: 0, pitch: 0, yaw: 0 };
  }
  _tempQ.set(q.x, q.y, q.z, q.w);
  _tempE.setFromQuaternion(_tempQ);
  const RAD2DEG = 180 / Math.PI;
  return {
    pitch: _tempE.x * RAD2DEG,
    yaw: _tempE.y * RAD2DEG,
    roll: _tempE.z * RAD2DEG,
  };
}

export function calibrateInsole() {
  calSamples = [];
  calibrated = false;
  smoothedRoll = 0;
  smoothedPitch = 0;
  console.log("Insole calibration started — stand flat for ~0.5s");
}

export function isCalibrated(): boolean {
  return calibrated;
}

export function connectInsoleAdapter(device: any) {
  if (cleanup) cleanup();

  // Load Three.js for quaternion conversion
  ensureThree();

  // Reset calibration on new connection
  calSamples = [];
  calibrated = false;
  baselineRoll = 0;
  baselinePitch = 0;
  smoothedRoll = 0;
  smoothedPitch = 0;

  try {
    // Use gameRotation (quaternion, no magnetometer) — this is what the
    // BrilliantSole SDK actually sends via the sensorData event.
    // Also request linearAcceleration for jump detection.
    device.setSensorConfiguration({
      gameRotation: 20,
    });
  } catch (e) {
    console.warn("Failed to configure insole sensors:", e);
    return;
  }

  const onSensorData = (event: any) => {
    const { sensorType } = event.message;

    if (sensorType === "gameRotation") {
      const q = event.message.gameRotation;
      const euler = quatToEuler(q);

      // Write raw telemetry
      imuTelemetry.rawRoll = euler.roll;
      imuTelemetry.rawPitch = euler.pitch;
      imuTelemetry.rawYaw = euler.yaw;

      // Auto-calibration
      if (!calibrated) {
        calSamples.push({ roll: euler.roll, pitch: euler.pitch });
        if (calSamples.length >= AUTO_CAL_SAMPLES) {
          baselineRoll = calSamples.reduce((s, v) => s + v.roll, 0) / calSamples.length;
          baselinePitch = calSamples.reduce((s, v) => s + v.pitch, 0) / calSamples.length;
          calibrated = true;
          imuTelemetry.baselineRoll = baselineRoll;
          imuTelemetry.baselinePitch = baselinePitch;
          console.log(`Insole calibrated — baseline roll: ${baselineRoll.toFixed(1)}°, pitch: ${baselinePitch.toFixed(1)}°`);
        }
        return;
      }

      // Subtract baseline
      const adjRoll = euler.roll - baselineRoll;
      const adjPitch = euler.pitch - baselinePitch;
      imuTelemetry.adjRoll = adjRoll;
      imuTelemetry.adjPitch = adjPitch;

      // Turn: pitch ±5° threshold, full turn at inputMaxAngle (inverted for natural feel)
      const TURN_THRESHOLD = 5; // degrees
      const turnValue = applyDeadzone(-adjPitch * imuSensitivity.pitch, TURN_THRESHOLD, CONFIG.inputMaxAngle);
      smoothedPitch += (turnValue - smoothedPitch) * CONFIG.inputSmoothing;
      inputState.turnInput = clamp(smoothedPitch, -1, 1);

      // Jump: roll > +7° triggers jump (must return below threshold to re-arm)
      const ROLL_THRESHOLD = 7; // degrees
      const now = performance.now();
      if (adjRoll <= ROLL_THRESHOLD * 0.5) {
        jumpArmed = true; // Re-arm when roll returns well below threshold
      }
      if (adjRoll > ROLL_THRESHOLD && jumpArmed && now - lastJumpTime > CONFIG.jumpCooldown) {
        console.log(`JUMP triggered: adjRoll=${adjRoll.toFixed(1)}°`);
        inputState.jumpInput = true;
        jumpArmed = false;
        lastJumpTime = now;
        requestAnimationFrame(() => {
          inputState.jumpInput = false;
        });
      }

      // Brake: roll < -7° applies braking
      if (adjRoll < -ROLL_THRESHOLD) {
        inputState.speedInput = -Math.min(1, (-adjRoll - ROLL_THRESHOLD) / (30 - ROLL_THRESHOLD));
        console.log(`BRAKE: adjRoll=${adjRoll.toFixed(1)}°, speedInput=${inputState.speedInput.toFixed(2)}`);
      } else {
        inputState.speedInput = 0;
      }

      inputState.source = "insole";
    }
  };

  // BrilliantSole sends all sensor data through the generic "sensorData" event
  device.addEventListener("sensorData", onSensorData);

  inputState.source = "insole";

  cleanup = () => {
    device.removeEventListener("sensorData", onSensorData);
    try {
      device.setSensorConfiguration({ gameRotation: 0 });
    } catch {}
    inputState.source = "keyboard";
    cleanup = null;
  };

  return cleanup;
}

export function disconnectInsoleAdapter() {
  if (cleanup) cleanup();
  smoothedRoll = 0;
  smoothedPitch = 0;
  calibrated = false;
  calSamples = [];
}
