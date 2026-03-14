import { Device } from "brilliantsole/browser";
import { useEffect, useState } from "react";

export function useDeviceType(device: Device) {
  const [type, setType] = useState(device.type);
  useEffect(() => {
    const onType = () => setType(device.type);
    device.addEventListener("getType", onType);
    return () => {
      device.removeEventListener("getType", onType);
    };
  }, []);

  return type;
}

export function useDeviceName(device?: Device) {
  if (!device) {
    return "";
  }

  const [name, setName] = useState(device.name);
  useEffect(() => {
    const onName = () => setName(device.name);
    device.addEventListener("getName", onName);
    return () => {
      device.removeEventListener("getName", onName);
    };
  }, []);

  return name;
}

export function useDeviceBatteryLevel(device: Device) {
  const [batteryLevel, setBatteryLevel] = useState(device.batteryLevel);
  useEffect(() => {
    const onBatteryLevel = () => setBatteryLevel(device.batteryLevel);
    device.addEventListener("batteryLevel", onBatteryLevel);
    return () => {
      device.removeEventListener("batteryLevel", onBatteryLevel);
    };
  }, []);

  return batteryLevel;
}

export function useDeviceIsCharging(device: Device) {
  const [isCharging, setIsCharging] = useState(device.isCharging);
  useEffect(() => {
    const onIsCharging = () => setIsCharging(device.isCharging);
    device.addEventListener("isCharging", onIsCharging);
    return () => {
      device.removeEventListener("isCharging", onIsCharging);
    };
  }, []);

  return isCharging;
}

export function useDeviceIsConnected(device: Device) {
  const [isConnected, setIsConnected] = useState(device.isConnected);
  useEffect(() => {
    const onIsConnected = () => setIsConnected(device.isConnected);
    device.addEventListener("isConnected", onIsConnected);
    return () => {
      device.removeEventListener("isConnected", onIsConnected);
    };
  }, []);

  return isConnected;
}

export function useDeviceConnectionStatus(device: Device) {
  const [connectionStatus, setConnectionStatus] = useState(device.connectionStatus);
  useEffect(() => {
    const onConnectionStatus = () => setConnectionStatus(device.connectionStatus);
    device.addEventListener("connectionStatus", onConnectionStatus);
    return () => {
      device.removeEventListener("connectionStatus", onConnectionStatus);
    };
  }, []);

  return connectionStatus;
}
