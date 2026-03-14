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
      return {
        id: world.id,
        name: world.display_name,
        spzUrl: world.assets.splats.spz_urls["100k"],
        thumbnailUrl: world.assets.thumbnail_url || "",
        caption: world.assets.caption || prompt,
      };
    }
  }

  throw new Error("Scene generation timed out (120s)");
}
