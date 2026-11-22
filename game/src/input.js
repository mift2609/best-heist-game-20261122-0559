// input.js — keyboard movement and mouse coin throws.
//
// The game reads this plain object each step: held directions, sneak,
// crack (E held), and one-shot coin throws (Q or a click inside the room).
// Coordinates from clicks are converted from canvas pixels to room pixels.

import { HUD_H, ROOM_W, ROOM_H } from './config.js';

export function createInput(canvas) {
  const input = {
    up: false, down: false, left: false, right: false,
    sneak: false, crack: false,
    throwCoin: null,
  };
  const keys = new Set();

  function sync() {
    input.up = keys.has('KeyW') || keys.has('ArrowUp');
    input.down = keys.has('KeyS') || keys.has('ArrowDown');
    input.left = keys.has('KeyA') || keys.has('ArrowLeft');
    input.right = keys.has('KeyD') || keys.has('ArrowRight');
    input.sneak = keys.has('ShiftLeft') || keys.has('ShiftRight');
    input.crack = keys.has('KeyE');
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (!event.repeat) {
      keys.add(event.code);
      sync();
      if (event.code === 'KeyQ') input.throwCoin = { x: -1, y: -1 }; // in front of the thief
      if (typeof input.onKey === 'function') input.onKey(event.code);
    }
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
    sync();
  });
  window.addEventListener('blur', () => {
    keys.clear();
    sync();
  });

  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY - HUD_H;
    if (y >= 0 && y < ROOM_H && x >= 0 && x < ROOM_W) {
      input.throwCoin = { x, y };
    }
  });

  return input;
}
