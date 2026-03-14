import { Device } from "brilliantsole/browser";
import { createContext, Dispatch, SetStateAction, useContext } from "react";

export type SetDevicesType = Dispatch<SetStateAction<Device[]>>;

export type DevicesContextType = {
  devices: Device[];
  setDevices?: SetDevicesType;
};

export const DevicesContext = createContext<DevicesContextType>({ devices: [] });

export const useDevicesContext = () => useContext(DevicesContext);
