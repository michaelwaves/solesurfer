"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useEffect } from "react";
import { GameState, GameMode } from "@/game/state";
import { WorldScene, PRESET_SCENES, generateScene, getCachedScene, clearCachedScene } from "@/lib/worldlabs";
import HUD from "@/components/HUD";
import DebugOverlay from "@/components/DebugOverlay";
import InsolePanel from "@/components/InsolePanel";
import IMUPanel from "@/components/IMUPanel";

const GameCanvas = dynamic(() => import("@/components/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#707278] text-xs uppercase tracking-widest">Loading</p>
      </div>
    </div>
  ),
});

const GemGrabGame = dynamic(() => import("@/components/game/Game"), { ssr: false });

type Screen = "mode" | "scene" | "playing";

// ──────────────────────────────────────────
// MODE SELECT
// ──────────────────────────────────────────
function ModeSelect({ onSelect }: { onSelect: (mode: GameMode) => void }) {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="max-w-md w-full px-6">
        <a href="/" className="text-[#707278] hover:text-white text-xs uppercase tracking-widest mb-12 inline-block transition-colors no-underline">
          &larr; Home
        </a>
        <p className="text-xs uppercase tracking-[0.3em] text-[#707278] mb-4">
          Select Mode
        </p>
        <h1 className="text-5xl font-bold text-white tracking-tight mb-16">
          Sole<span className="text-[#e63946]">Surfer</span>
        </h1>

        <div className="space-y-3">
          <button
            onClick={() => onSelect("halfpipe")}
            className="btn-outline-light w-full text-left px-6 py-5 flex items-center gap-5 group"
          >
            <span className="text-[#e63946] font-bold text-xs tabular-nums">01</span>
            <div>
              <div className="font-semibold tracking-wide">Halfpipe</div>
              <div className="text-xs text-[#707278] mt-0.5 group-hover:text-[#707278]">
                Carve wall-to-wall, launch off the lip
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelect("freeride")}
            className="btn-outline-light w-full text-left px-6 py-5 flex items-center gap-5 group"
          >
            <span className="text-[#e63946] font-bold text-xs tabular-nums">02</span>
            <div>
              <div className="font-semibold tracking-wide">Freeride</div>
              <div className="text-xs text-[#707278] mt-0.5 group-hover:text-[#707278]">
                Open mountain — dodge trees, carve powder
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelect("gem_grab")}
            className="btn-outline-light w-full text-left px-6 py-5 flex items-center gap-5 group"
          >
            <span className="text-[#b44fff] font-bold text-xs tabular-nums">03</span>
            <div>
              <div className="font-semibold tracking-wide">Gem Grab</div>
              <div className="text-xs text-[#707278] mt-0.5 group-hover:text-[#707278]">
                Dodge obstacles, collect purple gems
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
  const [cachedScene, setCachedScene] = useState<WorldScene | null>(null);
  const [loadingCache, setLoadingCache] = useState(true);

  // Load cached scene on mount
  useEffect(() => {
    getCachedScene().then((scene) => {
      setCachedScene(scene);
      setLoadingCache(false);
    });
  }, []);

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

  const handleClearCache = () => {
    clearCachedScene();
    setCachedScene(null);
  };

  const availablePresets = PRESET_SCENES.filter((s) => s.spzUrl);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50 overflow-y-auto">
      <div className="max-w-lg w-full px-6 py-16">
        <button
          onClick={onBack}
          className="text-[#707278] hover:text-white text-xs uppercase tracking-widest mb-12 transition-colors"
        >
          &larr; Back
        </button>

        <p className="text-xs uppercase tracking-[0.3em] text-[#707278] mb-4">
          World Labs AI
        </p>
        <h2 className="text-3xl font-bold text-white tracking-tight mb-12">
          Choose Your<br />Mountain
        </h2>

        {/* Cached scene — last generated, stored locally */}
        {!loadingCache && cachedScene && (
          <div className="mb-10">
            <p className="text-xs uppercase tracking-widest text-[#707278] mb-4">
              Last Generated
            </p>
            <button
              onClick={() => onSelect(cachedScene)}
              className="btn-outline-light w-full text-left px-5 py-4 mb-2"
            >
              <div className="font-medium text-sm">{cachedScene.name}</div>
              <div className="text-xs text-[#707278] mt-0.5">{cachedScene.caption}</div>
              <div className="text-[10px] text-green-400/60 mt-1 uppercase tracking-widest">Cached locally</div>
            </button>
            <button
              onClick={handleClearCache}
              className="text-[10px] text-[#707278] hover:text-[#e63946] uppercase tracking-widest transition-colors"
            >
              Clear cache
            </button>
          </div>
        )}

        {/* Pre-generated scenes */}
        {availablePresets.length > 0 && (
          <div className="mb-10">
            <p className="text-xs uppercase tracking-widest text-[#707278] mb-4">
              Generated Scenes
            </p>
            <div className="space-y-2">
              {availablePresets.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => onSelect(scene)}
                  className="btn-outline-light w-full text-left px-5 py-4"
                >
                  <div className="font-medium text-sm">{scene.name}</div>
                  <div className="text-xs text-[#707278] mt-0.5">{scene.caption}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Generate new */}
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-[#707278] mb-4">
            Generate New
          </p>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-3 bg-transparent text-white border border-white/20 focus:border-[#e63946] focus:outline-none placeholder-[#707278] text-sm transition-colors"
            />
            <input
              type="text"
              placeholder="Describe your mountain..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              className="w-full px-4 py-3 bg-transparent text-white border border-white/20 focus:border-[#e63946] focus:outline-none placeholder-[#707278] text-sm transition-colors"
            />
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim() || !apiKey.trim()}
              className="btn-red w-full px-6 py-3 text-sm uppercase tracking-widest font-medium disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {generating ? "Generating..." : "Generate"}
            </button>
            {error && <p className="text-[#e63946] text-xs mt-2">{error}</p>}
          </div>
        </div>

        {/* Skip */}
        <button
          onClick={onSkip}
          className="btn-outline-light w-full text-left px-5 py-4"
        >
          <div className="font-medium text-sm">Procedural Terrain</div>
          <div className="text-xs text-[#707278] mt-0.5">Skip AI — ride pure snow</div>
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
    // Gem Grab is self-contained — skip the World Labs scene picker
    setScreen(m === "gem_grab" ? "playing" : "scene");
  };
  const handleSceneSelect = (scene: WorldScene | null) => { setSceneUrl(scene?.spzUrl || undefined); setScreen("playing"); };
  const handleSkipScene = () => { setSceneUrl(undefined); setScreen("playing"); };
  const handleRestart = () => { setRestartKey((k) => k + 1); setGameState(null); };
  const handleChangeMode = () => { setScreen("mode"); setGameState(null); setSceneUrl(undefined); setRestartKey((k) => k + 1); };
  const handleToggleVR = () => {
    const canvas = document.getElementById("game-canvas") as any;
    const renderer = canvas?.__getRenderer?.();
    if (!renderer) return;
    if (vrActive) { renderer.__exitVR?.(); setVrActive(false); }
    else { renderer.__enterVR?.(); setVrActive(true); }
  };

  if (screen === "mode") return <ModeSelect onSelect={handleModeSelect} />;
  if (screen === "scene") return <SceneSelect onSelect={handleSceneSelect} onSkip={handleSkipScene} onBack={() => setScreen("mode")} />;

  if (mode === "gem_grab") {
    return (
      <>
        <GemGrabGame />
        <div className="fixed top-5 right-5 z-10">
          <button onClick={handleChangeMode} className="btn-outline-light px-4 py-2 text-xs uppercase tracking-widest font-medium">
            Menu
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <GameCanvas mode={mode} sceneUrl={sceneUrl} onStateUpdate={handleStateUpdate} onVRSupported={setVrSupported} restartKey={restartKey} />
      <HUD state={gameState} mode={mode} onRestart={handleRestart} />
      <DebugOverlay state={gameState} />

      {/* Top-right controls */}
      <div className="fixed top-5 right-5 z-10 flex gap-2">
        {vrSupported && (
          <button
            onClick={handleToggleVR}
            className={`px-4 py-2 text-xs uppercase tracking-widest font-medium transition-all ${
              vrActive ? "btn-red" : "btn-outline-light"
            }`}
          >
            {vrActive ? "Exit VR" : "Enter VR"}
          </button>
        )}
        <button onClick={handleRestart} className="btn-outline-light px-4 py-2 text-xs uppercase tracking-widest font-medium">
          Restart
        </button>
        <button onClick={handleChangeMode} className="btn-outline-light px-4 py-2 text-xs uppercase tracking-widest font-medium">
          Menu
        </button>
        <a href="/" className="btn-outline-light inline-block px-4 py-2 text-xs uppercase tracking-widest font-medium no-underline">
          Home
        </a>
      </div>

      <InsolePanel />
      <IMUPanel />

      <div className="fixed bottom-5 left-5 z-10 text-white/20 text-[10px] uppercase tracking-widest pointer-events-none select-none font-mono">
        ` debug &middot; A/D carve &middot; Space jump
      </div>
    </>
  );
}
