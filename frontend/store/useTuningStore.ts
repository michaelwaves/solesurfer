import { create } from "zustand";

interface TuningState {
  steerSpeed: number;
  leanFactor: number;
  yawFactor: number;
  set: (key: keyof Omit<TuningState, "set">, value: number) => void;
}

export const useTuningStore = create<TuningState>((set) => ({
  steerSpeed: 100,
  leanFactor: 1,
  yawFactor: 3,
  set: (key, value) => set({ [key]: value }),
}));
