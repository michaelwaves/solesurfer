"use client";

import { useState } from "react";
import { useTuningStore } from "@/store/useTuningStore";

type Param = {
  key: "steerSpeed" | "leanFactor" | "yawFactor";
  label: string;
  min: number;
  max: number;
  step: number;
};

const PARAMS: Param[] = [
  { key: "steerSpeed", label: "Steer Speed", min: 0,   max: 300, step: 1   },
  { key: "leanFactor", label: "Lean",        min: 0,   max: 3,   step: 0.05 },
  { key: "yawFactor",  label: "Yaw",         min: 0,   max: 6,   step: 0.05 },
];

export default function TuningPanel() {
  const [open, setOpen] = useState(false);
  const { steerSpeed, leanFactor, yawFactor, set } = useTuningStore();
  const values = { steerSpeed, leanFactor, yawFactor };

  return (
    <div className="absolute bottom-4 right-4 z-10 pointer-events-auto select-none">
      <button
        onClick={() => setOpen((o) => !o)}
        className="ml-auto flex items-center gap-1.5 rounded-lg bg-black/50 px-3 py-1.5 text-xs text-white/50 backdrop-blur hover:text-white/80 transition-colors"
      >
        <span>⚙</span> Tuning
      </button>

      {open && (
        <div className="mt-2 w-56 rounded-xl bg-black/70 p-4 backdrop-blur space-y-4">
          {PARAMS.map(({ key, label, min, max, step }) => (
            <div key={key}>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-white/50">{label}</span>
                <span className="text-xs font-mono text-white/80">{values[key].toFixed(step < 1 ? 2 : 0)}</span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={values[key]}
                onChange={(e) => set(key, parseFloat(e.target.value))}
                className="w-full accent-purple-400"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
