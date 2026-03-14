"use client";

import { GameState } from "@/game/state";
import { inputState } from "@/input/input-state";

interface HUDProps {
  state: GameState | null;
}

export default function HUD({ state }: HUDProps) {
  if (!state || state.phase !== "playing") return null;

  const speed = (state.player.speed * 3.6).toFixed(0); // m/s to km/h
  const distance = (state.distance).toFixed(0);
  const altitude = state.player.position.y.toFixed(1);

  return (
    <div className="fixed top-4 left-4 z-10 pointer-events-none select-none">
      <div className="bg-black/40 backdrop-blur-sm rounded-xl px-5 py-3 text-white space-y-1">
        <div className="text-3xl font-bold tabular-nums">
          {speed} <span className="text-sm font-normal opacity-70">km/h</span>
        </div>
        <div className="text-sm opacity-70 tabular-nums">
          {distance}m downhill
        </div>
        <div className="text-sm opacity-70 tabular-nums">
          alt {altitude}m
        </div>
        {state.player.airborne && (
          <div className="text-yellow-300 text-sm font-bold animate-pulse">
            AIRBORNE
          </div>
        )}
        <div className={`text-xs ${inputState.source === "insole" ? "text-green-400" : "text-zinc-500"}`}>
          {inputState.source === "insole" ? "Insole" : "Keyboard"}
        </div>
      </div>
    </div>
  );
}
