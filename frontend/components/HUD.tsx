"use client";

import { useEffect, useState } from "react";
import { GameState, TrickState } from "@/game/state";
import { inputState } from "@/input/input-state";
import { getTerrainMode } from "@/game/terrain";

interface HUDProps {
  state: GameState | null;
  mode?: string;
  onRestart?: () => void;
}

export default function HUD({ state, mode, onRestart }: HUDProps) {
  const [, refresh] = useState(0);

  // Refresh trick feed display
  useEffect(() => {
    const interval = setInterval(() => refresh((n) => n + 1), 200);
    return () => clearInterval(interval);
  }, []);

  if (!state) return null;

  // Crash screen (freeride tree collision)
  if (state.player.crashed) {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60">
        <div className="text-center">
          <div className="text-[#e63946] text-5xl font-bold uppercase tracking-widest mb-2">
            Wipeout
          </div>
          <div className="text-[#707278] text-sm uppercase tracking-widest mb-1">
            {state.distance.toFixed(0)}m downhill
          </div>
          <div className="text-white text-2xl font-bold font-mono mb-8">
            {state.score.toFixed(0)} pts
          </div>
          {onRestart && (
            <button
              onClick={onRestart}
              className="btn-red px-8 py-3 text-sm uppercase tracking-widest font-medium"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Run ended (halfpipe timer)
  if (state.phase === "paused" && mode === "halfpipe") {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60">
        <div className="text-center">
          <div className="text-white text-5xl font-bold uppercase tracking-widest mb-2">
            Run Complete
          </div>
          <div className="text-[#707278] text-sm uppercase tracking-widest mb-4">
            Trick Score
          </div>
          <div className="text-[#e63946] text-6xl font-bold font-mono mb-8">
            {state.trickScore.toFixed(0)}
          </div>
          {onRestart && (
            <button
              onClick={onRestart}
              className="btn-red px-8 py-3 text-sm uppercase tracking-widest font-medium"
            >
              New Run
            </button>
          )}
        </div>
      </div>
    );
  }

  if (state.phase !== "playing") return null;

  const speed = (state.player.speed * 3.6).toFixed(0);
  const distance = state.distance.toFixed(0);
  const now = performance.now();

  // Filter trick feed to last 3 seconds
  const recentTricks = state.trickFeed.filter((t) => now - t.timestamp < 3000);

  return (
    <>
      {/* Main HUD — top left */}
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

          {/* Score (halfpipe) */}
          {mode === "halfpipe" && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <div className="text-[10px] text-[#707278] uppercase tracking-widest">Score</div>
              <div className="text-xl font-bold text-white font-mono tabular-nums">
                {state.trickScore.toFixed(0)}
              </div>
            </div>
          )}

          {/* Timer (halfpipe) */}
          {mode === "halfpipe" && (
            <div className={`text-sm font-mono tabular-nums mt-1 ${state.runTimer < 10 ? "text-[#e63946]" : "text-[#707278]"}`}>
              {Math.ceil(state.runTimer)}s
            </div>
          )}

          {/* Airborne */}
          {state.player.airborne && (
            <div className="mt-2 text-[#e63946] text-[10px] font-bold uppercase tracking-widest">
              Airborne {state.player.airborneTime.toFixed(1)}s
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

      {/* Trick feed — center screen */}
      {recentTricks.length > 0 && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none text-center">
          {recentTricks.map((trick, i) => {
            const age = (now - trick.timestamp) / 1000;
            const opacity = Math.max(0, 1 - age / 3);
            const scale = 1 + (1 - age / 3) * 0.3;
            return (
              <div
                key={trick.timestamp}
                style={{ opacity, transform: `scale(${scale}) translateY(${-i * 40}px)` }}
              >
                <div className="text-white text-3xl font-bold uppercase tracking-wider">
                  {trick.name}
                </div>
                <div className="text-[#e63946] text-lg font-bold font-mono">
                  +{trick.points}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
