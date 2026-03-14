import * as THREE from "three";
import { PlayerState } from "@/game/state";

export function createCharacter() {
  const group = new THREE.Group();

  // Body
  const bodyGeo = new THREE.CapsuleGeometry(0.2, 0.8, 4, 8);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2244aa });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.8;
  group.add(body);

  // Head
  const headGeo = new THREE.SphereGeometry(0.18, 8, 8);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.5;
  group.add(head);

  // Snowboard
  const boardGeo = new THREE.BoxGeometry(0.3, 0.05, 1.5);
  const boardMat = new THREE.MeshStandardMaterial({ color: 0xdd3333 });
  const board = new THREE.Mesh(boardGeo, boardMat);
  board.position.y = 0.05;
  group.add(board);

  return group;
}

export function updateCharacter(character: THREE.Group, player: PlayerState) {
  character.position.set(player.position.x, player.position.y, player.position.z);
  character.rotation.y = player.rotation;

  // Lean into turns
  character.rotation.z = -player.edgeAngle * 0.5;

  // Trick rotation while airborne
  if (player.airborne) {
    character.rotation.x = player.trickRotation;
  } else {
    character.rotation.x = 0;
  }
}
