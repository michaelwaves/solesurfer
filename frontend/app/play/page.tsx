"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import { GameState, GameMode } from "@/game/state";
import HUD from "@/components/HUD";
import DebugOverlay from "@/components/DebugOverlay";

const GameCanvas = dynamic(() => import("@/components/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-zinc-900 flex items-center justify-center">
      <p className="text-white text-lg">Loading game engine...</p>
    </div>
  ),
});

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

export default function PlayPage() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [mode, setMode] = useState<GameMode | null>(null);
  const [restartKey, setRestartKey] = useState(0);

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

  const handleRestart = () => {
    setRestartKey((k) => k + 1);
    setGameState(null);
  };

  const handleChangeMode = () => {
    setMode(null);
    setGameState(null);
    setRestartKey((k) => k + 1);
  };

  if (!mode) {
    return <ModeSelect onSelect={setMode} />;
  }

  return (
    <>
      <GameCanvas mode={mode} onStateUpdate={handleStateUpdate} restartKey={restartKey} />
      <HUD state={gameState} />
      <DebugOverlay state={gameState} />

      {/* Controls overlay */}
      <div className="fixed top-4 right-4 z-10 flex gap-2">
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

      <div className="fixed bottom-4 left-4 z-10 text-white/40 text-xs pointer-events-none select-none">
        Press ` for debug | A/D to carve | Space to jump
      </div>
    </>
  );
}
