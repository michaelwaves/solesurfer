import * as THREE from "three";
import { CONFIG } from "@/game/config";
import { getTerrainHeight, getTreesInRange } from "@/game/terrain";

interface Chunk {
  mesh: THREE.Mesh;
  trees: THREE.Group;
  chunkZ: number;
}

// Shared tree geometries (reused across all chunks)
let trunkGeo: THREE.CylinderGeometry | null = null;
let foliageGeos: THREE.ConeGeometry[] = [];
let trunkMat: THREE.MeshStandardMaterial | null = null;
let foliageMat: THREE.MeshStandardMaterial | null = null;

function ensureTreeMaterials() {
  if (!trunkGeo) {
    trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, 1.5, 6);
    foliageGeos = [
      new THREE.ConeGeometry(1.2, 2.0, 7),
      new THREE.ConeGeometry(0.9, 1.8, 7),
      new THREE.ConeGeometry(0.6, 1.5, 7),
    ];
    trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.9 });
    foliageMat = new THREE.MeshStandardMaterial({ color: 0x1a5c2a, roughness: 0.8 });
  }
}

function createTree(scale: number): THREE.Group {
  ensureTreeMaterials();
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(trunkGeo!, trunkMat!);
  trunk.position.y = 0.75 * scale;
  trunk.scale.setScalar(scale);
  tree.add(trunk);

  // 3 layered cones for pine tree look
  const heights = [2.2, 3.2, 4.0];
  foliageGeos.forEach((geo, i) => {
    const cone = new THREE.Mesh(geo, foliageMat!);
    cone.position.y = heights[i] * scale;
    cone.scale.setScalar(scale);
    tree.add(cone);
  });

  return tree;
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

    for (let i = 0; i < posAttr.count; i++) {
      const localX = posAttr.getX(i);
      const localZ = posAttr.getZ(i);
      const worldX = localX;
      const wZ = worldZ + localZ;

      const height = getTerrainHeight(worldX, wZ);
      posAttr.setY(i, height);

      const snowBase = 0.94 + Math.random() * 0.06;
      const hNext = getTerrainHeight(worldX + 1, wZ);
      const slopeLocal = Math.abs(height - hNext);
      const shadowTint = Math.min(slopeLocal * 0.3, 0.15);
      colors[i * 3] = snowBase - shadowTint;
      colors[i * 3 + 1] = snowBase - shadowTint * 0.5;
      colors[i * 3 + 2] = snowBase + shadowTint * 0.3;
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

    // Trees for this chunk (freeride mode only)
    const treesGroup = new THREE.Group();
    const treePositions = getTreesInRange(
      worldZ - CONFIG.chunkSize / 2,
      worldZ + CONFIG.chunkSize / 2
    );
    for (const tp of treePositions) {
      const tree = createTree(tp.scale);
      const ty = getTerrainHeight(tp.x, tp.z);
      tree.position.set(tp.x, ty, tp.z);
      treesGroup.add(tree);
    }
    this.scene.add(treesGroup);

    return { mesh, trees: treesGroup, chunkZ };
  }

  update(playerZ: number) {
    const currentChunk = Math.floor(playerZ / CONFIG.chunkSize);
    const ahead = 4;
    const behind = 2;

    for (let z = currentChunk - behind; z <= currentChunk + ahead; z++) {
      if (!this.chunks.find((c) => c.chunkZ === z)) {
        if (this.chunks.length >= CONFIG.maxChunks) {
          this.recycleFarthest(playerZ);
        }
        this.chunks.push(this.createChunk(z));
      }
    }

    this.chunks = this.chunks.filter((chunk) => {
      if (chunk.chunkZ < currentChunk - behind - 1) {
        this.removeChunk(chunk);
        return false;
      }
      return true;
    });
  }

  private removeChunk(chunk: Chunk) {
    this.scene.remove(chunk.mesh);
    chunk.mesh.geometry.dispose();
    (chunk.mesh.material as THREE.Material).dispose();
    this.scene.remove(chunk.trees);
  }

  private recycleFarthest(playerZ: number) {
    if (this.chunks.length === 0) return;
    let farthest = this.chunks[0];
    let maxDist = 0;
    for (const chunk of this.chunks) {
      const dist = Math.abs(chunk.chunkZ * CONFIG.chunkSize - playerZ);
      if (dist > maxDist) {
        maxDist = dist;
        farthest = chunk;
      }
    }
    this.removeChunk(farthest);
    this.chunks = this.chunks.filter((c) => c !== farthest);
  }

  dispose() {
    for (const chunk of this.chunks) {
      this.removeChunk(chunk);
    }
    this.chunks = [];
    this.geometry.dispose();
  }
}
