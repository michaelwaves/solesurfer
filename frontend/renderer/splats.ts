import * as THREE from "three";

// SparkJS SplatMesh loader for World Labs Gaussian splats.
// Renders as a visual backdrop behind the procedural terrain.

let SplatMeshClass: any = null;

async function loadSparkJS() {
  if (SplatMeshClass) return SplatMeshClass;
  try {
    const spark = await import("@sparkjsdev/spark");
    SplatMeshClass = spark.SplatMesh;
    return SplatMeshClass;
  } catch (e) {
    console.warn("SparkJS not available, splats disabled:", e);
    return null;
  }
}

export class SplatScene {
  private splatMesh: any = null;
  private scene: THREE.Scene;
  private loading = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  async load(spzUrl: string): Promise<boolean> {
    if (!spzUrl || this.loading) return false;
    this.loading = true;

    // Remove existing splat
    this.dispose();

    try {
      const SplatMesh = await loadSparkJS();
      if (!SplatMesh) {
        this.loading = false;
        return false;
      }

      this.splatMesh = new SplatMesh({ url: spzUrl });

      // Position the splat scene as a backdrop — behind and around the terrain.
      // Scale up so the generated mountain fills the sky.
      this.splatMesh.scale.setScalar(50);
      this.splatMesh.position.set(0, -10, -100);

      // SPZ uses RUB coordinate system (same as OpenGL/Three.js)
      // so no rotation needed.

      this.scene.add(this.splatMesh);
      this.loading = false;
      return true;
    } catch (e) {
      console.error("Failed to load splat scene:", e);
      this.loading = false;
      return false;
    }
  }

  dispose() {
    if (this.splatMesh) {
      this.scene.remove(this.splatMesh);
      if (this.splatMesh.dispose) this.splatMesh.dispose();
      this.splatMesh = null;
    }
  }

  isLoaded(): boolean {
    return this.splatMesh !== null;
  }
}
