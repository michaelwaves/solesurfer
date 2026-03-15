"use client";

import { useEffect, useState } from "react";
import { imuTelemetry, imuSensitivity } from "@/input/insole-adapter";
import { inputState } from "@/input/input-state";

export default function IMUPanel() {
  const [, forceUpdate] = useState(0);
  const [rollSens, setRollSens] = useState(imuSensitivity.roll);
  const [pitchSens, setPitchSens] = useState(imuSensitivity.pitch);

  // Refresh at ~10fps
  useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), 100);
    return () => clearInterval(interval);
  }, []);

  if (inputState.source !== "insole") return null;

  const t = imuTelemetry;

  // Visual bar for a value between -1 and 1
  const Bar = ({ value, label, color }: { value: number; label: string; color: string }) => {
    const pct = Math.abs(value) * 50;
    const isLeft = value < 0;
    return (
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#707278] w-10 text-right uppercase">{label}</span>
        <div className="flex-1 h-2 bg-white/5 relative">
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/10" />
          <div
            className="absolute top-0 bottom-0"
            style={{
              background: color,
              left: isLeft ? `${50 - pct}%` : "50%",
              width: `${pct}%`,
            }}
          />
        </div>
        <span className="text-[10px] text-[#707278] w-12 tabular-nums font-mono">
          {value.toFixed(2)}
        </span>
      </div>
    );
  };

  return (
    <div className="fixed bottom-14 left-5 z-10 select-none" style={{ width: 260 }}>
      <div className="glass-dark p-3 space-y-2">
        <div className="text-[10px] text-[#707278] uppercase tracking-widest mb-2">
          IMU Telemetry
        </div>

        {/* Raw angles */}
        <div className="grid grid-cols-3 gap-1 text-center">
          <div>
            <div className="text-[10px] text-[#707278]">Roll</div>
            <div className="text-sm text-white font-mono tabular-nums">{t.adjRoll.toFixed(1)}°</div>
          </div>
          <div>
            <div className="text-[10px] text-[#707278]">Pitch</div>
            <div className="text-sm text-white font-mono tabular-nums">{t.adjPitch.toFixed(1)}°</div>
          </div>
          <div>
            <div className="text-[10px] text-[#707278]">Yaw</div>
            <div className="text-sm text-white font-mono tabular-nums">{t.rawYaw.toFixed(1)}°</div>
          </div>
        </div>

        {/* Baseline */}
        <div className="text-[10px] text-[#707278] font-mono">
          base: R{t.baselineRoll.toFixed(1)}° P{t.baselinePitch.toFixed(1)}°
        </div>

        {/* Input bars */}
        <div className="space-y-1 pt-1 border-t border-white/5">
          <Bar value={inputState.turnInput} label="Turn" color="#e63946" />
        </div>
        <div className="text-[10px] text-[#707278] mt-1">
          Pitch → Turn (lean forward/back to steer)
        </div>

        {/* Sensitivity sliders */}
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <div className="text-[10px] text-[#707278] uppercase tracking-widest">
            Sensitivity
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#707278] w-10 text-right">Turn</span>
            <input
              type="range"
              min="0.3"
              max="3"
              step="0.1"
              value={pitchSens}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setPitchSens(v);
                imuSensitivity.pitch = v;
              }}
              className="flex-1 h-1 accent-[#e63946]"
            />
            <span className="text-[10px] text-white w-8 tabular-nums font-mono">
              {pitchSens.toFixed(1)}x
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
