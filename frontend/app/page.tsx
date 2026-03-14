"use client";

import Link from "next/link";
import BluetoothClientWrapper from "@/components/brilliantsole/BluetoothClientWrapper";
import AddDeviceButton from "@/components/brilliantsole/bluetooth/AddDeviceButton";
import AvailableDevicesGrid from "@/components/brilliantsole/availableDevices/AvailableDevicesGrid";
import { useConnectedDevices } from "@/hooks/useDevices";

function StartButton() {
  const connected = useConnectedDevices();
  return (
    <Link
      href="/play"
      className="block w-full text-center px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl transition-colors"
    >
      {connected.length > 0
        ? `Start Riding (${connected.length} insole${connected.length > 1 ? "s" : ""} connected)`
        : "Start with Keyboard"}
    </Link>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-white">
          SoleSurfer
        </h1>
        <p className="mb-8 text-zinc-500 dark:text-zinc-400">
          Snowboard with your feet. Connect BrilliantSole insoles or use keyboard controls.
        </p>

        <div className="flex flex-col gap-6">
          <BluetoothClientWrapper
            suspense={<p className="text-sm text-zinc-500">Loading...</p>}
          >
            <div className="flex flex-col gap-6">
              <AddDeviceButton />
              <AvailableDevicesGrid />
            </div>
          </BluetoothClientWrapper>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <StartButton />
          </div>
        </div>
      </main>
    </div>
  );
}
