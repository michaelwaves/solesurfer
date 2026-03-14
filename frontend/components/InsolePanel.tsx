"use client";

import { useState, useEffect } from "react";
import { useConnectedDevices } from "@/hooks/useDevices";
import { connectInsoleAdapter, disconnectInsoleAdapter } from "@/input/insole-adapter";

export default function InsolePanel() {
  const connectedDevices = useConnectedDevices();
  const [connecting, setConnecting] = useState(false);
  const [btSupported, setBtSupported] = useState(false);

  useEffect(() => {
    import("brilliantsole/browser")
      .then((BS) => setBtSupported(BS.Environment.isBluetoothSupported))
      .catch(() => setBtSupported(false));
  }, []);

  useEffect(() => {
    if (connectedDevices.length > 0) {
      const cleanup = connectInsoleAdapter(connectedDevices[0]);
      return () => { if (cleanup) cleanup(); };
    } else {
      disconnectInsoleAdapter();
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

  if (!btSupported) return null;

  const isConnected = connectedDevices.length > 0;
  const deviceName = isConnected ? (connectedDevices[0] as any).name || "Insole" : null;

  return (
    <div className="fixed bottom-5 right-5 z-10">
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="glass-dark flex items-center gap-2.5 px-4 py-2.5 text-xs uppercase tracking-widest transition-colors hover:bg-white/10"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isConnected ? "bg-[#e63946]" : connecting ? "bg-white animate-pulse" : "bg-[#707278]"
          }`}
        />
        <span className={isConnected ? "text-white" : "text-[#707278]"}>
          {connecting ? "Connecting" : isConnected ? deviceName : "Connect Insole"}
        </span>
      </button>
    </div>
  );
}
