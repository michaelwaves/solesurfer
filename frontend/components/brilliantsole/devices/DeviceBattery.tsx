"use client";

import { useDeviceContext } from "@/context/DeviceContext";
import { useDeviceBatteryLevel, useDeviceIsCharging, useDeviceIsConnected } from "@/hooks/useDeviceState";

export default function DeviceBattery() {
  const device = useDeviceContext()!;
  const batteryLevel = useDeviceBatteryLevel(device);
  const isCharging = useDeviceIsCharging(device);
  const isConnected = useDeviceIsConnected(device);

  if (!isConnected) {
    return null;
  }

  let colorClass: string;
  if (batteryLevel > 70) {
    colorClass = "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
  } else if (batteryLevel > 20) {
    colorClass = "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300";
  } else {
    colorClass = "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
      {isCharging ? "⚡ " : ""}{batteryLevel}%
    </span>
  );
}
