// shots.js — stages deterministic scenes for the screenshots, from the
// ?shot= URL parameter: start (title over a live patrol), play (a
// mid-heist moment with every element in one frame) and end (the clean
// getaway). The simulation is frozen so the frame is stable.

import { buildWorld } from './world.js';
import { LEVELS } from './levels.js';

function placeGuard(world, index, col, row, angleDeg) {
  const g = world.guards[index];
  if (!g) return;
  g.x = (col + 0.5) * 32;
  g.y = (row + 0.5) * 32;
  g.angle = (angleDeg * Math.PI) / 180;
  g.state = 'patrol';
  g.suspicion = 0;
}

function placeCamera(world, index, angleDeg) {
  const cam = world.cameras[index];
  if (!cam) return;
  cam.angle = (angleDeg * Math.PI) / 180;
}

export function stageShot(game, name) {
  if (name === 'start') {
    game.world = buildWorld(0);
    game.state = 'title';
    game.score = 0;
    game.frozen = true;
    // A guard mid-patrol near the thief's entrance.
    placeGuard(game.world, 0, 8, 7, 90);
    placeGuard(game.world, 1, 32, 12, 180);
    placeCamera(game.world, 0, 55);
    return;
  }
  if (name === 'play') {
    // Floor 2: the gallery, with the thief sneaking toward the vault
    // while a guard closes in and a camera sweeps overhead.
    game.world = buildWorld(1);
    game.state = 'play';
    game.score = 1750;
    game.frozen = true;
    const w = game.world;
    w.timeLeft = 121;
    w.alarm = 38;
    w.maxAlarm = 38;
    w.coinsLeft = 2;
    w.lootScore = 1250;
    w.loot[0].taken = true;
    w.loot[1].taken = true;
    w.loot[4].taken = true;
    w.vault.progress = 0.55;
    w.player.x = (34 + 0.5) * 32;
    w.player.y = (9 + 0.5) * 32;
    w.player.angle = Math.PI;
    w.player.sneaking = true;
    placeGuard(w, 0, 6, 10, 0);
    placeGuard(w, 1, 20, 9, 90);
    placeGuard(w, 2, 31, 9, 180);
    w.guards[2].suspicion = 62;
    placeCamera(w, 0, 115);
    placeCamera(w, 1, 245);
    return;
  }
  if (name === 'end') {
    game.world = buildWorld(2);
    game.state = 'win';
    game.score = 18400;
    game.best = 18400;
    game.frozen = true;
    const w = game.world;
    w.vault.open = true;
    w.exit.open = true;
    w.lootScore = 8950;
    w.timeLeft = 64;
    for (const item of w.loot) item.taken = true;
    game.clearLines = [
      'Loot this floor: $8,950',
      'Time bonus: +$640   Ghost bonus: +$500',
      'All three floors cleared.',
    ];
    placeGuard(w, 0, 5, 9, 270);
    placeGuard(w, 1, 14, 10, 0);
    placeGuard(w, 2, 26, 10, 180);
    placeGuard(w, 3, 34, 9, 90);
    placeCamera(w, 0, 100);
    placeCamera(w, 1, 80);
    placeCamera(w, 2, 120);
  }
}
