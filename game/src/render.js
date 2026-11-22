// render.js — paints the heist top-down on the canvas: the room, the
// velvet carpet, the guards with their vision cones, the sweeping camera
// cones, the vault, the loot, the exit, the thief, and the HUD bar with
// the loot total, the alarm meter and the timer. Screens are drawn here
// too: title, pause, busted, floor clear and the clean getaway.

import {
  TILE, HUD_H, ROOM_W, ROOM_H, COLORS, ALARM_MAX,
  GUARD_CONE_RANGE, GUARD_CONE_HALF_ANGLE, CAMERA_RANGE, CAMERA_CONE_HALF_ANGLE,
  VAULT_LOOT_VALUE,
} from './config.js';
import { rectPx } from './levels.js';

function conePath(ctx, x, y, angle, range, halfAngle) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, range, halfAngle, fill) {
  conePath(ctx, x, y, angle, range, halfAngle);
  ctx.fillStyle = fill;
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function bar(ctx, x, y, w, h, frac, fill, bg) {
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
}

function alarmColor(alarm) {
  if (alarm < 40) return COLORS.alarmLow;
  if (alarm < 75) return COLORS.alarmMid;
  return COLORS.alarmHigh;
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function drawGuard(ctx, g, time) {
  const alerted = g.state === 'chase';
  const fill = alerted ? COLORS.guardConeAlert : COLORS.guardCone;
  drawCone(ctx, g.x, g.y, g.angle, GUARD_CONE_RANGE, GUARD_CONE_HALF_ANGLE, fill);
  // Body: navy uniform, cap, facing tick.
  ctx.fillStyle = COLORS.guardBody;
  ctx.beginPath();
  ctx.arc(g.x, g.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0c1220';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#d9c9a3';
  ctx.beginPath();
  ctx.arc(g.x, g.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.guardCap;
  ctx.beginPath();
  ctx.arc(g.x, g.y, 6, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8e4d8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(g.angle) * 18, g.y + Math.sin(g.angle) * 18);
  ctx.stroke();
  // Suspicion or state mark.
  if (g.suspicion > 12 || g.state !== 'patrol') {
    const mark = g.state === 'chase' ? '!' : g.state === 'investigate' ? '?' : '!';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = g.state === 'chase' ? '#ff5040' : '#ffd640';
    ctx.fillText(mark, g.x, g.y - 20);
  }
  if (g.suspicion > 0 && g.suspicion < 100) {
    bar(ctx, g.x - 14, g.y + 18, 28, 5, g.suspicion / 100, '#ffb020', 'rgba(0,0,0,0.55)');
  }
  void time;
}

function drawCamera(ctx, cam, time) {
  const flashing = cam.seen && Math.floor(time * 6) % 2 === 0;
  drawCone(ctx, cam.x, cam.y, cam.angle, CAMERA_RANGE, CAMERA_CONE_HALF_ANGLE,
    flashing ? 'rgba(255,60,60,0.30)' : COLORS.cameraCone);
  ctx.fillStyle = COLORS.cameraBody;
  ctx.beginPath();
  ctx.arc(cam.x, cam.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0c1220';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = cam.seen ? '#ff3030' : '#ff7070';
  ctx.beginPath();
  ctx.arc(cam.x + Math.cos(cam.angle) * 6, cam.y + Math.sin(cam.angle) * 6, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0c1220';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cam.x, cam.y);
  ctx.lineTo(cam.x + Math.cos(cam.angle) * 20, cam.y + Math.sin(cam.angle) * 20);
  ctx.stroke();
}

function drawLoot(ctx, item, time) {
  const bob = Math.sin(time * 3 + item.x) * 2;
  const glow = 0.35 + 0.15 * Math.sin(time * 4 + item.y);
  ctx.save();
  ctx.globalAlpha = glow;
  ctx.fillStyle = item.kind === 'gem' ? COLORS.lootGem : item.kind === 'cash' ? COLORS.lootCash : COLORS.lootGold;
  ctx.beginPath();
  ctx.arc(item.x, item.y + bob, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#111318';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (item.kind === 'gem') {
    ctx.fillStyle = COLORS.lootGem;
    ctx.beginPath();
    ctx.moveTo(item.x, item.y - 12 + bob);
    ctx.lineTo(item.x + 10, item.y + bob);
    ctx.lineTo(item.x, item.y + 12 + bob);
    ctx.lineTo(item.x - 10, item.y + bob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0b3a4a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (item.kind === 'cash') {
    ctx.fillStyle = COLORS.lootCash;
    ctx.fillRect(item.x - 11, item.y - 7 + bob, 22, 14);
    ctx.strokeStyle = '#1f4d2e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(item.x - 11, item.y - 7 + bob, 22, 14);
    ctx.fillStyle = '#1f4d2e';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('$', item.x, item.y + 4 + bob);
  } else if (item.kind === 'crown') {
    ctx.fillStyle = COLORS.lootGold;
    ctx.beginPath();
    ctx.moveTo(item.x - 12, item.y + 8 + bob);
    ctx.lineTo(item.x - 12, item.y - 5 + bob);
    ctx.lineTo(item.x - 6, item.y + 1 + bob);
    ctx.lineTo(item.x, item.y - 10 + bob);
    ctx.lineTo(item.x + 6, item.y + 1 + bob);
    ctx.lineTo(item.x + 12, item.y - 5 + bob);
    ctx.lineTo(item.x + 12, item.y + 8 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8a6d2f';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    ctx.fillStyle = COLORS.lootGold;
    ctx.fillRect(item.x - 11, item.y - 6 + bob, 22, 12);
    ctx.fillStyle = '#8a6d2f';
    ctx.fillRect(item.x - 11, item.y - 1 + bob, 22, 2);
    ctx.strokeStyle = '#8a6d2f';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(item.x - 11, item.y - 6 + bob, 22, 12);
  }
  ctx.textBaseline = 'alphabetic';
}

function drawVault(ctx, vault, time) {
  const v = vault;
  const x = v.x - v.w / 2;
  const y = v.y - v.h / 2;
  ctx.fillStyle = '#20242e';
  ctx.fillRect(x - 6, y - 6, v.w + 12, v.h + 12);
  ctx.fillStyle = COLORS.vaultDoor;
  roundRect(ctx, x, y, v.w, v.h, 6);
  ctx.fill();
  ctx.strokeStyle = COLORS.vaultGold;
  ctx.lineWidth = 3;
  ctx.stroke();
  // The label sits above the door, unless the vault hugs the top wall —
  // then it goes to the door's left, clear of the HUD bar and the
  // shadow boxes that sit under the top-row vaults.
  const labelAbove = y - 12 >= 16;
  const labelY = labelAbove ? y - 12 : v.y + 5;
  const labelX = labelAbove ? v.x : x - 10;
  const labelAlign = labelAbove ? 'center' : 'right';
  if (v.open) {
    const glow = 0.6 + 0.4 * Math.sin(time * 5);
    ctx.save();
    ctx.globalAlpha = glow;
    ctx.fillStyle = COLORS.lootGold;
    ctx.beginPath();
    ctx.arc(v.x, v.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#111318';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', v.x, v.y + 5);
    ctx.fillStyle = COLORS.lootGold;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = labelAlign;
    ctx.fillText('OPEN', labelX, labelY);
  } else {
    ctx.strokeStyle = '#3a3f4a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(v.x, v.y, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(v.x, v.y);
    ctx.lineTo(v.x + Math.cos(time * 0.8) * 12, v.y + Math.sin(time * 0.8) * 12);
    ctx.stroke();
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = labelAlign;
    ctx.fillText('VAULT', labelX, labelY);
    if (v.progress > 0) {
      bar(ctx, x - 4, y + v.h + 8, v.w + 8, 8, v.progress, COLORS.lootGold, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = COLORS.lootGold;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('CRACKING…', v.x, y + v.h + 28);
    }
  }
}

function drawExit(ctx, exit) {
  const x = exit.x - exit.w / 2;
  const y = exit.y - exit.h / 2;
  ctx.fillStyle = exit.open ? COLORS.exitOpen : COLORS.exitLocked;
  roundRect(ctx, x, y, exit.w, exit.h, 5);
  ctx.fill();
  ctx.strokeStyle = '#0c1220';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(exit.open ? 'EXIT' : 'LOCKED', exit.x, exit.y + 5);
}

function drawThief(ctx, p, time) {
  // A thief in black with a wide-brim hat, seen from above.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 8, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.thief;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = p.sneaking ? '#4dd8ff' : '#c9a227';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = COLORS.thiefHat;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, 15, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8e4d8';
  ctx.fillRect(p.x - 7, p.y - 3, 14, 4); // the mask band
  ctx.fillStyle = '#111318';
  ctx.fillRect(p.x - 5, p.y - 2, 3, 2);
  ctx.fillRect(p.x + 2, p.y - 2, 3, 2);
  // Facing tick.
  ctx.strokeStyle = '#e8e4d8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + Math.cos(p.angle) * 16, p.y + Math.sin(p.angle) * 16);
  ctx.stroke();
  if (p.sneaking) {
    ctx.fillStyle = '#4dd8ff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAKING', p.x, p.y - 22);
  }
  void time;
}

function drawHud(ctx, game) {
  const w = game.world;
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, 1280, HUD_H);
  ctx.fillStyle = COLORS.hudGold;
  ctx.fillRect(0, HUD_H - 3, 1280, 3);
  ctx.fillStyle = COLORS.hudGold;
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('VELVET VAULT', 18, 30);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '14px sans-serif';
  ctx.fillText(w.level.name, 18, 54);
  // Loot and score.
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`LOOT  $${w.lootScore.toLocaleString('en-US')}`, 340, 30);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '14px sans-serif';
  ctx.fillText(`SCORE ${game.score.toLocaleString('en-US')}`, 340, 54);
  // Alarm meter.
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', 640, 26);
  bar(ctx, 640, 34, 210, 16, w.alarm / ALARM_MAX, alarmColor(w.alarm), '#222a3a');
  ctx.fillStyle = alarmColor(w.alarm);
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`${Math.round(w.alarm)}%`, 856, 48);
  // Timer.
  const lowTime = w.timeLeft < 30;
  ctx.fillStyle = lowTime ? '#ff5040' : COLORS.text;
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(`TIME ${formatTime(w.timeLeft)}`, 930, 32);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '14px sans-serif';
  ctx.fillText(`COINS ${w.coinsLeft}   ${game.ghostRun ? 'GHOST ✓' : ''}`, 930, 54);
  // Objective line.
  ctx.fillStyle = COLORS.muted;
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(w.vault.open ? 'Vault open — reach the green EXIT!' : 'Hold E at the VAULT to crack it, grab loot, then escape.', 1262, 70);
  ctx.textAlign = 'left';
}

function drawRoom(ctx, game, time) {
  const w = game.world;
  ctx.save();
  ctx.translate(0, HUD_H);
  // Floor checker.
  for (let r = 0; r < 20; r++) {
    for (let c = 0; c < 40; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
    }
  }
  // Velvet carpet: a red runner across the room at the vault's height.
  ctx.fillStyle = COLORS.carpet;
  const strip = { x: 0, y: Math.round(w.vault.y) - 24, w: ROOM_W, h: 48 };
  ctx.fillRect(strip.x, strip.y, strip.w, strip.h);
  ctx.fillStyle = COLORS.carpetEdge;
  ctx.fillRect(strip.x, strip.y, strip.w, 3);
  ctx.fillRect(strip.x, strip.y + strip.h - 3, strip.w, 3);
  // Shadows: dark patches that slow detection.
  for (const s of w.shadows) {
    ctx.fillStyle = COLORS.shadow;
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.strokeStyle = 'rgba(120,160,255,0.25)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w, s.h);
    ctx.fillStyle = 'rgba(160,190,255,0.55)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SHADOW — HIDDEN', s.x + s.w / 2, s.y + s.h / 2 + 4);
  }
  // Walls with gold trim.
  for (const s of w.level.walls.map(rectPx)) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.strokeStyle = COLORS.wallEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(s.x + 1, s.y + 1, s.w - 2, s.h - 2);
  }
  // Cover: crates, desks, plants.
  for (const c of w.level.cover.map(rectPx)) {
    if (c.kind === 'crate') {
      ctx.fillStyle = COLORS.coverCrate;
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = '#8a6d2f';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x + c.w, c.y + c.h);
      ctx.moveTo(c.x + c.w, c.y);
      ctx.lineTo(c.x, c.y + c.h);
      ctx.stroke();
    } else if (c.kind === 'desk') {
      ctx.fillStyle = COLORS.coverDesk;
      roundRect(ctx, c.x, c.y, c.w, c.h, 6);
      ctx.fill();
      ctx.strokeStyle = '#8a6d9f';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.fillStyle = COLORS.coverPlant;
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, Math.min(c.w, c.h) / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#7ee081';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  // Outer frame.
  ctx.strokeStyle = COLORS.wallEdge;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, ROOM_W - 4, ROOM_H - 4);
  // Cameras first (their cones sit under the guards' cones).
  for (const cam of w.cameras) drawCamera(ctx, cam, time);
  for (const g of w.guards) drawGuard(ctx, g, time);
  for (const item of w.loot) if (!item.taken) drawLoot(ctx, item, time);
  drawVault(ctx, w.vault, time);
  drawExit(ctx, w.exit);
  // Thrown coins.
  for (const c of w.thrownCoins) {
    ctx.fillStyle = COLORS.lootGold;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a6d2f';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  drawThief(ctx, w.player, time);
  // Score popups.
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  for (const pop of w.popups) {
    ctx.globalAlpha = 1 - pop.t / pop.life;
    ctx.fillStyle = pop.color;
    ctx.fillText(pop.text, pop.x, pop.y - pop.t * 28);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function dim(ctx) {
  ctx.fillStyle = 'rgba(6, 8, 16, 0.78)';
  ctx.fillRect(0, 0, 1280, 720);
}

function panel(ctx, y, h) {
  ctx.fillStyle = 'rgba(13, 18, 32, 0.92)';
  ctx.fillRect(240, y, 800, h);
  ctx.strokeStyle = COLORS.hudGold;
  ctx.lineWidth = 2;
  ctx.strokeRect(240.5, y + 0.5, 800, h);
}

function centerText(ctx, text, y, font, color) {
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.fillText(text, 640, y);
}

const BUSTED_REASONS = {
  caught: 'A guard caught you red-handed.',
  alarm: 'The alarm hit maximum — the vault sealed shut.',
  time: 'Out of time — the getaway driver left without you.',
};

export function render(ctx, game, time) {
  ctx.clearRect(0, 0, 1280, 720);
  if (game.state === 'title') {
    drawRoom(ctx, game, time);
    dim(ctx);
    panel(ctx, 130, 460);
    centerText(ctx, 'VELVET VAULT', 215, 'bold 64px sans-serif', COLORS.hudGold);
    centerText(ctx, '— THE MIDNIGHT HEIST —', 255, 'bold 20px sans-serif', COLORS.text);
    centerText(ctx, 'Sneak past the guards. Dodge the cameras. Crack the vault.', 310, '18px sans-serif', COLORS.text);
    centerText(ctx, 'Grab the loot and reach the EXIT before the timer runs out.', 338, '18px sans-serif', COLORS.text);
    centerText(ctx, 'WASD / Arrows — move      SHIFT — sneak      E — crack the vault', 392, '16px sans-serif', COLORS.muted);
    centerText(ctx, 'Q or CLICK — throw a coin to distract a guard      P — pause      M — mute', 420, '16px sans-serif', COLORS.muted);
    centerText(ctx, 'Shadows hide you. A full alarm meter — or a guard’s hands — ends the run.', 448, '16px sans-serif', COLORS.muted);
    centerText(ctx, 'Ghost bonus: +$500 a floor if nobody ever spots you.', 476, '16px sans-serif', COLORS.lootGold);
    const blink = Math.floor(time * 2) % 2 === 0;
    if (blink) centerText(ctx, 'PRESS ENTER TO START THE HEIST', 540, 'bold 22px sans-serif', COLORS.text);
    if (game.best > 0) centerText(ctx, `BEST SCORE  ${game.best.toLocaleString('en-US')}`, 575, '16px sans-serif', COLORS.muted);
    return;
  }
  drawRoom(ctx, game, time);
  drawHud(ctx, game);
  if (game.state === 'paused') {
    dim(ctx);
    panel(ctx, 260, 200);
    centerText(ctx, 'PAUSED', 330, 'bold 48px sans-serif', COLORS.text);
    centerText(ctx, 'P — resume      R — restart floor', 390, '18px sans-serif', COLORS.muted);
    centerText(ctx, 'The guards wait for no one. Well — right now they do.', 420, '16px sans-serif', COLORS.muted);
  } else if (game.state === 'busted') {
    dim(ctx);
    panel(ctx, 200, 320);
    centerText(ctx, 'BUSTED!', 280, 'bold 56px sans-serif', '#ff5040');
    centerText(ctx, BUSTED_REASONS[game.world.busted] || 'The heist failed.', 330, '18px sans-serif', COLORS.text);
    centerText(ctx, `Loot kept: $${game.world.lootScore.toLocaleString('en-US')}      Score: ${game.score.toLocaleString('en-US')}`, 380, '18px sans-serif', COLORS.text);
    centerText(ctx, 'R — retry this floor      ENTER — back to the title', 440, '16px sans-serif', COLORS.muted);
  } else if (game.state === 'floorclear') {
    dim(ctx);
    panel(ctx, 190, 340);
    centerText(ctx, 'FLOOR CLEAR!', 270, 'bold 52px sans-serif', COLORS.exitOpen);
    centerText(ctx, game.clearLines[0] || '', 330, '18px sans-serif', COLORS.text);
    centerText(ctx, game.clearLines[1] || '', 360, '18px sans-serif', COLORS.text);
    centerText(ctx, game.clearLines[2] || '', 390, '18px sans-serif', COLORS.lootGold);
    centerText(ctx, `Total score: ${game.score.toLocaleString('en-US')}`, 430, 'bold 20px sans-serif', COLORS.text);
    centerText(ctx, 'PRESS ENTER FOR THE NEXT FLOOR', 490, 'bold 18px sans-serif', COLORS.text);
  } else if (game.state === 'win') {
    dim(ctx);
    panel(ctx, 160, 400);
    centerText(ctx, 'CLEAN GETAWAY!', 240, 'bold 56px sans-serif', COLORS.hudGold);
    centerText(ctx, 'Three floors. One vault each. Nobody saw a thing —', 300, '18px sans-serif', COLORS.text);
    centerText(ctx, 'or if they did, you were already gone.', 328, '18px sans-serif', COLORS.text);
    centerText(ctx, game.clearLines[0] || '', 380, '18px sans-serif', COLORS.text);
    centerText(ctx, game.clearLines[1] || '', 410, '18px sans-serif', COLORS.text);
    centerText(ctx, game.clearLines[2] || '', 440, '18px sans-serif', COLORS.lootGold);
    centerText(ctx, `FINAL SCORE  ${game.score.toLocaleString('en-US')}`, 490, 'bold 24px sans-serif', COLORS.text);
    if (game.best > 0) centerText(ctx, `BEST  ${game.best.toLocaleString('en-US')}`, 520, '16px sans-serif', COLORS.muted);
    centerText(ctx, 'ENTER — play again', 545, '16px sans-serif', COLORS.muted);
  }
}
