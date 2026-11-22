// world.js — the heist simulation: the thief, the guards, the cameras,
// the vault, the loot and the alarm. No drawing here, only rules.
//
// Detection: a guard or camera sees the thief when the thief is inside
// its vision cone with a clear line of sight. Being seen fills a guard's
// suspicion (a full meter makes it chase and raises the alarm) or fills
// the alarm meter directly for cameras. Shadows and sneaking slow it all.

import {
  TILE, ROOM_W, ROOM_H, PLAYER_RADIUS, PLAYER_WALK_SPEED, PLAYER_SNEAK_SPEED,
  PLAYER_PICKUP_RADIUS, GUARD_RADIUS, GUARD_PATROL_SPEED, GUARD_CHASE_SPEED,
  GUARD_INVESTIGATE_SPEED, GUARD_CONE_RANGE, GUARD_CONE_HALF_ANGLE,
  GUARD_SUSPICION_RATE, GUARD_SUSPICION_DECAY, GUARD_CHASE_SECONDS,
  GUARD_CATCH_RADIUS, CAMERA_RANGE, CAMERA_CONE_HALF_ANGLE, CAMERA_ALARM_RATE,
  CAMERA_SNEAK_FACTOR, ALARM_MAX, ALARM_DECAY, ALARM_ON_GUARD_ALERT,
  SHADOW_DETECTION_FACTOR, SNEAK_DETECTION_FACTOR, VAULT_CRACK_SECONDS,
  VAULT_LOOT_VALUE, COINS_PER_FLOOR, COIN_HEAR_RADIUS, COIN_INVESTIGATE_SECONDS,
  LOOT_VALUES,
} from './config.js';
import { LEVELS, tileCenterPx, rectPx } from './levels.js';

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

// Build a fresh world for one floor. All positions are room pixels
// (origin top-left of the playfield, under the HUD bar).
export function buildWorld(levelIndex) {
  const level = LEVELS[levelIndex];
  const solids = [
    ...level.walls.map(rectPx),
    ...level.cover.map(rectPx),
  ];
  const shadows = level.shadows.map(rectPx);
  const start = tileCenterPx(level.playerStart[0], level.playerStart[1]);
  const vaultAt = tileCenterPx(level.vault.col, level.vault.row);
  const exitAt = tileCenterPx(level.exit.col, level.exit.row);
  return {
    levelIndex,
    level,
    solids,
    shadows,
    timeLeft: level.timeLimit,
    alarm: 0,
    lootScore: 0,
    coinsLeft: COINS_PER_FLOOR,
    spotted: false,
    maxAlarm: 0,
    busted: null,
    floorClear: false,
    crackTicks: 0,
    player: {
      x: start.x, y: start.y, angle: -Math.PI / 2,
      sneaking: false, moving: false,
    },
    guards: level.guards.map((g) => {
      const first = tileCenterPx(g.waypoints[0][0], g.waypoints[0][1]);
      return {
        x: first.x, y: first.y, angle: 0, wpIndex: 1,
        waypoints: g.waypoints.map(([c, r]) => tileCenterPx(c, r)),
        state: 'patrol', suspicion: 0, stateTimer: 0,
        targetX: first.x, targetY: first.y, seenFlash: 0,
      };
    }),
    cameras: level.cameras.map((c) => {
      const at = tileCenterPx(c.col, c.row);
      return {
        x: at.x, y: at.y,
        baseAngle: (c.baseDeg * Math.PI) / 180,
        sweep: (c.sweepDeg * Math.PI) / 180,
        angle: (c.baseDeg * Math.PI) / 180,
        phase: Math.random() * Math.PI * 2,
        seen: false,
      };
    }),
    loot: level.loot.map((l) => {
      const at = tileCenterPx(l.col, l.row);
      return { x: at.x, y: at.y, kind: l.kind, value: LOOT_VALUES[l.kind], taken: false };
    }),
    vault: {
      x: vaultAt.x, y: vaultAt.y, w: TILE * 2, h: TILE * 2,
      progress: 0, open: false,
    },
    exit: {
      x: exitAt.x, y: exitAt.y, w: TILE * 2, h: TILE,
      open: false,
    },
    thrownCoins: [],
    popups: [],
  };
}

function pointBlocked(world, x, y) {
  for (const s of world.solids) {
    if (x >= s.x - 1 && x <= s.x + s.w + 1 && y >= s.y - 1 && y <= s.y + s.h + 1) return true;
  }
  return false;
}

// True when nothing solid stands between the two points.
export function hasLineOfSight(world, ax, ay, bx, by) {
  const d = dist(ax, ay, bx, by);
  const steps = Math.max(1, Math.ceil(d / 8));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (pointBlocked(world, ax + (bx - ax) * t, ay + (by - ay) * t)) return false;
  }
  return true;
}

