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
    } catch (e) {
      console.warn("Bluetooth connection failed:", e);
    }
    setConnecting(false);
  };

  if (!btSupported) return null;

  const isConnected = connectedDevices.length > 0;
  const deviceName = isConnected ? (connectedDevices[0] as any).name || "Insole" : null;

  return (
    <div className="fixed bottom-4 right-4 z-10">
      <button
        onClick={handleConnect}
        disabled={connecting}
        className={`glass flex items-center gap-2.5 px-4 py-2.5 text-sm rounded-xl transition-all ${
          isConnected
            ? "border-green-500/20 text-green-300"
            : connecting
            ? "border-yellow-500/20 text-yellow-300"
            : "text-zinc-400 hover:text-white hover:bg-white/10"
        }`}
      >
        <span className="relative flex h-2 w-2">
          {(isConnected || connecting) && (
            <span
              className={`absolute inset-0 rounded-full animate-ping opacity-75 ${
                isConnected ? "bg-green-400" : "bg-yellow-400"
              }`}
            />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isConnected ? "bg-green-400" : connecting ? "bg-yellow-400" : "bg-zinc-600"
            }`}
          />
        </span>
        {connecting ? "Connecting..." : isConnected ? deviceName : "Connect Insole"}
      </button>
    </div>
  );
}
