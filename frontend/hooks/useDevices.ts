import * as BS from "brilliantsole/browser";
import { useEffect, useState } from "react";

const getConnectedDevices = () => BS.DeviceManager.ConnectedDevices.slice();
const getAvailableDevices = getConnectedDevices;

export function useAvailableDevices() {
  const [availableDevices, setAvailableDevices] = useState(getAvailableDevices());
  const onAvailableDevices = () => {
    setAvailableDevices(getAvailableDevices());
  };
  useEffect(() => {
    BS.DeviceManager.AddEventListener("availableDevices", onAvailableDevices);
    return () => {
      BS.DeviceManager.RemoveEventListener("availableDevices", onAvailableDevices);
    };
  }, []);

  return availableDevices;
}

export function useConnectedDevices() {
  const [connectedDevices, setConnectedDevices] = useState(getConnectedDevices());
  const onConnectedDevices = () => {
    setConnectedDevices(getConnectedDevices());
  };
  useEffect(() => {
    BS.DeviceManager.AddEventListener("connectedDevices", onConnectedDevices);
    return () => {
      BS.DeviceManager.RemoveEventListener("connectedDevices", onConnectedDevices);
    };
  }, []);

  return connectedDevices;
}
