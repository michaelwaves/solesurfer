"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import { GameState } from "@/game/state";
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

export default function PlayPage() {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const handleStateUpdate = useCallback((state: GameState) => {
    // Throttle React re-renders to ~10fps for HUD
    setGameState((prev) => {
      if (!prev || Date.now() % 100 < 20) {
        return { ...state, player: { ...state.player, position: { ...state.player.position }, velocity: { ...state.player.velocity } } };
      }
      return prev;
    });
  }, []);

  return (
    <>
      <GameCanvas onStateUpdate={handleStateUpdate} />
      <HUD state={gameState} />
      <DebugOverlay state={gameState} />
      <div className="fixed bottom-4 left-4 z-10 text-white/40 text-xs pointer-events-none select-none">
        Press ` for debug | WASD to ride | Space to jump
      </div>
    </>
  );
}