function inCone(world, ox, oy, angle, range, halfAngle, tx, ty) {
  const d = dist(ox, oy, tx, ty);
  if (d > range) return false;
  const want = Math.atan2(ty - oy, tx - ox);
  if (Math.abs(angleDiff(want, angle)) > halfAngle) return false;
  return hasLineOfSight(world, ox, oy, tx, ty);
}

function inShadow(world, x, y) {
  return world.shadows.some((s) => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h);
}

function circleHitsSolids(world, x, y, r) {
  for (const s of world.solids) {
    const cx = Math.max(s.x, Math.min(x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(y, s.y + s.h));
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r) return true;
  }
  return false;
}

function moveWithCollision(world, mover, dx, dy, radius) {
  const nx = mover.x + dx;
  if (nx > 16 + radius && nx < ROOM_W - 16 - radius && !circleHitsSolids(world, nx, mover.y, radius)) {
    mover.x = nx;
  }
  const ny = mover.y + dy;
  if (ny > 16 + radius && ny < ROOM_H - 16 - radius && !circleHitsSolids(world, mover.x, ny, radius)) {
    mover.y = ny;
  }
}

function addPopup(world, x, y, text, color) {
  world.popups.push({ x, y, text, color, t: 0, life: 1.4 });
}

export function raiseAlarm(world, amount, events) {
  const before = world.alarm;
  world.alarm = Math.min(ALARM_MAX, world.alarm + amount);
  world.maxAlarm = Math.max(world.maxAlarm, world.alarm);
  if (before < ALARM_MAX && world.alarm >= ALARM_MAX) {
    world.busted = 'alarm';
    events.push({ type: 'busted', reason: 'alarm' });
  }
}

