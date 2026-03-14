"use client";

import { useGameStore } from "@/store/useGameStore";
import BluetoothClientWrapper from "@/components/brilliantsole/BluetoothClientWrapper";
import AddDeviceButton from "@/components/brilliantsole/bluetooth/AddDeviceButton";
import AvailableDevicesGrid from "@/components/brilliantsole/availableDevices/AvailableDevicesGrid";

export default function StartScreen() {
  const { phase, startGame, deviceConnected } = useGameStore();

  if (phase !== "idle") return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-purple-950/85 backdrop-blur-sm">
      <div className="flex max-w-sm flex-col items-center gap-6 rounded-2xl bg-white/10 p-8 text-center text-white shadow-2xl backdrop-blur border border-purple-400/20">
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-4xl font-bold tracking-tight text-purple-200">GEM GRAB</h1>
          <p className="text-xs uppercase tracking-widest text-purple-400">by Solesurfer</p>
        </div>

        <div className="w-full rounded-xl bg-purple-900/50 px-4 py-3 text-left text-sm space-y-1.5 border border-purple-500/20">
          <p className="text-purple-200 font-medium text-xs uppercase tracking-wider mb-2">How to play</p>
          <p className="text-purple-100">💎 Collect purple gems for <span className="text-yellow-300 font-semibold">+50 pts</span> each</p>
          <p className="text-purple-100">🌲 Dodge trees and rocks</p>
          <p className="text-purple-100">🏂 Lean forward/back to steer</p>
          <p className="text-purple-100">⌨️ Arrow keys work too</p>
        </div>

        <BluetoothClientWrapper suspense={null}>
          <div className="flex w-full flex-col gap-3">
            <AddDeviceButton />
            <AvailableDevicesGrid className="text-left" />
          </div>
        </BluetoothClientWrapper>

        {deviceConnected && (
          <p className="text-xs text-purple-300">✓ Insoles connected — lean to steer</p>
        )}

        <button
          onClick={startGame}
          className="w-full rounded-xl bg-purple-500 px-6 py-3 text-lg font-semibold text-white transition hover:bg-purple-400 active:scale-95"
        >
          Drop In
        </button>
      </div>
    </div>
  );
}
