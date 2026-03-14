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
      className="btn-red block w-full text-center px-8 py-4 rounded-none font-medium text-base tracking-wide uppercase"
    >
      {hasDevices
        ? `Drop In — ${connected.length} insole${connected.length > 1 ? "s" : ""} connected`
        : "Drop In"}
    </Link>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-[#111] text-white">
        <div className="mx-auto max-w-6xl px-6 py-32">
          <p className="text-xs uppercase tracking-[0.3em] text-[#707278] mb-6">
            BrilliantSole + World Labs + WebXR
          </p>
          <h1 className="text-7xl font-bold tracking-tight leading-[0.95] mb-6">
            Sole<br />Surfer
          </h1>
          <p className="text-lg text-[#707278] max-w-md leading-relaxed">
            Snowboard with your feet. Ride AI-generated mountains.
            Feel every carve through smart insoles.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Left: Connect */}
          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] text-[#707278] mb-6">
              Connect Your Insoles
            </h2>
            <p className="text-sm text-[#707278] mb-8 leading-relaxed">
              Pair your BrilliantSole insoles via Bluetooth for foot-controlled
              snowboarding. Or use keyboard controls — your call.
            </p>

            <BluetoothClientWrapper
              suspense={
                <p className="text-sm text-[#707278]">Checking Bluetooth...</p>
              }
              notSupported={null}
            >
              <div className="flex flex-col gap-4 mb-8">
                <AddDeviceButton />
                <AvailableDevicesGrid />
              </div>
            </BluetoothClientWrapper>

            <StartButton />
          </div>

          {/* Right: How it works */}
          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] text-[#707278] mb-6">
              How It Works
            </h2>
            <div className="space-y-8">
              {[
                {
                  num: "01",
                  title: "Choose Your Run",
                  desc: "Halfpipe or freeride. Pick an AI-generated mountain backdrop or ride procedural terrain.",
                },
                {
                  num: "02",
                  title: "Carve With Your Feet",
                  desc: "Roll your foot to turn. Lean to control speed. Gravity does the rest — just like real snow.",
                },
                {
                  num: "03",
                  title: "Enter XR",
                  desc: "Put on a PICO headset for full immersion. WebXR drops you on the mountain.",
                },
              ].map((step) => (
                <div key={step.num} className="flex gap-4">
                  <span className="text-[#e63946] font-bold text-sm tabular-nums mt-0.5">
                    {step.num}
                  </span>
                  <div>
                    <h3 className="font-semibold text-[#111] mb-1">{step.title}</h3>
                    <p className="text-sm text-[#707278] leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#eef1f5]">
        <div className="mx-auto max-w-6xl px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {["WebXR", "Three.js", "World Labs", "BrilliantSole"].map((tech) => (
              <span key={tech} className="text-xs text-[#707278] uppercase tracking-wider">
                {tech}
              </span>
            ))}
          </div>
          <span className="text-xs text-[#d8dde5]">2026</span>
        </div>
      </div>
    </div>
  );
}
