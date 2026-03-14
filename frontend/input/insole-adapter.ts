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

// Raw IMU telemetry (readable by UI)
export const imuTelemetry = {
  rawRoll: 0,
  rawPitch: 0,
  rawYaw: 0,
  adjRoll: 0,     // after baseline subtraction
  adjPitch: 0,
  baselineRoll: 0,
  baselinePitch: 0,
};

// Sensitivity multipliers — adjustable at runtime
export const imuSensitivity = {
  roll: 1.0,   // turn amplification
  pitch: 1.0,  // speed amplification
};

// Auto-calibration: average the first N samples to find "flat"
const AUTO_CAL_SAMPLES = 30; // ~0.6s at 20ms rate
let calSamples: { roll: number; pitch: number }[] = [];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function applyDeadzone(value: number, deadzone: number): number {
  if (Math.abs(value) < deadzone) return 0;
  const sign = value > 0 ? 1 : -1;
  return sign * ((Math.abs(value) - deadzone) / (90 - deadzone));
}

// Manual recalibrate — call this when the user is standing flat
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

  // Reset calibration on new connection
  calSamples = [];
  calibrated = false;
  baselineRoll = 0;
  baselinePitch = 0;
  smoothedRoll = 0;
  smoothedPitch = 0;

  try {
    device.setSensorConfiguration({
      orientation: 20,
      linearAcceleration: 20,
    });
  } catch (e) {
    console.warn("Failed to configure insole sensors:", e);
    return;
  }

  const onOrientation = (event: any) => {
    const { pitch, roll, heading } = event.message.orientation;

    // Write raw telemetry (always, even during calibration)
    imuTelemetry.rawRoll = roll;
    imuTelemetry.rawPitch = pitch;
    imuTelemetry.rawYaw = heading || 0;

    // Auto-calibration: collect samples then average for baseline
    if (!calibrated) {
      calSamples.push({ roll, pitch });
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

    // Subtract baseline so "flat" = zero
    const adjRoll = roll - baselineRoll;
    const adjPitch = pitch - baselinePitch;
    imuTelemetry.adjRoll = adjRoll;
    imuTelemetry.adjPitch = adjPitch;

    // Apply sensitivity multiplier, deadzone, and smoothing
    const scaledRoll = adjRoll * imuSensitivity.roll;
    const scaledPitch = adjPitch * imuSensitivity.pitch;

    const dzRoll = applyDeadzone(scaledRoll, CONFIG.inputDeadzone);
    const dzPitch = applyDeadzone(scaledPitch, CONFIG.inputDeadzone);

    smoothedRoll += (dzRoll - smoothedRoll) * CONFIG.inputSmoothing;
    smoothedPitch += (dzPitch - smoothedPitch) * CONFIG.inputSmoothing;

    inputState.turnInput = clamp(smoothedRoll, -1, 1);
    inputState.speedInput = clamp(smoothedPitch, -1, 1);
    inputState.source = "insole";
  };

  const onLinearAcceleration = (event: any) => {
    if (!calibrated) return; // Skip during calibration

    const { y } = event.message.linearAcceleration;
    const now = performance.now();

    if (Math.abs(y) > CONFIG.accelJumpThreshold && now - lastJumpTime > CONFIG.jumpCooldown) {
      inputState.jumpInput = true;
      lastJumpTime = now;
      requestAnimationFrame(() => {
        inputState.jumpInput = false;
      });
    }
  };

  device.addEventListener("orientation", onOrientation);
  device.addEventListener("linearAcceleration", onLinearAcceleration);

  inputState.source = "insole";

  cleanup = () => {
    device.removeEventListener("orientation", onOrientation);
    device.removeEventListener("linearAcceleration", onLinearAcceleration);
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
