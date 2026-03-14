import * as THREE from "three";
import { CONFIG } from "@/game/config";
import { PlayerState } from "@/game/state";

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    CONFIG.fogFar + 50
  );
  return camera;
}

const _targetPos = new THREE.Vector3();
const _cameraTarget = new THREE.Vector3();

export function updateCamera(camera: THREE.PerspectiveCamera, player: PlayerState) {
  // Target position: behind and above the player
  const behindX = -Math.sin(player.rotation) * CONFIG.cameraDistance;
  const behindZ = Math.cos(player.rotation) * CONFIG.cameraDistance;

  _targetPos.set(
    player.position.x + behindX,
    player.position.y + CONFIG.cameraHeight,
    player.position.z + behindZ
  );

  // Smooth follow
  camera.position.lerp(_targetPos, CONFIG.cameraLerp);

  // Look at player
  _cameraTarget.set(
    player.position.x,
    player.position.y + 1,
    player.position.z
  );
  camera.lookAt(_cameraTarget);
}

export function handleResize(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
