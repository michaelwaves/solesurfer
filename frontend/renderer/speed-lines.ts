import * as THREE from "three";
import { PlayerState } from "@/game/state";

// Speed lines — white streaks that appear at high speed to convey velocity.
// Lines spawn around the camera edges and streak toward the player.

const MAX_LINES = 40;
const SPEED_THRESHOLD = 8; // m/s (~29 km/h) before lines appear

export class SpeedLines {
  private group: THREE.Group;
  private lines: THREE.Line[];
  private lifetimes: number[];
  private speeds: number[];

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.lines = [];
    this.lifetimes = [];
    this.speeds = [];

    const mat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });

    for (let i = 0; i < MAX_LINES; i++) {
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(6); // 2 points × 3 coords
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const line = new THREE.Line(geo, mat.clone());
      line.visible = false;
      this.group.add(line);
      this.lines.push(line);
      this.lifetimes.push(0);
      this.speeds.push(0);
    }

    scene.add(this.group);
  }

  update(player: PlayerState, camera: THREE.Camera, dt: number) {
    const intensity = Math.max(0, (player.speed - SPEED_THRESHOLD) / (25 - SPEED_THRESHOLD));
    if (intensity <= 0) {
      for (const line of this.lines) line.visible = false;
      return;
    }

    const spawnRate = intensity * 30; // lines per second

    for (let i = 0; i < MAX_LINES; i++) {
      if (this.lifetimes[i] > 0) {
        // Animate existing line
        this.lifetimes[i] -= dt;
        if (this.lifetimes[i] <= 0) {
          this.lines[i].visible = false;
          continue;
        }

        // Stretch line along velocity
        const posAttr = this.lines[i].geometry.getAttribute("position") as THREE.BufferAttribute;
        posAttr.setY(0, posAttr.getY(0) - this.speeds[i] * dt);
        posAttr.setZ(0, posAttr.getZ(0) + this.speeds[i] * dt * 0.5);
        posAttr.needsUpdate = true;

        // Fade out
        const mat = this.lines[i].material as THREE.LineBasicMaterial;
        mat.opacity = Math.min(0.4, this.lifetimes[i] * 2) * intensity;
      } else if (Math.random() < spawnRate * dt) {
        // Spawn new line near camera
        const angle = Math.random() * Math.PI * 2;
        const radius = 2 + Math.random() * 4;
        const x = camera.position.x + Math.cos(angle) * radius;
        const y = camera.position.y + (Math.random() - 0.3) * 3;
        const z = camera.position.z - 3 - Math.random() * 8;

        const len = 0.5 + Math.random() * 1.5;

        const posAttr = this.lines[i].geometry.getAttribute("position") as THREE.BufferAttribute;
        posAttr.setXYZ(0, x, y, z);
        posAttr.setXYZ(1, x, y + len * 0.2, z - len);
        posAttr.needsUpdate = true;

        this.lifetimes[i] = 0.3 + Math.random() * 0.4;
        this.speeds[i] = player.speed * (0.5 + Math.random() * 0.5);
        this.lines[i].visible = true;

        const mat = this.lines[i].material as THREE.LineBasicMaterial;
        mat.opacity = 0.3 * intensity;
      }
    }
  }

  dispose() {
    for (const line of this.lines) {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    }
    this.group.parent?.remove(this.group);
  }
}
