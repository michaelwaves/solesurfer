"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import { GameState, GameMode } from "@/game/state";
import { WorldScene, PRESET_SCENES, generateScene } from "@/lib/worldlabs";
import HUD from "@/components/HUD";
import DebugOverlay from "@/components/DebugOverlay";
import InsolePanel from "@/components/InsolePanel";

const GameCanvas = dynamic(() => import("@/components/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-zinc-900 flex items-center justify-center">
      <p className="text-white text-lg">Loading game engine...</p>
    </div>
  ),
});

type Screen = "mode" | "scene" | "generating" | "playing";

function ModeSelect({ onSelect }: { onSelect: (mode: GameMode) => void }) {
  return (
    <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center z-50">
      <div className="text-center max-w-lg px-6">
        <h1 className="text-4xl font-bold text-white mb-2">SoleSurfer</h1>
        <p className="text-zinc-400 mb-10">Choose your run</p>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => onSelect("halfpipe")}
            className="w-full px-8 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors text-left"
          >
            <div className="text-lg font-semibold">Halfpipe</div>
            <div className="text-sm text-blue-200 mt-1">
              Carve wall-to-wall, launch off the lip, land tricks
            </div>
          </button>
          <button
            onClick={() => onSelect("freeride")}
            className="w-full px-8 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors text-left"
          >
            <div className="text-lg font-semibold">Freeride</div>
            <div className="text-sm text-emerald-200 mt-1">
              Open mountain run — dodge trees, carve through powder
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function SceneSelect({
  onSelect,
  onSkip,
}: {
  onSelect: (scene: WorldScene | null) => void;
  onSkip: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim() || !apiKey.trim()) return;
    setGenerating(true);
    setError("");
    try {
      const scene = await generateScene(apiKey, prompt, prompt.slice(0, 30));
      onSelect(scene);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
      setGenerating(false);
    }
  };

  const availablePresets = PRESET_SCENES.filter((s) => s.spzUrl);

  return (
    <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center z-50 overflow-y-auto">
      <div className="max-w-2xl w-full px-6 py-12">
        <h2 className="text-3xl font-bold text-white mb-2">Choose Your Mountain</h2>
        <p className="text-zinc-400 mb-8">
          Pick a World Labs AI-generated scene as your backdrop, or ride with procedural terrain.
        </p>

        {/* Pre-generated scenes */}
        {availablePresets.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Pre-generated Scenes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availablePresets.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => onSelect(scene)}
                  className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-left transition-colors"
                >
                  <div className="text-white font-medium">{scene.name}</div>
                  <div className="text-zinc-400 text-sm mt-1">{scene.caption}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Generate new scene */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Generate a New Scene
          </h3>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="World Labs API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none placeholder-zinc-500"
            />
            <input
              type="text"
              placeholder="Describe your mountain (e.g. 'Steep powder bowl in the Japanese Alps')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none placeholder-zinc-500"
            />
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim() || !apiKey.trim()}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition-colors font-medium"
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating (~30s)...
                </span>
              ) : (
                "Generate with World Labs"
              )}
            </button>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
        </div>

        {/* Skip */}
        <button
          onClick={onSkip}
          className="w-full px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
        >
          <div className="font-medium">Skip — Procedural Terrain Only</div>
          <div className="text-zinc-400 text-sm mt-1">
            No AI backdrop, just ride the snow
          </div>
        </button>
      </div>
    </div>
  );
}

export default function PlayPage() {
  const [screen, setScreen] = useState<Screen>("mode");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [mode, setMode] = useState<GameMode>("halfpipe");
  const [sceneUrl, setSceneUrl] = useState<string | undefined>();
  const [restartKey, setRestartKey] = useState(0);
  const [vrSupported, setVrSupported] = useState(false);
  const [vrActive, setVrActive] = useState(false);

  const handleStateUpdate = useCallback((state: GameState) => {
    setGameState((prev) => {
      if (!prev || Date.now() % 100 < 20) {
        return {
          ...state,
          player: {
            ...state.player,
            position: { ...state.player.position },
            velocity: { ...state.player.velocity },
          },
        };
      }
      return prev;
    });
  }, []);

  const handleModeSelect = (m: GameMode) => {
    setMode(m);
    setScreen("scene");
  };

  const handleSceneSelect = (scene: WorldScene | null) => {
    setSceneUrl(scene?.spzUrl || undefined);
    setScreen("playing");
  };

  const handleSkipScene = () => {
    setSceneUrl(undefined);
    setScreen("playing");
  };

  const handleRestart = () => {
    setRestartKey((k) => k + 1);
    setGameState(null);
  };

  const handleChangeMode = () => {
    setScreen("mode");
    setGameState(null);
    setSceneUrl(undefined);
    setRestartKey((k) => k + 1);
  };

  const handleToggleVR = () => {
    const canvas = document.getElementById("game-canvas") as any;
    const renderer = canvas?.__getRenderer?.();
    if (!renderer) return;

    if (vrActive) {
      renderer.__exitVR?.();
      setVrActive(false);
    } else {
      renderer.__enterVR?.();
      setVrActive(true);
    }
  };

  if (screen === "mode") {
    return <ModeSelect onSelect={handleModeSelect} />;
  }

  if (screen === "scene") {
    return <SceneSelect onSelect={handleSceneSelect} onSkip={handleSkipScene} />;
  }

  return (
    <>
      <GameCanvas
        mode={mode}
        sceneUrl={sceneUrl}
        onStateUpdate={handleStateUpdate}
        onVRSupported={setVrSupported}
        restartKey={restartKey}
      />
      <HUD state={gameState} />
      <DebugOverlay state={gameState} />

      <div className="fixed top-4 right-4 z-10 flex gap-2">
        {vrSupported && (
          <button
            onClick={handleToggleVR}
            className={`px-4 py-2 backdrop-blur-sm text-white text-sm rounded-lg transition-colors ${
              vrActive
                ? "bg-red-500/80 hover:bg-red-600/80"
                : "bg-purple-500/80 hover:bg-purple-600/80"
            }`}
          >
            {vrActive ? "Exit VR" : "Enter VR"}
          </button>
        )}
        <button
          onClick={handleRestart}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm rounded-lg transition-colors"
        >
          Restart
        </button>
        <button
          onClick={handleChangeMode}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm rounded-lg transition-colors"
        >
          Change Mode
        </button>
      </div>

      <InsolePanel />
      <div className="fixed bottom-4 left-4 z-10 text-white/40 text-xs pointer-events-none select-none">
        Press ` for debug | A/D to carve | Space to jump
      </div>
    </>
  );
}
