"use client";

import BluetoothClientWrapper from "@/components/brilliantsole/BluetoothClientWrapper";
import AddDeviceButton from "@/components/brilliantsole/bluetooth/AddDeviceButton";
import AvailableDevicesGrid from "@/components/brilliantsole/availableDevices/AvailableDevicesGrid";

export default function InsoleSection() {
  return (
    <BluetoothClientWrapper
      suspense={
        <p className="text-sm text-[#707278]">Checking Bluetooth...</p>
      }
      notSupported={null}
    >
      <div className="flex flex-col gap-4">
        <AddDeviceButton />
        <AvailableDevicesGrid />
      </div>
    </BluetoothClientWrapper>
  );
}
