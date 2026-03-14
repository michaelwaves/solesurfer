import * as THREE from "three";
import { PlayerState } from "@/game/state";

// 6ft (1.83m) snowboarder proportions
// Standing on board, slightly crouched riding stance

function createLimb(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  color: number
): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 8);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  return new THREE.Mesh(geo, mat);
}

export function createCharacter() {
  const group = new THREE.Group();
  const skinColor = 0xf0c8a0;
  const jacketColor = 0x1a5276;   // dark blue snow jacket
  const pantsColor = 0x1c1c1c;    // black snow pants
  const bootsColor = 0x2c2c2c;    // dark boots
  const helmetColor = 0xe74c3c;   // red helmet
  const gloveColor = 0x1c1c1c;
  const boardColor = 0x2ecc71;    // green board with graphics
  const bindingColor = 0x333333;

  // --- SNOWBOARD ---
  // Real board: ~155cm long, ~25cm wide, slight camber
  const boardGeo = new THREE.BoxGeometry(0.26, 0.03, 1.55);
  // Round the nose and tail
  const boardMat = new THREE.MeshStandardMaterial({
    color: boardColor,
    roughness: 0.4,
    metalness: 0.1,
  });
  const board = new THREE.Mesh(boardGeo, boardMat);
  board.position.y = 0.015;
  group.add(board);

  // Board graphic stripe
  const stripeGeo = new THREE.BoxGeometry(0.27, 0.005, 0.5);
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xf39c12 });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.set(0, 0.035, 0);
  group.add(stripe);

  // Bindings
  for (const zOff of [-0.28, 0.28]) {
    const bindingGeo = new THREE.BoxGeometry(0.22, 0.04, 0.12);
    const bindingMat = new THREE.MeshStandardMaterial({ color: bindingColor });
    const binding = new THREE.Mesh(bindingGeo, bindingMat);
    binding.position.set(0, 0.05, zOff);
    group.add(binding);
  }

  // --- BOOTS ---
  for (const zOff of [-0.28, 0.28]) {
    const bootGeo = new THREE.BoxGeometry(0.12, 0.14, 0.2);
    const bootMat = new THREE.MeshStandardMaterial({ color: bootsColor, roughness: 0.9 });
    const boot = new THREE.Mesh(bootGeo, bootMat);
    boot.position.set(0, 0.1, zOff);
    group.add(boot);
  }

  // --- LEGS (riding stance: slightly crouched, shoulder width) ---
  const stanceWidth = 0.12;

  // Lower legs (shins)
  for (const xOff of [-stanceWidth, stanceWidth]) {
    const shin = createLimb(0.055, 0.05, 0.4, pantsColor);
    shin.position.set(xOff, 0.37, 0);
    group.add(shin);
  }

  // Upper legs (thighs) — angled for crouch
  for (const xOff of [-stanceWidth, stanceWidth]) {
    const thigh = createLimb(0.07, 0.06, 0.4, pantsColor);
    thigh.position.set(xOff, 0.7, 0.05);
    thigh.rotation.x = 0.3; // crouched forward
    group.add(thigh);
  }

  // --- TORSO ---
  // Lower torso / hips
  const hipsGeo = new THREE.BoxGeometry(0.34, 0.15, 0.2);
  const hipsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.8 });
  const hips = new THREE.Mesh(hipsGeo, hipsMat);
  hips.position.set(0, 0.88, 0.02);
  group.add(hips);

  // Upper torso / jacket
  const torsoGeo = new THREE.BoxGeometry(0.38, 0.35, 0.22);
  const torsoMat = new THREE.MeshStandardMaterial({ color: jacketColor, roughness: 0.7 });
  const torso = new THREE.Mesh(torsoGeo, torsoMat);
  torso.position.set(0, 1.15, 0);
  torso.rotation.x = 0.15; // leaning forward slightly
  group.add(torso);

  // Jacket zipper detail
  const zipGeo = new THREE.BoxGeometry(0.02, 0.3, 0.23);
  const zipMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5 });
  const zip = new THREE.Mesh(zipGeo, zipMat);
  zip.position.set(0, 1.15, 0);
  group.add(zip);

  // --- ARMS (relaxed, slightly out for balance) ---
  // Upper arms
  for (const side of [-1, 1]) {
    const upperArm = createLimb(0.05, 0.045, 0.3, jacketColor);
    upperArm.position.set(side * 0.24, 1.2, 0.02);
    upperArm.rotation.z = side * -0.5; // angled out
    upperArm.rotation.x = 0.3; // forward
    group.add(upperArm);

    // Forearms
    const forearm = createLimb(0.045, 0.04, 0.28, jacketColor);
    forearm.position.set(side * 0.38, 1.0, 0.1);
    forearm.rotation.z = side * -0.3;
    forearm.rotation.x = 0.6;
    group.add(forearm);

    // Gloves
    const gloveGeo = new THREE.SphereGeometry(0.045, 6, 6);
    const gloveMat = new THREE.MeshStandardMaterial({ color: gloveColor });
    const glove = new THREE.Mesh(gloveGeo, gloveMat);
    glove.position.set(side * 0.44, 0.88, 0.22);
    group.add(glove);
  }

  // --- NECK ---
  const neckGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.08, 8);
  const neckMat = new THREE.MeshStandardMaterial({ color: skinColor });
  const neck = new THREE.Mesh(neckGeo, neckMat);
  neck.position.set(0, 1.38, 0);
  group.add(neck);

  // --- HEAD + HELMET ---
  const headGeo = new THREE.SphereGeometry(0.12, 12, 12);
  const headMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.8 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0, 1.52, 0);
  group.add(head);

  // Helmet
  const helmetGeo = new THREE.SphereGeometry(0.135, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.6);
  const helmetMat = new THREE.MeshStandardMaterial({ color: helmetColor, roughness: 0.3 });
  const helmet = new THREE.Mesh(helmetGeo, helmetMat);
  helmet.position.set(0, 1.55, 0);
  group.add(helmet);

  // Goggles
  const goggleGeo = new THREE.BoxGeometry(0.2, 0.06, 0.06);
  const goggleMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.1,
    metalness: 0.8,
  });
  const goggles = new THREE.Mesh(goggleGeo, goggleMat);
  goggles.position.set(0, 1.5, 0.1);
  group.add(goggles);

  // Goggle strap
  const strapGeo = new THREE.TorusGeometry(0.13, 0.01, 4, 16, Math.PI);
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const strap = new THREE.Mesh(strapGeo, strapMat);
  strap.position.set(0, 1.52, 0);
  strap.rotation.x = Math.PI / 2;
  strap.rotation.y = Math.PI;
  group.add(strap);

  return group;
}

// Store refs for animated parts
let _torsoRef: THREE.Mesh | null = null;

export function updateCharacter(character: THREE.Group, player: PlayerState) {
  character.position.set(player.position.x, player.position.y, player.position.z);
  character.rotation.y = player.rotation;

  // Lean into turns — whole body tilts like a real rider
  character.rotation.z = -player.edgeAngle * 0.6;

  // Forward lean based on speed — crouch lower at higher speeds
  const speedLean = Math.min(player.speed * 0.008, 0.15);
  character.rotation.x = speedLean;

  // Trick rotation while airborne
  if (player.airborne) {
    character.rotation.x = player.trickRotation;
  }
}
