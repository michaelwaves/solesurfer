"use client";

import { useEffect } from "react";
import { useConnectedDevices } from "./useDevices";
import { connectInsoleAdapter, disconnectInsoleAdapter } from "@/input/insole-adapter";

// Bridge: watches for connected BrilliantSole devices and
// connects the first one to the insole input adapter
export function useInsoleInput() {
  const connectedDevices = useConnectedDevices();

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
}
