import * as THREE from "three";
import { CONFIG } from "@/game/config";
import { PlayerState } from "@/game/state";

export class SnowParticles {
  private particles: THREE.Points;
  private positions: Float32Array;
  private velocities: Float32Array;
  private lifetimes: Float32Array;
  private count: number;

  constructor(scene: THREE.Scene) {
    this.count = CONFIG.maxParticles;
    this.positions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count * 3);
    this.lifetimes = new Float32Array(this.count);

    // Initialize all particles as dead (lifetime = 0)
    this.lifetimes.fill(0);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.15,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.particles = new THREE.Points(geometry, material);
    scene.add(this.particles);
  }

  update(player: PlayerState, dt: number) {
    const spawnRate = player.airborne ? 0 : Math.min(player.speed * 3, 30);

    for (let i = 0; i < this.count; i++) {
      if (this.lifetimes[i] > 0) {
        // Update living particle
        this.lifetimes[i] -= dt;
        this.positions[i * 3] += this.velocities[i * 3] * dt;
        this.positions[i * 3 + 1] += this.velocities[i * 3 + 1] * dt;
        this.positions[i * 3 + 2] += this.velocities[i * 3 + 2] * dt;
        // Gravity
        this.velocities[i * 3 + 1] -= 3 * dt;
      } else if (Math.random() < spawnRate * dt) {
        // Spawn new particle at player feet
        const spread = 0.5;
        this.positions[i * 3] = player.position.x + (Math.random() - 0.5) * spread;
        this.positions[i * 3 + 1] = player.position.y + 0.1;
        this.positions[i * 3 + 2] = player.position.z + (Math.random() - 0.5) * spread;

        // Spray sideways based on edge angle
        const sprayDir = player.edgeAngle > 0 ? 1 : -1;
        const sprayStrength = Math.abs(player.edgeAngle) * player.speed * 0.3;
        this.velocities[i * 3] = sprayDir * sprayStrength + (Math.random() - 0.5) * 2;
        this.velocities[i * 3 + 1] = 1 + Math.random() * 2;
        this.velocities[i * 3 + 2] = player.velocity.z * 0.2 + (Math.random() - 0.5);

        this.lifetimes[i] = 0.5 + Math.random() * 0.5;
      }
    }

    (this.particles.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
  }

  dispose() {
    this.particles.geometry.dispose();
    (this.particles.material as THREE.Material).dispose();
  }
}
