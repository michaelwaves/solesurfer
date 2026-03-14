"use client";

import { useDeviceContext } from "@/context/DeviceContext";
import { useDeviceConnectionStatus } from "@/hooks/useDeviceState";
import clsx from "clsx";

const colorMap = {
  notConnected: "bg-blue-600 hover:bg-blue-500 text-white",
  connecting: "bg-sky-500 hover:bg-sky-400 text-white",
  connected: "bg-red-600 hover:bg-red-500 text-white",
  disconnecting: "bg-rose-500 hover:bg-rose-400 text-white",
};

const labelMap = {
  notConnected: "Connect",
  connecting: "Connecting…",
  connected: "Disconnect",
  disconnecting: "Disconnecting…",
};

export default function ToggleDeviceConnectionButton({ className }: { className?: string }) {
  const device = useDeviceContext()!;
  const connectionStatus = useDeviceConnectionStatus(device);

  return (
    <button
      disabled={device.isConnectionBusy}
      onClick={() => device.toggleConnection()}
      className={clsx(
        "flex-1 rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50",
        colorMap[connectionStatus],
        className
      )}
    >
      {device.isConnectionBusy && <span className="mr-1 inline-block animate-spin">↻</span>}
      {labelMap[connectionStatus]}
    </button>
  );
}
