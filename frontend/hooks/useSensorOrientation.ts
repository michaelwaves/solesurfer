"use client";

import { useEffect } from "react";
import * as BS from "brilliantsole/browser";
import type { DeviceEventListenerMap, Device } from "brilliantsole/browser";
import { Quaternion as TQuaternion, Euler as TEuler } from "three";
import { useGameStore } from "@/store/useGameStore";

// Reuse Three.js objects to avoid per-event allocation
const tempQ = new TQuaternion();
const tempE = new TEuler();
tempE.reorder("YXZ"); // euler[0]=pitch, euler[1]=yaw, euler[2]=roll

function quaternionToEuler(q: { x: number; y: number; z: number; w: number }) {
  tempQ.set(q.x, q.y, q.z, q.w);
  tempE.setFromQuaternion(tempQ);
  return tempE; // .x=pitch, .y=yaw, .z=roll
}

export function useSensorOrientation() {
  const { setBoardRoll, setBoardPitch, setBoardYaw, setQuatRaw, setDeviceConnected } =
    useGameStore.getState();

  useEffect(() => {
    let currentDevice: Device | null = null;
    let sensorHandler: DeviceEventListenerMap["sensorData"] | null = null;

    const attach = (device: Device) => {
      currentDevice = device;
      setDeviceConnected(true);
      // request gameRotation at 20 Hz
      device.setSensorConfiguration({ gameRotation: 20 });

      sensorHandler = (event) => {
        if (event.message.sensorType !== "gameRotation") return;
        const q = event.message.gameRotation;
        const euler = quaternionToEuler(q);
        setBoardRoll(euler.z);
        setBoardPitch(euler.x);
        setBoardYaw(euler.y);
        setQuatRaw({ x: q.x, y: q.y, z: q.z, w: q.w });
      };
      device.addEventListener("sensorData", sensorHandler);
    };

    const detach = () => {
      if (currentDevice && sensorHandler) {
        currentDevice.setSensorConfiguration({ gameRotation: 0 });
        currentDevice.removeEventListener("sensorData", sensorHandler);
      }
      currentDevice = null;
      sensorHandler = null;
      setDeviceConnected(false);
      setBoardRoll(0);
      setBoardPitch(0);
      setBoardYaw(0);
      setQuatRaw({ x: 0, y: 0, z: 0, w: 1 });
    };

    const onConnectedDevices = () => {
      const devices = BS.DeviceManager.ConnectedDevices;
      if (devices.length > 0 && !currentDevice) {
        attach(devices[0]);
      } else if (devices.length === 0 && currentDevice) {
        detach();
      }
    };

    // Handle already-connected device
    onConnectedDevices();

    BS.DeviceManager.AddEventListener("connectedDevices", onConnectedDevices);
    return () => {
      BS.DeviceManager.RemoveEventListener("connectedDevices", onConnectedDevices);
      detach();
    };
  }, []);
}
