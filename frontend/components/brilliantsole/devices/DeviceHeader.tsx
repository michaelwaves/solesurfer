"use client";

import { useDeviceContext } from "@/context/DeviceContext";
import { useDeviceName, useDeviceType } from "@/hooks/useDeviceState";
import DeviceIcon from "./DeviceIcon";
import DeviceBattery from "./DeviceBattery";
import clsx from "clsx";

export default function DeviceHeader({
  className,
  showInfo = true,
}: {
  className?: string;
  showInfo?: boolean;
}) {
  const device = useDeviceContext();
  if (!device) {
    return null;
  }

  const name = useDeviceName(device);
  const type = useDeviceType(device);

  return (
    <div className={clsx(className, "flex flex-col gap-2 flex-1 truncate w-full flex-wrap")}>
      <div className="flex items-center gap-x-3">
        <h2 className="truncate text-base font-semibold text-zinc-900 dark:text-white">{name}</h2>
      </div>
      {showInfo && (
        <div className="flex items-center gap-x-3">
          <DeviceIcon type={type} />
          <span className="truncate text-sm text-zinc-500">{type}</span>
          <DeviceBattery />
        </div>
      )}
    </div>
  );
}
