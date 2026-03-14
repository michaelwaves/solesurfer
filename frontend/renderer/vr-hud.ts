import * as THREE from "three";
import { GameState } from "@/game/state";

// VR HUD — renders speed/distance as a canvas texture on a plane
// that follows the camera in VR space.

export class VRHud {
  private group: THREE.Group;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;
  private mesh: THREE.Mesh;
  private lastUpdate = 0;

  constructor() {
    this.group = new THREE.Group();

    // Canvas for rendering text
    this.canvas = document.createElement("canvas");
    this.canvas.width = 512;
    this.canvas.height = 256;
    this.ctx = this.canvas.getContext("2d")!;

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;

    const geo = new THREE.PlaneGeometry(0.4, 0.2);
    const mat = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      depthTest: false,
    });
    this.mesh = new THREE.Mesh(geo, mat);

    // Position: bottom-left of view, slightly in front
    this.mesh.position.set(-0.3, -0.25, -0.8);
    this.group.add(this.mesh);
  }

  getGroup(): THREE.Group {
    return this.group;
  }

  update(state: GameState, camera: THREE.Camera) {
    // Throttle updates to 5fps — canvas texture uploads are expensive
    const now = performance.now();
    if (now - this.lastUpdate < 200) return;
    this.lastUpdate = now;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.beginPath();
    ctx.roundRect(10, 10, w - 20, h - 20, 20);
    ctx.fill();

    // Speed
    const speed = (state.player.speed * 3.6).toFixed(0);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 72px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(speed, 40, 100);

    ctx.font = "28px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText("km/h", 40 + ctx.measureText(speed).width + 10, 100);

    // Distance
    const dist = Math.abs(state.player.position.z).toFixed(0);
    ctx.font = "32px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(`${dist}m`, 40, 150);

    // Airborne indicator
    if (state.player.airborne) {
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 28px sans-serif";
      ctx.fillText("AIRBORNE", 40, 200);
    }

    // Connection status dot
    ctx.beginPath();
    ctx.arc(w - 50, 50, 12, 0, Math.PI * 2);
    ctx.fillStyle = "#22c55e"; // green = connected
    ctx.fill();

    this.texture.needsUpdate = true;

    // Attach to camera so it follows the head
    this.group.position.copy(camera.position);
    this.group.quaternion.copy(camera.quaternion);
  }

  dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.texture.dispose();
  }
}
