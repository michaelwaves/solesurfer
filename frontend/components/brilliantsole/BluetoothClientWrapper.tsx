"use client";

import * as BS from "brilliantsole/browser";
import { useEffect, useState } from "react";
import BluetoothNotSupported from "@/components/brilliantsole/bluetooth/BluetoothNotSupported";

export default function BluetoothClientWrapper({
  children,
  suspense,
  notSupported,
}: {
  children: React.ReactNode;
  suspense?: React.ReactNode;
  notSupported?: React.ReactNode;
}) {
  const [isComponentMounted, setIsComponentMounted] = useState(false);

  useEffect(() => setIsComponentMounted(true), []);

  if (!isComponentMounted) {
    return suspense;
  }

  if (!BS.Environment.isBluetoothSupported) {
    return (
      <>
        {notSupported}
        <BluetoothNotSupported />
      </>
    );
  }

  return children;
}
