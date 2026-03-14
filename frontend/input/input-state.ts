// Shared mutable input state.
// React (insole adapter / keyboard adapter) writes to this.
// Game loop reads from it synchronously each frame.
export interface InputState {
  turnInput: number; // -1 (left) to +1 (right)
  speedInput: number; // -1 (brake) to +1 (tuck/boost)
  jumpInput: boolean;
  trickSpin: number; // roll angle while airborne
  source: "insole" | "keyboard" | "none";
}

export function createInputState(): InputState {
  return {
    turnInput: 0,
    speedInput: 0,
    jumpInput: false,
    trickSpin: 0,
    source: "none",
  };
}

// Singleton shared ref — both adapters write, game loop reads
export const inputState: InputState = createInputState();
