import * as THREE from "three";

// SparkJS SplatMesh loader for World Labs Gaussian splats.
// Requires a SparkRenderer bound to the WebGL renderer (same as Gem Grab).

let sparkModule: any = null;

async function loadSparkJS() {
  if (sparkModule) return sparkModule;
  try {
    sparkModule = await import("@sparkjsdev/spark");
    return sparkModule;
  } catch (e) {
    console.warn("SparkJS not available, splats disabled:", e);
    return null;
  }
}

export class SplatScene {
  private splatMesh: any = null;
  private sparkRenderer: any = null;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private loading = false;

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.renderer = renderer;
  }

  async load(spzUrl: string): Promise<boolean> {
    if (!spzUrl || this.loading) return false;
    this.loading = true;

    // Remove existing splat
    this.dispose();

    try {
      const spark = await loadSparkJS();
      if (!spark) {
        this.loading = false;
        return false;
      }

      // Create SparkRenderer — required for SplatMesh to actually render
      this.sparkRenderer = new spark.SparkRenderer({
        renderer: this.renderer,
        maxStdDev: Math.sqrt(5),
      });
      this.scene.add(this.sparkRenderer);

      this.splatMesh = new spark.SplatMesh({ url: spzUrl });

      // Match Gem Grab's approach: fixed position behind the terrain
      this.splatMesh.position.set(0, 8, -15);
      this.splatMesh.quaternion.set(1, 0, 0, 0); // 180° around X
      this.splatMesh.scale.setScalar(7);
      // Render behind terrain/character
      this.splatMesh.renderOrder = -1;

      this.scene.add(this.splatMesh);
      this.loading = false;
      console.log("Splat scene loaded with SparkRenderer");
      return true;
    } catch (e) {
      console.error("Failed to load splat scene:", e);
      this.loading = false;
      return false;
    }
  }

  // Call each frame to keep the splat environment following the camera
  update(camera: THREE.Camera) {
    if (!this.splatMesh) return;
    // Follow the camera so the backdrop is always visible
    this.splatMesh.position.set(
      camera.position.x,
      camera.position.y + 2,
      camera.position.z - 20
    );
  }

  dispose() {
    if (this.splatMesh) {
      this.scene.remove(this.splatMesh);
      if (this.splatMesh.dispose) this.splatMesh.dispose();
      this.splatMesh = null;
    }
    if (this.sparkRenderer) {
      this.scene.remove(this.sparkRenderer);
      if (this.sparkRenderer.dispose) this.sparkRenderer.dispose();
      this.sparkRenderer = null;
    }
  }

  isLoaded(): boolean {
    return this.splatMesh !== null;
  }
}
