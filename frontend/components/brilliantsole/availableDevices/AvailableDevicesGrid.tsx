"use client";

import { useAvailableDevices } from "@/hooks/useDevices";
import DevicesGrid from "@/components/brilliantsole/devices/DevicesGrid";
import ToggleDeviceConnectionButton from "@/components/brilliantsole/bluetooth/ToggleDeviceConnectionButton";
import VibrateDeviceButton from "@/components/brilliantsole/devices/VibrateDeviceButton";

export default function AvailableDevicesGrid({ className }: { className?: string }) {
  const availableDevices = useAvailableDevices();

  return (
    <DevicesGrid
      className={className}
      devices={availableDevices}
      cellButtons={
        <>
          <ToggleDeviceConnectionButton />
          <VibrateDeviceButton />
        </>
      }
    />
  );
}
