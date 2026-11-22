// config.js — every tuning constant for Velvet Vault, in one place.
//
// The room is a 40 x 20 tile grid (tile 32 px) under an 80 px HUD bar,
// so the canvas is 1280 x 720. Speeds are px per second, detection rates
// are points per second, money is dollars of loot.
export const TILE = 32;
export const COLS = 40;
export const ROWS = 20;
export const HUD_H = 80;
export const ROOM_W = COLS * TILE; // 1280
export const ROOM_H = ROWS * TILE; // 640
export const CANVAS_W = 1280;
export const CANVAS_H = HUD_H + ROOM_H; // 720

// The thief.
export const PLAYER_RADIUS = 12;
export const PLAYER_WALK_SPEED = 175;
export const PLAYER_SNEAK_SPEED = 98;
export const PLAYER_PICKUP_RADIUS = 24;

// Guards and their vision.
export const GUARD_RADIUS = 13;
export const GUARD_PATROL_SPEED = 62;
export const GUARD_CHASE_SPEED = 198;
export const GUARD_INVESTIGATE_SPEED = 110;
export const GUARD_CONE_RANGE = 225;
export const GUARD_CONE_HALF_ANGLE = 0.56; // ~32 degrees each side
export const GUARD_SUSPICION_RATE = 95; // at point blank, per second
export const GUARD_SUSPICION_DECAY = 26;
export const GUARD_CHASE_SECONDS = 5;
export const GUARD_CATCH_RADIUS = 28;

// Wall cameras and their sweeping vision.
export const CAMERA_RANGE = 265;
export const CAMERA_CONE_HALF_ANGLE = 0.42;
export const CAMERA_ALARM_RATE = 34; // alarm points per second while seen
export const CAMERA_SNEAK_FACTOR = 0.5;

// The alarm meter: 0 quiet, 100 busted.
export const ALARM_MAX = 100;
export const ALARM_DECAY = 3;
export const ALARM_ON_GUARD_ALERT = 25;

// Shadows hide the thief; sneaking hides them more.
export const SHADOW_DETECTION_FACTOR = 0.5;
export const SNEAK_DETECTION_FACTOR = 0.45;

// The vault: hold E beside it to crack it.
export const VAULT_CRACK_SECONDS = 3.5;
export const VAULT_LOOT_VALUE = 5000;

// Distraction coins, thrown with Q or a mouse click.
export const COINS_PER_FLOOR = 3;
export const COIN_HEAR_RADIUS = 285;
export const COIN_INVESTIGATE_SECONDS = 3.5;

// Scoring.
export const GHOST_BONUS = 500; // finish a floor never spotted
export const TIME_BONUS_PER_SECOND = 10;

// Loot values by kind.
export const LOOT_VALUES = { cash: 150, gold: 250, gem: 500, crown: 1200 };

export const COLORS = {
  floorA: '#1c2438',
  floorB: '#171e2e',
  carpet: '#5e1f2b',
  carpetEdge: '#8a6d2f',
  wall: '#2e3a55',
  wallEdge: '#c9a227',
  coverCrate: '#4a3823',
  coverDesk: '#3d2f4e',
  coverPlant: '#1f4d2e',
  shadow: '#10182b',
  guardBody: '#33415e',
  guardCap: '#1b2436',
  guardCone: 'rgba(255, 214, 64, 0.20)',
  guardConeAlert: 'rgba(255, 64, 64, 0.28)',
  cameraCone: 'rgba(255, 80, 80, 0.16)',
  cameraBody: '#3a3f4a',
  vaultDoor: '#6b7280',
  vaultGold: '#c9a227',
  lootGold: '#ffd94a',
  lootGem: '#4dd8ff',
  lootCash: '#7ee081',
  exitOpen: '#2fbf71',
  exitLocked: '#8a2f2f',
  thief: '#111318',
  thiefHat: '#23262e',
  hudBg: '#0d1220',
  hudGold: '#c9a227',
  text: '#e8e4d8',
  muted: '#9aa3b8',
  alarmLow: '#2fbf71',
  alarmMid: '#ffb020',
  alarmHigh: '#ff4040',
};
