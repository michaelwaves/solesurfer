import * as THREE from "three";

// WebXR session management for PICO headset
// Handles: entering/exiting VR, swapping to XR animation loop,
// and detecting WebXR support.

export interface XRState {
  supported: boolean;
  active: boolean;
  session: XRSession | null;
}

export function createXRState(): XRState {
  return { supported: false, active: false, session: null };
}

export async function checkXRSupport(): Promise<boolean> {
  if (!("xr" in navigator)) return false;
  try {
    return await (navigator as any).xr.isSessionSupported("immersive-vr");
  } catch {
    return false;
  }
}

export async function enterVR(
  renderer: THREE.WebGLRenderer,
  onSessionStart: (session: XRSession) => void,
  onSessionEnd: () => void
): Promise<XRSession | null> {
  if (!("xr" in navigator)) return null;

  try {
    const session = await (navigator as any).xr.requestSession("immersive-vr", {
      optionalFeatures: ["local-floor", "bounded-floor"],
    });

    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType("local-floor");
    await renderer.xr.setSession(session);

    session.addEventListener("end", () => {
      renderer.xr.enabled = false;
      onSessionEnd();
    });

    onSessionStart(session);
    return session;
  } catch (e) {
    console.error("Failed to enter VR:", e);
    return null;
  }
}

export function exitVR(session: XRSession | null) {
  if (session) {
    session.end().catch(() => {});
  }
}

// Set up the XR animation loop on the renderer.
// Three.js r126+ handles XR frame loop internally via renderer.setAnimationLoop.
export function setupXRLoop(
  renderer: THREE.WebGLRenderer,
  renderFn: (time: number, frame?: XRFrame) => void
) {
  renderer.setAnimationLoop(renderFn);
}

export function clearXRLoop(renderer: THREE.WebGLRenderer) {
  renderer.setAnimationLoop(null);
}
