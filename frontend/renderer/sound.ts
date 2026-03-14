import { PlayerState } from "@/game/state";

// Web Audio sound manager — wind and carving sounds.
// Uses oscillators and noise for procedural audio (no external files needed).

export class SoundManager {
  private ctx: AudioContext | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windSource: AudioBufferSourceNode | null = null;
  private carveGain: GainNode | null = null;
  private carveFilter: BiquadFilterNode | null = null;
  private carveSource: AudioBufferSourceNode | null = null;
  private initialized = false;

  // Must be called from a user gesture (click/keydown)
  init() {
    if (this.initialized) return;

    try {
      this.ctx = new AudioContext();

      // --- WIND: filtered white noise ---
      const windBuffer = this.createNoiseBuffer(2);
      this.windSource = this.ctx.createBufferSource();
      this.windSource.buffer = windBuffer;
      this.windSource.loop = true;

      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = "lowpass";
      this.windFilter.frequency.value = 300;

      this.windGain = this.ctx.createGain();
      this.windGain.gain.value = 0;

      this.windSource.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.ctx.destination);
      this.windSource.start();

      // --- CARVE: filtered noise with higher pitch ---
      const carveBuffer = this.createNoiseBuffer(2);
      this.carveSource = this.ctx.createBufferSource();
      this.carveSource.buffer = carveBuffer;
      this.carveSource.loop = true;

      this.carveFilter = this.ctx.createBiquadFilter();
      this.carveFilter.type = "bandpass";
      this.carveFilter.frequency.value = 800;
      this.carveFilter.Q.value = 2;

      this.carveGain = this.ctx.createGain();
      this.carveGain.gain.value = 0;

      this.carveSource.connect(this.carveFilter);
      this.carveFilter.connect(this.carveGain);
      this.carveGain.connect(this.ctx.destination);
      this.carveSource.start();

      this.initialized = true;
    } catch (e) {
      console.warn("Audio init failed:", e);
    }
  }

  private createNoiseBuffer(duration: number): AudioBuffer {
    const ctx = this.ctx!;
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  update(player: PlayerState) {
    if (!this.initialized || !this.ctx) return;

    // Resume context if suspended (browser autoplay policy)
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const speed = player.speed;
    const speedNorm = Math.min(speed / 25, 1); // 0-1 normalized to max speed

    // Wind: volume and filter increase with speed
    if (this.windGain && this.windFilter) {
      this.windGain.gain.value = speedNorm * 0.15;
      this.windFilter.frequency.value = 200 + speedNorm * 1200;
    }

    // Carve: volume based on edge angle × speed
    if (this.carveGain && this.carveFilter) {
      const carveIntensity = Math.abs(player.edgeAngle) * speedNorm;
      this.carveGain.gain.value = Math.min(carveIntensity * 0.12, 0.1);
      this.carveFilter.frequency.value = 600 + carveIntensity * 2000;
    }
  }

  dispose() {
    if (this.windSource) { try { this.windSource.stop(); } catch {} }
    if (this.carveSource) { try { this.carveSource.stop(); } catch {} }
    if (this.ctx) { this.ctx.close(); }
    this.initialized = false;
  }
}
