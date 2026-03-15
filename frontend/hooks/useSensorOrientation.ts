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

// Calibration state
const AUTO_CAL_SAMPLES = 30; // ~0.6s at 20ms rate
let calSamples: { roll: number; pitch: number }[] = [];
let baselineRoll = 0;
let baselinePitch = 0;
let calibrated = false;

export function isGemGrabCalibrated(): boolean {
  return calibrated;
}

export function recalibrateGemGrab() {
  calSamples = [];
  calibrated = false;
  baselineRoll = 0;
  baselinePitch = 0;
  console.log("Gem Grab recalibration started — stand flat for ~0.5s");
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
      // Reset calibration on new connection
      calSamples = [];
      calibrated = false;
      baselineRoll = 0;
      baselinePitch = 0;
      // request gameRotation at 20 Hz
      device.setSensorConfiguration({ gameRotation: 20 });

      sensorHandler = (event) => {
        if (event.message.sensorType !== "gameRotation") return;
        const q = event.message.gameRotation;
        const euler = quaternionToEuler(q);
        setQuatRaw({ x: q.x, y: q.y, z: q.z, w: q.w });

        const rawRoll = -euler.z;
        const rawPitch = euler.x;

        // Auto-calibration: average first N samples as baseline
        if (!calibrated) {
          calSamples.push({ roll: rawRoll, pitch: rawPitch });
          if (calSamples.length >= AUTO_CAL_SAMPLES) {
            baselineRoll = calSamples.reduce((s, v) => s + v.roll, 0) / calSamples.length;
            baselinePitch = calSamples.reduce((s, v) => s + v.pitch, 0) / calSamples.length;
            calibrated = true;
            console.log(`Gem Grab calibrated — baseline roll: ${baselineRoll.toFixed(3)}, pitch: ${baselinePitch.toFixed(3)}`);
          }
          return;
        }

        setBoardRoll(rawRoll - baselineRoll);
        setBoardPitch(rawPitch - baselinePitch);
        setBoardYaw(euler.y);
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
      calSamples = [];
      calibrated = false;
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
