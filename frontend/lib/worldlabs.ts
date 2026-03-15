const API_BASE = "https://api.worldlabs.ai";

export interface WorldScene {
  id: string;
  name: string;
  spzUrl: string;
  thumbnailUrl: string;
  caption: string;
}

// Pre-baked scenes — use these if API key is not available or scenes are pre-generated.
// Replace these URLs with actual pre-generated scene URLs before the hackathon.
export const PRESET_SCENES: WorldScene[] = [
  {
    id: "preset-1",
    name: "Japanese Alps Powder Bowl",
    spzUrl: "",
    thumbnailUrl: "",
    caption: "Steep powder bowl in the Japanese Alps with fresh snowfall",
  },
  {
    id: "preset-2",
    name: "Alpine Meadow",
    spzUrl: "",
    thumbnailUrl: "",
    caption: "Wide open alpine meadow above treeline with dramatic peaks",
  },
  {
    id: "preset-3",
    name: "Backcountry Chute",
    spzUrl: "",
    thumbnailUrl: "",
    caption: "Narrow tree-lined backcountry chute with deep powder",
  },
];

const CACHE_KEY = "solesurfer_cached_scene";
const CACHE_SPZ_KEY = "solesurfer_cached_spz";

// Save scene metadata + SPZ blob to local storage / IndexedDB
async function cacheScene(scene: WorldScene): Promise<WorldScene> {
  try {
    // Download the SPZ file and store as blob in IndexedDB
    const res = await fetch(scene.spzUrl);
    if (res.ok) {
      const blob = await res.blob();
      await saveSPZBlob(blob);
      // Store metadata in localStorage
      localStorage.setItem(CACHE_KEY, JSON.stringify(scene));
      console.log(`Cached scene: ${scene.name} (${(blob.size / 1024).toFixed(0)} KB)`);
    }
  } catch (e) {
    console.warn("Failed to cache scene SPZ:", e);
  }
  return scene;
}

// IndexedDB helpers for large SPZ binary
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("solesurfer_cache", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("spz");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveSPZBlob(blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("spz", "readwrite");
    tx.objectStore("spz").put(blob, CACHE_SPZ_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadSPZBlob(): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction("spz", "readonly");
      const req = tx.objectStore("spz").get(CACHE_SPZ_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// Load cached scene — returns scene with a local blob URL for the SPZ
export async function getCachedScene(): Promise<WorldScene | null> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const scene: WorldScene = JSON.parse(raw);
    const blob = await loadSPZBlob();
    if (!blob) return null;
    // Create a blob URL so SparkJS can load it locally
    scene.spzUrl = URL.createObjectURL(blob);
    console.log(`Loaded cached scene: ${scene.name}`);
    return scene;
  } catch {
    return null;
  }
}

export function clearCachedScene() {
  localStorage.removeItem(CACHE_KEY);
  openDB().then((db) => {
    const tx = db.transaction("spz", "readwrite");
    tx.objectStore("spz").delete(CACHE_SPZ_KEY);
  }).catch(() => {});
}

export async function generateScene(
  apiKey: string,
  prompt: string,
  name: string
): Promise<WorldScene> {
  // 1. Start generation
  const genRes = await fetch(`${API_BASE}/marble/v1/worlds:generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "WLT-Api-Key": apiKey,
    },
    body: JSON.stringify({
      display_name: name,
      model: "Marble 0.1-mini",
      world_prompt: {
        type: "text",
        text_prompt: prompt,
      },
    }),
  });

  if (!genRes.ok) {
    const text = await genRes.text();
    throw new Error(`World Labs API error ${genRes.status}: ${text}`);
  }

  const { operation_id } = await genRes.json();

  // 2. Poll until done (timeout 120s)
  const startTime = Date.now();
  const TIMEOUT = 120_000;
  const POLL_INTERVAL = 3_000;

  while (Date.now() - startTime < TIMEOUT) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));

    const pollRes = await fetch(
      `${API_BASE}/marble/v1/operations/${operation_id}`,
      { headers: { "WLT-Api-Key": apiKey } }
    );

    if (!pollRes.ok) {
      throw new Error(`Poll failed: ${pollRes.status}`);
    }

    const op = await pollRes.json();
    if (op.done) {
      const world = op.response;
      const scene: WorldScene = {
        id: world.id,
        name: world.display_name,
        spzUrl: world.assets.splats.spz_urls["100k"],
        thumbnailUrl: world.assets.thumbnail_url || "",
        caption: world.assets.caption || prompt,
      };

      // Cache the scene locally
      await cacheScene(scene);

      return scene;
    }
  }

  throw new Error("Scene generation timed out (120s)");
}
