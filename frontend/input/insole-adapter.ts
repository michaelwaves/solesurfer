import { inputState } from "./input-state";
import { CONFIG } from "@/game/config";

let cleanup: (() => void) | null = null;
let lastJumpTime = 0;

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
      linearAcceleration: 20,
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

      // Pitch = turn (lean forward/back to steer left/right)
      // This matches Gem Grab's approach — pitch is the natural
      // lean axis when standing on an insole.
      // Roll is unused for now (could map to tricks later).
      const scaledPitch = adjPitch * imuSensitivity.pitch;
      const dzPitch = applyDeadzone(scaledPitch, CONFIG.inputDeadzone, CONFIG.inputMaxAngle);
      smoothedPitch += (dzPitch - smoothedPitch) * CONFIG.inputSmoothing;

      inputState.turnInput = clamp(smoothedPitch, -1, 1);
      inputState.speedInput = 0; // carving IS speed control
      inputState.source = "insole";
    }

    if (sensorType === "linearAcceleration") {
      if (!calibrated) return;

      const { y } = event.message.linearAcceleration;
      const now = performance.now();

      if (Math.abs(y) > CONFIG.accelJumpThreshold && now - lastJumpTime > CONFIG.jumpCooldown) {
        inputState.jumpInput = true;
        lastJumpTime = now;
        requestAnimationFrame(() => {
          inputState.jumpInput = false;
        });
      }
    }
  };

  // BrilliantSole sends all sensor data through the generic "sensorData" event
  device.addEventListener("sensorData", onSensorData);

  inputState.source = "insole";

  cleanup = () => {
    device.removeEventListener("sensorData", onSensorData);
    try {
      device.setSensorConfiguration({ gameRotation: 0, linearAcceleration: 0 });
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
