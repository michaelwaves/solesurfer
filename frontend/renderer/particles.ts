import * as THREE from "three";
import { CONFIG } from "@/game/config";
import { PlayerState } from "@/game/state";

export class SnowParticles {
  private particles: THREE.Points;
  private positions: Float32Array;
  private velocities: Float32Array;
  private lifetimes: Float32Array;
  private sizes: Float32Array;
  private count: number;

  constructor(scene: THREE.Scene) {
    this.count = CONFIG.maxParticles;
    this.positions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count * 3);
    this.lifetimes = new Float32Array(this.count);
    this.sizes = new Float32Array(this.count);

    this.lifetimes.fill(0);
    this.sizes.fill(0.1);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(this.sizes, 1));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.15,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(geometry, material);
    scene.add(this.particles);
  }

  update(player: PlayerState, dt: number) {
    // Speed factor: 0 at rest, 1 at max speed
    const speedFactor = Math.min(player.speed / 20, 1);

    // More speed = way more particles. Ramps up aggressively.
    const spawnRate = player.airborne ? 0 : speedFactor * speedFactor * 80;

    // Board direction (tail is behind the rider)
    const tailX = -Math.sin(player.rotation);
    const tailZ = Math.cos(player.rotation);

    for (let i = 0; i < this.count; i++) {
      if (this.lifetimes[i] > 0) {
        this.lifetimes[i] -= dt;
        this.positions[i * 3] += this.velocities[i * 3] * dt;
        this.positions[i * 3 + 1] += this.velocities[i * 3 + 1] * dt;
        this.positions[i * 3 + 2] += this.velocities[i * 3 + 2] * dt;
        // Gravity pulls particles down
        this.velocities[i * 3 + 1] -= 4 * dt;
        // Drag slows particles
        this.velocities[i * 3] *= 0.98;
        this.velocities[i * 3 + 2] *= 0.98;
      } else if (Math.random() < spawnRate * dt) {
        // Spawn from the tail of the board with some spread
        const boardSpread = 0.15 + Math.random() * 0.15; // across board width
        const sideSign = Math.random() > 0.5 ? 1 : -1;
        // Perpendicular to board direction
        const perpX = tailZ * sideSign;
        const perpZ = -tailX * sideSign;

        this.positions[i * 3] = player.position.x + tailX * 0.7 + perpX * boardSpread;
        this.positions[i * 3 + 1] = player.position.y + 0.05;
        this.positions[i * 3 + 2] = player.position.z + tailZ * 0.7 + perpZ * boardSpread;

        // Base spray: kick backward from the tail
        const kickStrength = 1 + speedFactor * 4;
        let vx = tailX * kickStrength;
        let vz = tailZ * kickStrength;

        // Carving spray: when edging hard, snow sprays sideways off the edge
        const edgeStrength = Math.abs(player.edgeAngle) * player.speed * 0.5;
        if (edgeStrength > 0.3) {
          const edgeDir = player.edgeAngle > 0 ? 1 : -1;
          vx += perpX * edgeDir * edgeStrength * 2;
          vz += perpZ * edgeDir * edgeStrength * 2;
        }

        // Randomness scales with speed
        const chaos = 0.5 + speedFactor * 1.5;
        vx += (Math.random() - 0.5) * chaos;
        vz += (Math.random() - 0.5) * chaos;

        this.velocities[i * 3] = vx;
        this.velocities[i * 3 + 1] = 0.5 + speedFactor * 2 + Math.random() * 1.5;
        this.velocities[i * 3 + 2] = vz;

        // Bigger particles at higher speed
        this.sizes[i] = 0.08 + speedFactor * 0.12 + Math.random() * 0.05;

        // Longer lifetime at higher speed (bigger rooster tail)
        this.lifetimes[i] = 0.3 + speedFactor * 0.6 + Math.random() * 0.3;
      }
    }

    const posAttr = this.particles.geometry.getAttribute("position") as THREE.BufferAttribute;
    posAttr.needsUpdate = true;

    // Scale overall particle size with speed
    const mat = this.particles.material as THREE.PointsMaterial;
    mat.size = 0.1 + speedFactor * 0.15;
    mat.opacity = 0.5 + speedFactor * 0.4;
  }

  dispose() {
    this.particles.geometry.dispose();
    (this.particles.material as THREE.Material).dispose();
  }
}
