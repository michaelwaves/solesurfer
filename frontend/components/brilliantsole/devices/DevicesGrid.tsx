"use client";

import React from "react";
import DeviceCell from "./DeviceCell";
import clsx from "clsx";
import { DeviceContext } from "@/context/DeviceContext";
import { DevicesContext, SetDevicesType } from "@/context/DevicesContext";
import { Device } from "brilliantsole/browser";

export default function DevicesGrid({
  className,
  devices,
  setDevices,
  cellButtons,
}: {
  className?: string;
  devices: Device[];
  setDevices?: SetDevicesType;
  cellButtons?: React.ReactNode;
}) {
  if (devices.length === 0) {
    return null;
  }

  return (
    <DevicesContext.Provider value={{ devices, setDevices }}>
      <ul
        role="list"
        className={clsx(
          className,
          "grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
        )}
      >
        {devices.map((device) => (
          <React.Fragment key={device.bluetoothId}>
            <DeviceContext.Provider value={device}>
              <DeviceCell>{cellButtons}</DeviceCell>
            </DeviceContext.Provider>
          </React.Fragment>
        ))}
      </ul>
    </DevicesContext.Provider>
  );
}
