"use client";

import { useState, useEffect } from "react";
import { useGameStore } from "@/store/useGameStore";
import AddDeviceButton from "@/components/brilliantsole/bluetooth/AddDeviceButton";
import BluetoothClientWrapper from "@/components/brilliantsole/BluetoothClientWrapper";
import { recalibrateGemGrab, isGemGrabCalibrated } from "@/hooks/useSensorOrientation";

function r(n: number) {
  return n.toFixed(3).padStart(7);
}

function RecalibrateButton() {
  const [calState, setCalState] = useState<"ready" | "calibrating">("ready");

  const handleRecalibrate = () => {
    recalibrateGemGrab();
    setCalState("calibrating");
    const interval = setInterval(() => {
      if (isGemGrabCalibrated()) {
        setCalState("ready");
        clearInterval(interval);
      }
    }, 100);
  };

  return (
    <button
      onClick={handleRecalibrate}
      className="pointer-events-auto rounded-lg bg-black/40 px-3 py-1.5 text-xs uppercase tracking-widest text-zinc-400 backdrop-blur hover:text-white transition-colors"
    >
      {calState === "calibrating" ? "Calibrating..." : "Recalibrate"}
    </button>
  );
}

export default function HUD() {
  const { phase, speed, distance, score, deviceConnected, boardRoll, boardPitch, boardYaw, quatRaw } =
    useGameStore();

  if (phase !== "playing") return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">

      {/* Score — top center */}
      <div className="absolute left-1/2 top-4 -translate-x-1/2 flex flex-col items-center gap-0.5">
        <div className="rounded-xl bg-black/50 px-5 py-2 text-2xl font-bold tabular-nums text-yellow-300 backdrop-blur">
          {Math.round(score).toLocaleString()}
        </div>
        <div className="text-xs text-white/60">{Math.round(distance)}m · {speed.toFixed(1)} u/s</div>
      </div>

      {/* Sensor debug — bottom left */}
      <div className="absolute bottom-4 left-4 rounded-xl bg-black/60 px-3 py-2 font-mono text-xs text-white backdrop-blur leading-5">
        {deviceConnected ? (
          <>
            <div className="mb-1 text-[10px] uppercase tracking-widest text-zinc-400">Euler (YXZ)</div>
            <div>roll  <span className="text-cyan-300">{r(boardRoll)}</span> rad</div>
            <div>pitch <span className="text-green-300">{r(boardPitch)}</span> rad</div>
            <div>yaw   <span className="text-purple-300">{r(boardYaw)}</span> rad</div>
            <div className="mt-1 border-t border-white/10 pt-1 text-[10px] uppercase tracking-widest text-zinc-400">Quaternion</div>
            <div>x <span className="text-red-300">{r(quatRaw.x)}</span>  y <span className="text-green-300">{r(quatRaw.y)}</span></div>
            <div>z <span className="text-blue-300">{r(quatRaw.z)}</span>  w <span className="text-yellow-200">{r(quatRaw.w)}</span></div>
          </>
        ) : (
          <span className="text-zinc-500">no sensor</span>
        )}
      </div>

      {/* Device status — top right */}
      <div className="absolute right-4 top-4 flex gap-2">
        {deviceConnected && (
          <RecalibrateButton />
        )}
        {deviceConnected ? (
          <div className="flex items-center gap-1.5 rounded-lg bg-black/40 px-3 py-1.5 text-sm text-white backdrop-blur">
            <span className="inline-block size-2 rounded-full bg-green-400" />
            Insoles connected
          </div>
        ) : (
          <div className="pointer-events-auto flex items-center gap-2 rounded-lg bg-black/60 px-3 py-1.5 backdrop-blur">
            <span className="text-xs text-zinc-300">No insoles —</span>
            <BluetoothClientWrapper>
              <AddDeviceButton />
            </BluetoothClientWrapper>
          </div>
        )}
      </div>

      {/* Keyboard hint when no sensor */}
      {!deviceConnected && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-black/40 px-4 py-2 text-sm text-zinc-200 backdrop-blur">
          ← → arrow keys to steer
        </div>
      )}
    </div>
  );
}
