import * as THREE from "three";
import { CONFIG } from "@/game/config";
import { getTerrainHeight } from "@/game/terrain";

interface Chunk {
  mesh: THREE.Mesh;
  chunkZ: number; // chunk index along Z axis
}

export class TerrainChunkManager {
  private chunks: Chunk[] = [];
  private scene: THREE.Scene;
  private geometry: THREE.PlaneGeometry;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.geometry = new THREE.PlaneGeometry(
      CONFIG.chunkSize,
      CONFIG.chunkSize,
      CONFIG.chunkSegments,
      CONFIG.chunkSegments
    );
    this.geometry.rotateX(-Math.PI / 2);
  }

  private createChunk(chunkZ: number): Chunk {
    const geo = this.geometry.clone();
    const posAttr = geo.getAttribute("position");
    const colors = new Float32Array(posAttr.count * 3);

    const worldZ = chunkZ * CONFIG.chunkSize;
    const halfSize = CONFIG.chunkSize / 2;

    for (let i = 0; i < posAttr.count; i++) {
      const localX = posAttr.getX(i);
      const localZ = posAttr.getZ(i);
      const worldX = localX;
      const wZ = worldZ + localZ;

      const height = getTerrainHeight(worldX, wZ);
      posAttr.setY(i, height);

      // Vertex colors: snow white with altitude tinting
      const snowBase = 0.92 + Math.random() * 0.08;
      const altitudeTint = Math.max(0, Math.min(1, (height + 20) / 40));
      colors[i * 3] = snowBase * (0.85 + altitudeTint * 0.15);
      colors[i * 3 + 1] = snowBase * (0.88 + altitudeTint * 0.12);
      colors[i * 3 + 2] = snowBase;
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.0,
      flatShading: false,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 0, worldZ);
    this.scene.add(mesh);

    return { mesh, chunkZ };
  }

  update(playerZ: number) {
    const currentChunk = Math.floor(playerZ / CONFIG.chunkSize);

    // How many chunks ahead and behind to keep
    const ahead = 4;
    const behind = 2;

    // Generate needed chunks
    for (let z = currentChunk - behind; z <= currentChunk + ahead; z++) {
      if (!this.chunks.find((c) => c.chunkZ === z)) {
        if (this.chunks.length >= CONFIG.maxChunks) {
          // Recycle the farthest chunk
          this.recycleFarthest(playerZ);
        }
        this.chunks.push(this.createChunk(z));
      }
    }

    // Remove chunks that are too far behind
    this.chunks = this.chunks.filter((chunk) => {
      if (chunk.chunkZ < currentChunk - behind - 1) {
        this.scene.remove(chunk.mesh);
        chunk.mesh.geometry.dispose();
        (chunk.mesh.material as THREE.Material).dispose();
        return false;
      }
      return true;
    });
  }

  private recycleFarthest(playerZ: number) {
    if (this.chunks.length === 0) return;

    // Find chunk farthest from player
    let farthest = this.chunks[0];
    let maxDist = 0;
    for (const chunk of this.chunks) {
      const dist = Math.abs(chunk.chunkZ * CONFIG.chunkSize - playerZ);
      if (dist > maxDist) {
        maxDist = dist;
        farthest = chunk;
      }
    }

    this.scene.remove(farthest.mesh);
    farthest.mesh.geometry.dispose();
    (farthest.mesh.material as THREE.Material).dispose();
    this.chunks = this.chunks.filter((c) => c !== farthest);
  }

  dispose() {
    for (const chunk of this.chunks) {
      this.scene.remove(chunk.mesh);
      chunk.mesh.geometry.dispose();
      (chunk.mesh.material as THREE.Material).dispose();
    }
    this.chunks = [];
    this.geometry.dispose();
  }
}
