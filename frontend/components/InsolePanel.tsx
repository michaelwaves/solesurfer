"use client";

import { useState, useEffect } from "react";
import { useConnectedDevices } from "@/hooks/useDevices";
import { connectInsoleAdapter, disconnectInsoleAdapter } from "@/input/insole-adapter";

// Compact insole connection panel for the play page.
// Shows connection status + connect button. Auto-bridges to game input.

export default function InsolePanel() {
  const connectedDevices = useConnectedDevices();
  const [connecting, setConnecting] = useState(false);
  const [btSupported, setBtSupported] = useState(false);

  // Check Bluetooth support on mount
  useEffect(() => {
    import("brilliantsole/browser").then((BS) => {
      setBtSupported(BS.Environment.isBluetoothSupported);
    }).catch(() => {
      setBtSupported(false);
    });
  }, []);

  // Bridge: when devices connect/disconnect, update the insole adapter
  useEffect(() => {
    if (connectedDevices.length > 0) {
      const device = connectedDevices[0];
      const cleanup = connectInsoleAdapter(device);
      return () => {
        if (cleanup) cleanup();
      };
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
        className={`flex items-center gap-2 px-4 py-2 backdrop-blur-sm text-sm rounded-lg transition-colors ${
          isConnected
            ? "bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30"
            : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
        }`}
      >
        {/* Status dot */}
        <span
          className={`w-2 h-2 rounded-full ${
            isConnected
              ? "bg-green-400 animate-pulse"
              : connecting
              ? "bg-yellow-400 animate-pulse"
              : "bg-zinc-500"
          }`}
        />
        {connecting
          ? "Connecting..."
          : isConnected
          ? `${deviceName} connected`
          : "Connect Insole"}
      </button>
    </div>
  );
}
