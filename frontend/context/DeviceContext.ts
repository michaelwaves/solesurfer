import { Device } from "brilliantsole/browser";
import { createContext, useContext } from "react";

export const DeviceContext = createContext<Device | undefined>(undefined);

export const useDeviceContext = () => useContext(DeviceContext);
