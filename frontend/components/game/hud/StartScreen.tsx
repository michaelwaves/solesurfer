"use client";

import { useGameStore } from "@/store/useGameStore";
import BluetoothClientWrapper from "@/components/brilliantsole/BluetoothClientWrapper";
import AddDeviceButton from "@/components/brilliantsole/bluetooth/AddDeviceButton";
import AvailableDevicesGrid from "@/components/brilliantsole/availableDevices/AvailableDevicesGrid";

export default function StartScreen() {
  const { phase, startGame, deviceConnected } = useGameStore();

  if (phase !== "idle") return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-sky-950/80 backdrop-blur-sm">
      <div className="flex max-w-sm flex-col items-center gap-6 rounded-2xl bg-white/10 p-8 text-center text-white shadow-2xl backdrop-blur">
        <h1 className="text-4xl font-bold tracking-tight">SOLESURFER</h1>
        <p className="text-sm text-zinc-300">
          Dodge trees and rocks. Tilt your insoles to steer.
          <br />
          Arrow keys work too.
        </p>

        <BluetoothClientWrapper suspense={null}>
          <div className="flex w-full flex-col gap-3">
            <AddDeviceButton />
            <AvailableDevicesGrid className="text-left" />
          </div>
        </BluetoothClientWrapper>

        {deviceConnected && (
          <p className="text-xs text-green-300">✓ Insoles connected — tilt to steer</p>
        )}

        <button
          onClick={startGame}
          className="w-full rounded-xl bg-white px-6 py-3 text-lg font-semibold text-sky-950 transition hover:bg-zinc-100 active:scale-95"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
