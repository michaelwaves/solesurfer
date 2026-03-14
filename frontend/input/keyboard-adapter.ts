import { inputState } from "./input-state";

const keys: Record<string, boolean> = {};

function onKeyDown(e: KeyboardEvent) {
  keys[e.key.toLowerCase()] = true;
  if (["a", "d", "w", "s", " "].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
}

function onKeyUp(e: KeyboardEvent) {
  keys[e.key.toLowerCase()] = false;
}

export function initKeyboardAdapter() {
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  };
}

// Call each frame to update inputState from keyboard
export function pollKeyboard() {
  // Only write if no insole is active
  if (inputState.source === "insole") return;

  let turn = 0;
  let speed = 0;

  if (keys["a"] || keys["arrowleft"]) turn -= 1;
  if (keys["d"] || keys["arrowright"]) turn += 1;
  if (keys["w"] || keys["arrowup"]) speed += 1;
  if (keys["s"] || keys["arrowdown"]) speed -= 1;

  inputState.turnInput = turn;
  inputState.speedInput = speed;
  inputState.jumpInput = keys[" "] || false;
  inputState.trickSpin = 0;
  inputState.source = "keyboard";
}
