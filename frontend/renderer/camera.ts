import * as THREE from "three";
import { CONFIG } from "@/game/config";
import { PlayerState } from "@/game/state";
import { getTerrainMode } from "@/game/terrain";

// Camera rig — parent group that moves to follow the player.
// In WebXR, Three.js positions the camera relative to this rig via head tracking.
let _cameraRig: THREE.Group | null = null;

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
  );
  return camera;
}

export function createCameraRig(camera: THREE.PerspectiveCamera, scene: THREE.Scene): THREE.Group {
  _cameraRig = new THREE.Group();
  _cameraRig.add(camera);
  scene.add(_cameraRig);
  return _cameraRig;
}

export function getCameraRig(): THREE.Group | null {
  return _cameraRig;
}

const _targetPos = new THREE.Vector3();
const _cameraTarget = new THREE.Vector3();
const _rigTargetPos = new THREE.Vector3();

export function updateCamera(camera: THREE.PerspectiveCamera, player: PlayerState, isVR = false) {
  if (isVR && _cameraRig) {
    // VR mode: move the rig to follow the player.
    // Head tracking positions the camera relative to the rig.
    const behindX = -Math.sin(player.rotation) * CONFIG.cameraDistance;
    const behindZ = Math.cos(player.rotation) * CONFIG.cameraDistance;

    _rigTargetPos.set(
      player.position.x + behindX,
      player.position.y + CONFIG.cameraHeight,
      player.position.z + behindZ
    );
    _cameraRig.position.lerp(_rigTargetPos, CONFIG.cameraLerp);
    _cameraRig.rotation.y = player.rotation;
    return;
  }

  // Desktop mode: move the camera directly
  if (getTerrainMode() === "halfpipe") {
    // Halfpipe: camera centered on pipe, only follows downhill
    _targetPos.set(
      0,
      player.position.y + CONFIG.cameraHeight + 4,
      player.position.z + CONFIG.cameraDistance
    );
    camera.position.lerp(_targetPos, CONFIG.cameraLerp);

    _cameraTarget.set(
      player.position.x * 0.3,
      player.position.y + 0.5,
      player.position.z - 5
    );
    camera.lookAt(_cameraTarget);
  } else {
    // Freeride: third-person chase camera behind the player
    const behindX = -Math.sin(player.rotation) * CONFIG.cameraDistance;
    const behindZ = Math.cos(player.rotation) * CONFIG.cameraDistance;

    _targetPos.set(
      player.position.x + behindX,
      player.position.y + CONFIG.cameraHeight,
      player.position.z + behindZ
    );
    camera.position.lerp(_targetPos, CONFIG.cameraLerp);

    _cameraTarget.set(
      player.position.x,
      player.position.y,
      player.position.z - 15
    );
    camera.lookAt(_cameraTarget);
  }
}

export function handleResize(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
