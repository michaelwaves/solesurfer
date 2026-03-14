"use client";

import * as BS from "brilliantsole/browser";
import { useState } from "react";

export default function AddDeviceButton() {
  if (!BS.Environment.isBluetoothSupported) {
    return null;
  }

  const [isConnecting, setIsConnecting] = useState(false);
  const connect = async () => {
    setIsConnecting(true);
    await BS.Device.Connect();
    setIsConnecting(false);
  };

  return (
    <button
      disabled={isConnecting}
      onClick={connect}
      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {isConnecting ? "Connecting…" : "Add Device"}
    </button>
  );
}
