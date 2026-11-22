// game.js — the state machine: title, playing, paused, busted, floor
// clear and the clean getaway. It owns the score, the ghost bonus, the
// best score in local storage, and turns world events into sounds.

import { LEVELS } from './levels.js';
import { GHOST_BONUS, TIME_BONUS_PER_SECOND } from './config.js';
import { buildWorld, updateWorld } from './world.js';
import { sfx, setMuted, isMuted } from './audio.js';

const BEST_KEY = 'velvet-vault-best';

export function createGame() {
  let best = 0;
  try {
    best = Number(localStorage.getItem(BEST_KEY) || 0) || 0;
  } catch {
    best = 0;
  }
  return {
    state: 'title',
    world: buildWorld(0),
    score: 0,
    ghostRun: true,
    best,
    clearLines: [],
    frozen: false, // screenshot staging freezes the simulation
  };
}

function saveBest(game) {
  if (game.score > game.best) {
    game.best = game.score;
    try {
      localStorage.setItem(BEST_KEY, String(game.best));
    } catch {
      // Private mode or no storage: the score just lives for the session.
    }
  }
}

function startFloor(game, levelIndex) {
  game.world = buildWorld(levelIndex);
  game.ghostRun = true;
  game.state = 'play';
}

export function startRun(game) {
  game.score = 0;
  startFloor(game, 0);
}

function floorScoreBreakdown(game) {
  const w = game.world;
  const timeBonus = Math.floor(w.timeLeft) * TIME_BONUS_PER_SECOND;
  const ghost = game.ghostRun && !w.spotted ? GHOST_BONUS : 0;
  return { timeBonus, ghost };
}

function onFloorClear(game) {
  const w = game.world;
  const { timeBonus, ghost } = floorScoreBreakdown(game);
  game.score += w.lootScore + timeBonus + ghost;
  game.clearLines = [
    `Loot this floor: $${w.lootScore.toLocaleString('en-US')}`,
    `Time bonus: +$${timeBonus.toLocaleString('en-US')}   Ghost bonus: ${ghost ? `+$${ghost}` : '— (spotted)'}`,
    w.levelIndex === LEVELS.length - 1 ? 'All three floors cleared.' : `Next: ${LEVELS[w.levelIndex + 1].name}`,
  ];
  saveBest(game);
  if (w.levelIndex === LEVELS.length - 1) {
    game.state = 'win';
    sfx.win();
  } else {
    game.state = 'floorclear';
    sfx.clear();
  }
}

function onBusted(game) {
  game.state = 'busted';
  game.score += game.world.lootScore;
  saveBest(game);
  sfx.busted();
}

function handleEvents(game, events) {
  for (const event of events) {
    if (event.type === 'pickup') sfx.pickup();
    else if (event.type === 'crackTick') sfx.crackTick();
    else if (event.type === 'vault') sfx.vaultOpen();
    else if (event.type === 'coin') sfx.coin();
    else if (event.type === 'alert') sfx.alert();
    else if (event.type === 'clear') onFloorClear(game);
    else if (event.type === 'busted') onBusted(game);
  }
}

// Advance the run one step. `time` is seconds since the page loaded.
export function updateGame(game, input, dt, time) {
  if (game.frozen || game.state !== 'play') return;
  // A Q coin throw lands in front of the thief.
  if (input.throwCoin && input.throwCoin.x === -1) {
    const p = game.world.player;
    input.throwCoin = {
      x: p.x + Math.cos(p.angle) * 130,
      y: p.y + Math.sin(p.angle) * 130,
    };
  }
  const events = [];
  updateWorld(game.world, input, dt, events, time);
  input.throwCoin = null;
  if (game.world.spotted) game.ghostRun = false;
  handleEvents(game, events);
}

// Keys that switch screens rather than move the thief.
export function handleMenuKey(game, code) {
  if (code === 'KeyM') {
    setMuted(!isMuted());
    return;
  }
  if (code === 'KeyP' && (game.state === 'play' || game.state === 'paused')) {
    game.state = game.state === 'play' ? 'paused' : 'play';
    return;
  }
  if (code === 'KeyR' && (game.state === 'play' || game.state === 'paused' || game.state === 'busted')) {
    startFloor(game, game.world.levelIndex);
    return;
  }
  if (code === 'Enter') {
    if (game.state === 'title') startRun(game);
    else if (game.state === 'floorclear') startFloor(game, game.world.levelIndex + 1);
    else if (game.state === 'busted') game.state = 'title';
    else if (game.state === 'win') {
      game.world = buildWorld(0);
      game.state = 'title';
    }
  }
}
