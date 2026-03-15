"use client";

import { useGameStore } from "@/store/useGameStore";
import BluetoothClientWrapper from "@/components/brilliantsole/BluetoothClientWrapper";
import AddDeviceButton from "@/components/brilliantsole/bluetooth/AddDeviceButton";
import AvailableDevicesGrid from "@/components/brilliantsole/availableDevices/AvailableDevicesGrid";

export default function StartScreen() {
  const { phase, startGame, deviceConnected } = useGameStore();

  if (phase !== "idle") return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="flex max-w-sm flex-col items-center gap-6 p-8 text-center text-white">
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-4xl font-bold tracking-tight text-white">GEM GRAB</h1>
          <p className="text-xs uppercase tracking-widest text-white/30">by Solesurfer</p>
        </div>

        <div className="w-full border-t border-white/10 pt-4 text-left space-y-2">
          <p className="text-xs uppercase tracking-widest text-white/30 mb-3">How to play</p>
          <p className="text-sm text-white/70">💎 Collect gems &mdash; <span className="text-white">+50 pts</span> each</p>
          <p className="text-sm text-white/70">🌲 Dodge trees and rocks</p>
          <p className="text-sm text-white/70">🏂 Lean forward/back to steer</p>
          <p className="text-sm text-white/70">⌨️ Arrow keys work too</p>
        </div>

        <BluetoothClientWrapper suspense={null}>
          <div className="flex w-full flex-col gap-3">
            <AddDeviceButton />
            <AvailableDevicesGrid className="text-left" />
          </div>
        </BluetoothClientWrapper>

        {deviceConnected && (
          <p className="text-xs text-white/40">✓ Insoles connected</p>
        )}

        <button
          onClick={startGame}
          className="w-full border border-white/20 px-6 py-3 text-sm font-medium uppercase tracking-widest text-white transition hover:bg-white/10 active:scale-95"
        >
          Drop In
        </button>
      </div>
    </div>
  );
}
