"use client";

import Link from "next/link";
import BluetoothClientWrapper from "@/components/brilliantsole/BluetoothClientWrapper";
import AddDeviceButton from "@/components/brilliantsole/bluetooth/AddDeviceButton";
import AvailableDevicesGrid from "@/components/brilliantsole/availableDevices/AvailableDevicesGrid";
import { useConnectedDevices } from "@/hooks/useDevices";

function StartButton() {
  const connected = useConnectedDevices();
  const hasDevices = connected.length > 0;

  return (
    <Link
      href="/play"
      className={`group relative block w-full text-center px-8 py-5 rounded-2xl font-semibold text-lg transition-all duration-300 ${
        hasDevices
          ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white glow-blue"
          : "bg-white/10 hover:bg-white/15 text-white border border-white/10 hover:border-white/20"
      }`}
    >
      <span className="relative z-10">
        {hasDevices
          ? `Drop In (${connected.length} insole${connected.length > 1 ? "s" : ""} connected)`
          : "Drop In with Keyboard"}
      </span>
      <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050a14] relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/30 via-transparent to-purple-950/20" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />

      <main className="relative mx-auto max-w-2xl px-6 pt-24 pb-16">
        {/* Logo area */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Powered by BrilliantSole + World Labs
          </div>
          <h1 className="text-6xl font-bold tracking-tight mb-4">
            <span className="text-gradient">SoleSurfer</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-md mx-auto leading-relaxed">
            Snowboard with your feet. Ride AI-generated mountains in XR.
          </p>
        </div>

        {/* Insole connection */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
              Insole Connection
            </h2>
            <span className="text-xs text-zinc-500">Optional</span>
          </div>

          <BluetoothClientWrapper
            suspense={
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <span className="w-3 h-3 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
                Checking Bluetooth...
              </div>
            }
            notSupported={null}
          >
            <div className="flex flex-col gap-4">
              <AddDeviceButton />
              <AvailableDevicesGrid />
            </div>
          </BluetoothClientWrapper>
        </div>

        {/* Start */}
        <StartButton />

        {/* Tech badges */}
        <div className="flex items-center justify-center gap-4 mt-12">
          {["WebXR", "Three.js", "World Labs", "BrilliantSole"].map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 text-xs text-zinc-500 bg-white/5 rounded-full border border-white/5"
            >
              {tech}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
}
