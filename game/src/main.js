// main.js — bootstrap: the canvas, the fixed-step loop, and the ?shot=
// staging hook. Nothing here knows the rules; game.js and world.js do.

import { createInput } from './input.js';
import { createGame, updateGame, handleMenuKey } from './game.js';
import { render } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const game = createGame();
const input = createInput(canvas);
input.onKey = (code) => handleMenuKey(game, code);

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) stageShot(game, shot);

let last = performance.now();
let acc = 0;
const STEP = 1 / 60;

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  acc += dt;
  while (acc >= STEP) {
    updateGame(game, input, STEP, now / 1000);
    acc -= STEP;
  }
  render(ctx, game, now / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
