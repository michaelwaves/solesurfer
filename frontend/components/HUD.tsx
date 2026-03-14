"use client";

import { GameState } from "@/game/state";
import { inputState } from "@/input/input-state";

interface HUDProps {
  state: GameState | null;
}

export default function HUD({ state }: HUDProps) {
  if (!state || state.phase !== "playing") return null;

  const speed = (state.player.speed * 3.6).toFixed(0);
  const distance = state.distance.toFixed(0);

  return (
    <div className="fixed top-4 left-4 z-10 pointer-events-none select-none">
      <div className="glass rounded-2xl px-5 py-4 min-w-[140px] scanlines">
        {/* Speed */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-bold tabular-nums text-white tracking-tight">
            {speed}
          </span>
          <span className="text-xs font-medium text-zinc-500 uppercase">km/h</span>
        </div>

        {/* Distance */}
        <div className="text-sm text-zinc-400 tabular-nums mt-1">
          {distance}<span className="text-zinc-600">m</span>
        </div>

        {/* Airborne */}
        {state.player.airborne && (
          <div className="mt-2 px-2 py-0.5 bg-yellow-500/20 rounded-md text-yellow-400 text-xs font-bold tracking-wider text-center animate-pulse">
            AIRBORNE
          </div>
        )}

        {/* Input source */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              inputState.source === "insole" ? "bg-green-400" : "bg-zinc-600"
            }`}
          />
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
            {inputState.source === "insole" ? "Insole" : "Keyboard"}
          </span>
        </div>
      </div>
    </div>
  );
}
