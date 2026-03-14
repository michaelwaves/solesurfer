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
    <div className="fixed inset-0 bg-[#050a14] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-400 text-sm">Loading engine...</p>
      </div>
    </div>
  ),
});

type Screen = "mode" | "scene" | "playing";

// ──────────────────────────────────────────
// MODE SELECT
// ──────────────────────────────────────────
function ModeSelect({ onSelect }: { onSelect: (mode: GameMode) => void }) {
  return (
    <div className="fixed inset-0 bg-[#050a14] flex items-center justify-center z-50 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-transparent to-purple-950/30" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

      <div className="relative text-center max-w-xl px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-400 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          SELECT MODE
        </div>

        <h1 className="text-5xl font-bold tracking-tight mb-2">
          <span className="text-gradient">SoleSurfer</span>
        </h1>
        <p className="text-zinc-500 mb-12">Choose your ride</p>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => onSelect("halfpipe")}
            className="group relative w-full text-left transition-all duration-300"
          >
            <div className="relative glass rounded-2xl p-6 hover:bg-white/10 transition-colors overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold">
                    HP
                  </span>
                  <h2 className="text-xl font-bold text-white">Halfpipe</h2>
                </div>
                <p className="text-sm text-zinc-400 ml-11">
                  Carve wall-to-wall, launch off the lip, land tricks
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelect("freeride")}
            className="group relative w-full text-left transition-all duration-300"
          >
            <div className="relative glass rounded-2xl p-6 hover:bg-white/10 transition-colors overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold">
                    FR
                  </span>
                  <h2 className="text-xl font-bold text-white">Freeride</h2>
                </div>
                <p className="text-sm text-zinc-400 ml-11">
                  Open mountain run — dodge trees, carve through powder
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// SCENE SELECT
// ──────────────────────────────────────────
function SceneSelect({
  onSelect,
  onSkip,
  onBack,
}: {
  onSelect: (scene: WorldScene | null) => void;
  onSkip: () => void;
  onBack: () => void;
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
    <div className="fixed inset-0 bg-[#050a14] flex items-center justify-center z-50 overflow-y-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/30 via-transparent to-blue-950/20" />
      <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-2xl w-full px-6 py-16">
        <button
          onClick={onBack}
          className="text-zinc-500 hover:text-zinc-300 text-sm mb-8 flex items-center gap-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-400 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          WORLD LABS AI
        </div>

        <h2 className="text-3xl font-bold text-white mb-2">Choose Your Mountain</h2>
        <p className="text-zinc-500 mb-10">
          Generate an AI-powered 3D backdrop or ride procedural terrain
        </p>

        {/* Pre-generated scenes */}
        {availablePresets.length > 0 && (
          <div className="mb-10">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Generated Scenes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availablePresets.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => onSelect(scene)}
                  className="glass rounded-xl p-5 text-left hover:bg-white/10 transition-colors"
                >
                  <div className="text-white font-medium">{scene.name}</div>
                  <div className="text-zinc-500 text-sm mt-1">{scene.caption}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Generate new scene */}
        <div className="glass rounded-2xl p-6 mb-6">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            Generate New
          </h3>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="World Labs API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 text-white rounded-xl border border-white/10 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/20 placeholder-zinc-600 transition-colors"
            />
            <input
              type="text"
              placeholder="Describe your mountain..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              className="w-full px-4 py-3 bg-white/5 text-white rounded-xl border border-white/10 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/20 placeholder-zinc-600 transition-colors"
            />
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim() || !apiKey.trim()}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-white rounded-xl transition-all font-medium glow-purple disabled:shadow-none"
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
          className="w-full glass rounded-2xl p-5 text-left hover:bg-white/10 transition-colors"
        >
          <div className="font-medium text-white">Procedural Terrain</div>
          <div className="text-zinc-500 text-sm mt-1">
            Skip AI generation — ride pure procedural snow
          </div>
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// PLAY PAGE
// ──────────────────────────────────────────
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
    return (
      <SceneSelect
        onSelect={handleSceneSelect}
        onSkip={handleSkipScene}
        onBack={() => setScreen("mode")}
      />
    );
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

      {/* Top-right controls */}
      <div className="fixed top-4 right-4 z-10 flex gap-2">
        {vrSupported && (
          <button
            onClick={handleToggleVR}
            className={`px-4 py-2 text-sm rounded-xl font-medium transition-all ${
              vrActive
                ? "bg-red-500/80 hover:bg-red-600/80 text-white glow-blue"
                : "bg-gradient-to-r from-purple-600/80 to-blue-600/80 hover:from-purple-500/80 hover:to-blue-500/80 text-white glow-purple"
            }`}
          >
            {vrActive ? "Exit VR" : "Enter VR"}
          </button>
        )}
        <button
          onClick={handleRestart}
          className="glass px-4 py-2 text-sm rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          Restart
        </button>
        <button
          onClick={handleChangeMode}
          className="glass px-4 py-2 text-sm rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          Menu
        </button>
      </div>

      <InsolePanel />

      <div className="fixed bottom-4 left-4 z-10 text-white/25 text-xs pointer-events-none select-none font-mono">
        ` debug | A/D carve | SPACE jump
      </div>
    </>
  );
}
