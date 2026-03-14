"use client";

import { useEffect, useState } from "react";
import { GameState } from "@/game/state";
import { inputState } from "@/input/input-state";

interface DebugOverlayProps {
  state: GameState | null;
}

export default function DebugOverlay({ state }: DebugOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [fps, setFps] = useState(0);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "`") setVisible((v) => !v);
    };
    window.addEventListener("keydown", onKey);

    // FPS counter
    let frames = 0;
    let lastFpsTime = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      setFps(Math.round((frames * 1000) / (now - lastFpsTime)));
      frames = 0;
      lastFpsTime = now;
      forceUpdate((n) => n + 1); // refresh input values
    }, 500);

    const countFrame = () => {
      frames++;
      rafId = requestAnimationFrame(countFrame);
    };
    let rafId = requestAnimationFrame(countFrame);

    return () => {
      window.removeEventListener("keydown", onKey);
      clearInterval(interval);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!visible || !state) return null;

  const p = state.player;

  return (
    <div className="fixed top-4 right-4 z-20 bg-black/70 text-green-400 font-mono text-xs px-3 py-2 rounded-lg pointer-events-none select-none space-y-0.5">
      <div>FPS: {fps}</div>
      <div>Phase: {state.phase}</div>
      <div>---</div>
      <div>Pos: {p.position.x.toFixed(1)}, {p.position.y.toFixed(1)}, {p.position.z.toFixed(1)}</div>
      <div>Vel: {p.velocity.x.toFixed(2)}, {p.velocity.y.toFixed(2)}, {p.velocity.z.toFixed(2)}</div>
      <div>Speed: {p.speed.toFixed(1)} m/s</div>
      <div>Rotation: {(p.rotation * 180 / Math.PI).toFixed(1)}°</div>
      <div>Edge: {(p.edgeAngle * 180 / Math.PI).toFixed(1)}°</div>
      <div>Airborne: {p.airborne ? "YES" : "no"}</div>
      <div>---</div>
      <div>Input: {inputState.source}</div>
      <div>Turn: {inputState.turnInput.toFixed(2)}</div>
      <div>Speed: {inputState.speedInput.toFixed(2)}</div>
      <div>Jump: {inputState.jumpInput ? "YES" : "no"}</div>
    </div>
  );
}
