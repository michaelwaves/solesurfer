"use client";

import { useDeviceContext } from "@/context/DeviceContext";
import { useState } from "react";
import clsx from "clsx";

export default function VibrateDeviceButton() {
  const device = useDeviceContext()!;
  const [isVibrating, setIsVibrating] = useState(false);

  const triggerVibration = () => {
    setIsVibrating(true);
    device.triggerVibration([{ type: "waveformEffect", segments: [{ effect: "buzz100" }] }]);
    setTimeout(() => {
      setIsVibrating(false);
    }, 300);
  };

  return (
    <button
      disabled={!device.isConnected || isVibrating}
      onClick={triggerVibration}
      className={clsx(
        "flex-1 rounded-md bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-400 disabled:opacity-50",
        isVibrating ? "animate-pulse" : ""
      )}
    >
      {isVibrating ? "🔔 Vibrating…" : "🔔 Vibrate"}
    </button>
  );
}
