"use client";

import { useGameStore } from "@/store/useGameStore";

export default function GameOverScreen() {
  const { phase, distance, score, resetGame } = useGameStore();

  if (phase !== "dead") return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-red-950/70 backdrop-blur-sm">
      <div className="flex max-w-xs flex-col items-center gap-6 rounded-2xl bg-white/10 p-8 text-center text-white shadow-2xl backdrop-blur">
        <h2 className="text-4xl font-bold">WIPEOUT</h2>
        <div className="flex flex-col gap-1">
          <div className="text-4xl font-bold text-yellow-300">{Math.round(score).toLocaleString()}</div>
          <div className="text-sm text-zinc-300">points</div>
        </div>
        <p className="text-zinc-300 text-sm">{Math.round(distance)}m travelled</p>
        <button
          onClick={resetGame}
          className="w-full rounded-xl bg-white px-6 py-3 text-lg font-semibold text-red-950 transition hover:bg-zinc-100 active:scale-95"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