// One fixed step of the heist. `input` carries the held keys and an
// optional coin throw {x, y}. Events describe what happened, for sound
// and score popups.
export function updateWorld(world, input, dt, events, time) {
  if (world.busted || world.floorClear) return;

  world.timeLeft -= dt;
  if (world.timeLeft <= 0) {
    world.timeLeft = 0;
    world.busted = 'time';
    events.push({ type: 'busted', reason: 'time' });
    return;
  }

  const p = world.player;
  const mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  p.sneaking = !!input.sneak;
  p.moving = mx !== 0 || my !== 0;
  if (p.moving) {
    const len = Math.hypot(mx, my);
    const speed = p.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_WALK_SPEED;
    p.angle = Math.atan2(my / len, mx / len);
    moveWithCollision(world, p, (mx / len) * speed * dt, (my / len) * speed * dt, PLAYER_RADIUS);
  }

  const shadowed = inShadow(world, p.x, p.y);
  const sneakFactor = p.sneaking ? SNEAK_DETECTION_FACTOR : 1;
  const shadowFactor = shadowed ? SHADOW_DETECTION_FACTOR : 1;

  // Distraction coin: guards in earshot go to look at it.
  if (input.throwCoin && world.coinsLeft > 0) {
    world.coinsLeft -= 1;
    const tx = Math.max(24, Math.min(ROOM_W - 24, input.throwCoin.x));
    const ty = Math.max(24, Math.min(ROOM_H - 24, input.throwCoin.y));
    world.thrownCoins.push({ x: tx, y: ty, t: 0, life: 1.2 });
    events.push({ type: 'coin', x: tx, y: ty });
    for (const g of world.guards) {
      if (g.state !== 'chase' && dist(g.x, g.y, tx, ty) < COIN_HEAR_RADIUS) {
        g.state = 'investigate';
        g.targetX = tx;
        g.targetY = ty;
        g.stateTimer = COIN_INVESTIGATE_SECONDS;
      }
    }
  }

  let anyoneSees = false;

  for (const g of world.guards) {
    g.seenFlash = Math.max(0, g.seenFlash - dt);
    const sees = inCone(world, g.x, g.y, g.angle, GUARD_CONE_RANGE, GUARD_CONE_HALF_ANGLE, p.x, p.y);
    if (sees) {
      anyoneSees = true;
      const d = dist(g.x, g.y, p.x, p.y);
      const closeness = 1 - 0.6 * (d / GUARD_CONE_RANGE);
      g.suspicion += GUARD_SUSPICION_RATE * closeness * sneakFactor * shadowFactor * dt;
      g.seenFlash = 0.15;
      if (g.suspicion >= 100 && g.state !== 'chase') {
        g.suspicion = 100;
        g.state = 'chase';
        g.stateTimer = GUARD_CHASE_SECONDS;
        world.spotted = true;
        raiseAlarm(world, ALARM_ON_GUARD_ALERT, events);
        events.push({ type: 'alert', x: g.x, y: g.y });
      }
    } else {
      g.suspicion = Math.max(0, g.suspicion - GUARD_SUSPICION_DECAY * dt);
    }

    if (g.state === 'patrol') {
      const wp = g.waypoints[g.wpIndex];
      const d = dist(g.x, g.y, wp.x, wp.y);
      if (d < 6) {
        g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
      } else {
        const a = Math.atan2(wp.y - g.y, wp.x - g.x);
        g.angle = a;
        moveWithCollision(world, g, Math.cos(a) * GUARD_PATROL_SPEED * dt, Math.sin(a) * GUARD_PATROL_SPEED * dt, GUARD_RADIUS);
      }
    } else if (g.state === 'chase') {
      const a = Math.atan2(p.y - g.y, p.x - g.x);
      g.angle = a;
      moveWithCollision(world, g, Math.cos(a) * GUARD_CHASE_SPEED * dt, Math.sin(a) * GUARD_CHASE_SPEED * dt, GUARD_RADIUS);
      g.stateTimer -= dt;
      if (dist(g.x, g.y, p.x, p.y) < GUARD_CATCH_RADIUS) {
        world.busted = 'caught';
        events.push({ type: 'busted', reason: 'caught' });
        return;
      }
      if (g.stateTimer <= 0) {
        g.state = 'investigate';
        g.targetX = p.x;
        g.targetY = p.y;
        g.stateTimer = 2.5;
      }
    } else if (g.state === 'investigate') {
      const d = dist(g.x, g.y, g.targetX, g.targetY);
      if (d < 8) {
        g.stateTimer -= dt;
        g.angle += dt * 1.6; // look around
        if (g.stateTimer <= 0) {
          g.state = 'patrol';
          g.suspicion = Math.max(0, g.suspicion - 40);
        }
      } else {
        const a = Math.atan2(g.targetY - g.y, g.targetX - g.x);
        g.angle = a;
        moveWithCollision(world, g, Math.cos(a) * GUARD_INVESTIGATE_SPEED * dt, Math.sin(a) * GUARD_INVESTIGATE_SPEED * dt, GUARD_RADIUS);
      }
    }
  }

  for (const cam of world.cameras) {
    cam.angle = cam.baseAngle + cam.sweep * Math.sin(time * 0.55 + cam.phase);
    cam.seen = inCone(world, cam.x, cam.y, cam.angle, CAMERA_RANGE, CAMERA_CONE_HALF_ANGLE, p.x, p.y);
    if (cam.seen) {
      anyoneSees = true;
      world.spotted = true;
      raiseAlarm(world, CAMERA_ALARM_RATE * (p.sneaking ? CAMERA_SNEAK_FACTOR : 1) * dt, events);
      if (world.busted) return;
    }
  }

  if (!anyoneSees) world.alarm = Math.max(0, world.alarm - ALARM_DECAY * dt);

  // Loot: walk over it to pocket it.
  for (const item of world.loot) {
    if (!item.taken && dist(p.x, p.y, item.x, item.y) < PLAYER_PICKUP_RADIUS) {
      item.taken = true;
      world.lootScore += item.value;
      addPopup(world, item.x, item.y - 14, `+$${item.value}`, '#ffd94a');
      events.push({ type: 'pickup', value: item.value, kind: item.kind });
    }
  }

  // The vault: hold E beside it to crack it open.
  const v = world.vault;
  const vaultDist = dist(p.x, p.y, v.x, v.y);
  if (!v.open) {
    if (vaultDist < 78 && input.crack) {
      v.progress += dt / VAULT_CRACK_SECONDS;
      world.crackTicks += dt;
      if (world.crackTicks > 0.28) {
        world.crackTicks = 0;
        events.push({ type: 'crackTick' });
      }
      if (v.progress >= 1) {
        v.progress = 1;
        v.open = true;
        world.exit.open = true;
        world.lootScore += VAULT_LOOT_VALUE;
        addPopup(world, v.x, v.y - 40, `VAULT +$${VAULT_LOOT_VALUE}`, '#ffd94a');
        events.push({ type: 'vault' });
      }
    } else {
      v.progress = Math.max(0, v.progress - dt * 0.12);
    }
  }

  // The exit only opens once the vault is cracked.
  const e = world.exit;
  if (e.open && p.x > e.x - e.w / 2 && p.x < e.x + e.w / 2 && p.y > e.y - e.h / 2 && p.y < e.y + e.h / 2) {
    world.floorClear = true;
    events.push({ type: 'clear' });
  }

  for (const c of world.thrownCoins) c.t += dt;
  world.thrownCoins = world.thrownCoins.filter((c) => c.t < c.life);
  for (const pop of world.popups) pop.t += dt;
  world.popups = world.popups.filter((pop) => pop.t < pop.life);
}
