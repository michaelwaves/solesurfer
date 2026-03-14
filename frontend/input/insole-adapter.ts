import { inputState } from "./input-state";
import { CONFIG } from "@/game/config";

let cleanup: (() => void) | null = null;
let lastJumpTime = 0;

// Smoothed values to reduce jitter
let smoothedRoll = 0;
let smoothedPitch = 0;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function applyDeadzone(value: number, deadzone: number): number {
  if (Math.abs(value) < deadzone) return 0;
  const sign = value > 0 ? 1 : -1;
  return sign * ((Math.abs(value) - deadzone) / (90 - deadzone));
}

export function connectInsoleAdapter(device: any) {
  // Clean up previous connection
  if (cleanup) cleanup();

  try {
    // Enable orientation + linearAcceleration sensors at 20ms
    device.setSensorConfiguration({
      orientation: 20,
      linearAcceleration: 20,
    });
  } catch (e) {
    console.warn("Failed to configure insole sensors:", e);
    return;
  }

  const onOrientation = (event: any) => {
    const { pitch, roll } = event.message.orientation;

    // Apply deadzone and smoothing
    const rawRoll = applyDeadzone(roll, CONFIG.inputDeadzone);
    const rawPitch = applyDeadzone(pitch, CONFIG.inputDeadzone);

    smoothedRoll += (rawRoll - smoothedRoll) * CONFIG.inputSmoothing;
    smoothedPitch += (rawPitch - smoothedPitch) * CONFIG.inputSmoothing;

    inputState.turnInput = clamp(smoothedRoll, -1, 1);
    inputState.speedInput = clamp(smoothedPitch, -1, 1);
    inputState.source = "insole";
  };

  const onLinearAcceleration = (event: any) => {
    const { y } = event.message.linearAcceleration;
    const now = performance.now();

    // Detect jump: vertical acceleration spike with cooldown
    if (Math.abs(y) > CONFIG.accelJumpThreshold && now - lastJumpTime > CONFIG.jumpCooldown) {
      inputState.jumpInput = true;
      lastJumpTime = now;
      // Auto-clear jump after one frame
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
  if (cleanup) {
    cleanup();
  }
  smoothedRoll = 0;
  smoothedPitch = 0;
}
