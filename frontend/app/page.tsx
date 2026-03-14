"use client";

import BluetoothClientWrapper from "@/components/brilliantsole/BluetoothClientWrapper";
import AddDeviceButton from "@/components/brilliantsole/bluetooth/AddDeviceButton";
import AvailableDevicesGrid from "@/components/brilliantsole/availableDevices/AvailableDevicesGrid";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="mb-8 text-2xl font-semibold text-zinc-900 dark:text-white">Solesurfer</h1>
        <BluetoothClientWrapper suspense={<p className="text-sm text-zinc-500">Loading…</p>}>
          <div className="flex flex-col gap-8">
            <AddDeviceButton />
            <AvailableDevicesGrid />
          </div>
        </BluetoothClientWrapper>
      </main>
    </div>
  );
}
