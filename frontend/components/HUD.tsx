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
    <div className="fixed top-5 left-5 z-10 pointer-events-none select-none">
      <div className="glass-dark rounded-none px-5 py-4 min-w-[120px]">
        {/* Speed */}
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold tabular-nums text-white tracking-tighter font-mono">
            {speed}
          </span>
          <span className="text-[10px] text-[#707278] uppercase tracking-widest">km/h</span>
        </div>

        {/* Distance */}
        <div className="text-xs text-[#707278] tabular-nums mt-1 font-mono">
          {distance}m
        </div>

        {/* Airborne */}
        {state.player.airborne && (
          <div className="mt-2 text-[#e63946] text-[10px] font-bold uppercase tracking-widest">
            Airborne
          </div>
        )}

        {/* Input source */}
        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-white/10">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              inputState.source === "insole" ? "bg-[#e63946]" : "bg-[#707278]"
            }`}
          />
          <span className="text-[10px] text-[#707278] uppercase tracking-widest">
            {inputState.source === "insole" ? "Insole" : "Keyboard"}
          </span>
        </div>
      </div>
    </div>
  );
}
