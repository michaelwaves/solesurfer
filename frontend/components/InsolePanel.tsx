"use client";

import { useState, useEffect } from "react";
import { useConnectedDevices } from "@/hooks/useDevices";
import { connectInsoleAdapter, disconnectInsoleAdapter, calibrateInsole, isCalibrated } from "@/input/insole-adapter";

export default function InsolePanel() {
  const connectedDevices = useConnectedDevices();
  const [connecting, setConnecting] = useState(false);
  const [btSupported, setBtSupported] = useState(false);
  const [calState, setCalState] = useState<"none" | "calibrating" | "done">("none");

  useEffect(() => {
    import("brilliantsole/browser")
      .then((BS) => setBtSupported(BS.Environment.isBluetoothSupported))
      .catch(() => setBtSupported(false));
  }, []);

  useEffect(() => {
    if (connectedDevices.length > 0) {
      const cleanup = connectInsoleAdapter(connectedDevices[0]);
      setCalState("calibrating");
      // Poll until calibrated
      const interval = setInterval(() => {
        if (isCalibrated()) {
          setCalState("done");
          clearInterval(interval);
        }
      }, 100);
      return () => {
        clearInterval(interval);
        if (cleanup) cleanup();
      };
    } else {
      disconnectInsoleAdapter();
      setCalState("none");
    }
  }, [connectedDevices]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const BS = await import("brilliantsole/browser");
      await BS.Device.Connect();
    } catch {}
    setConnecting(false);
  };

  const handleRecalibrate = () => {
    calibrateInsole();
    setCalState("calibrating");
    const interval = setInterval(() => {
      if (isCalibrated()) {
        setCalState("done");
        clearInterval(interval);
      }
    }, 100);
  };

  if (!btSupported) return null;

  const isConnected = connectedDevices.length > 0;
  const deviceName = isConnected ? (connectedDevices[0] as any).name || "Insole" : null;

  return (
    <div className="fixed bottom-5 right-5 z-10 flex gap-2">
      {isConnected && calState === "done" && (
        <button
          onClick={handleRecalibrate}
          className="glass-dark px-3 py-2.5 text-xs uppercase tracking-widest text-[#707278] hover:text-white transition-colors"
        >
          Recalibrate
        </button>
      )}
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="glass-dark flex items-center gap-2.5 px-4 py-2.5 text-xs uppercase tracking-widest transition-colors hover:bg-white/10"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            calState === "calibrating"
              ? "bg-yellow-400 animate-pulse"
              : isConnected
              ? "bg-[#e63946]"
              : connecting
              ? "bg-white animate-pulse"
              : "bg-[#707278]"
          }`}
        />
        <span className={isConnected ? "text-white" : "text-[#707278]"}>
          {connecting
            ? "Connecting"
            : calState === "calibrating"
            ? "Calibrating..."
            : isConnected
            ? deviceName
            : "Connect Insole"}
        </span>
      </button>
    </div>
  );
}
