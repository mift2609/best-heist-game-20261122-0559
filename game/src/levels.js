// levels.js — the three floors of the Velvet Vault heist.
//
// Each floor is a 40 x 20 tile room. Walls and cover block movement and
// block vision. Shadows are dark patches that slow detection. Guards walk
// their waypoint loops; cameras sweep from the walls. The vault is the
// loot target and the exit only opens once it is cracked.
//
// Coordinates are tile units: {x, y, w, h} rectangles, [col, row] points,
// angles in degrees (0 = east, 90 = south, the canvas way).
function wall(x, y, w, h) {
  return { x, y, w, h };
}
function guard(waypoints) {
  return { waypoints };
}
function camera(col, row, baseDeg, sweepDeg) {
  return { col, row, baseDeg, sweepDeg };
}
function loot(col, row, kind) {
  return { col, row, kind };
}

export const LEVELS = [
  {
    name: 'FLOOR 1 — THE LOBBY',
    sub: 'Slip in, crack the vault, get out before the timer ends.',
    timeLimit: 150,
    playerStart: [3, 18],
    vault: { col: 36, row: 1 },
    exit: { col: 1, row: 18 },
    walls: [
      wall(12, 4, 1, 7),
      wall(20, 10, 10, 1),
      wall(28, 2, 1, 5),
      wall(6, 8, 4, 1),
    ],
    cover: [
      { ...wall(6, 14, 2, 2), kind: 'crate' },
      { ...wall(20, 4, 2, 1), kind: 'desk' },
      { ...wall(32, 14, 1, 1), kind: 'plant' },
      { ...wall(16, 15, 3, 1), kind: 'desk' },
      { ...wall(34, 8, 1, 2), kind: 'crate' },
    ],
    shadows: [wall(4, 10, 5, 3), wall(22, 15, 6, 3), wall(33, 3, 4, 2)],
    guards: [
      guard([[8, 3], [8, 12], [20, 12], [20, 3]]),
      guard([[30, 8], [30, 16], [36, 16], [36, 8]]),
    ],
    cameras: [camera(20, 0, 90, 70)],
    loot: [
      loot(5, 6, 'gold'),
      loot(15, 16, 'cash'),
      loot(25, 12, 'gem'),
      loot(33, 5, 'gold'),
      loot(18, 8, 'cash'),
    ],
  },
  {
    name: 'FLOOR 2 — THE GALLERY',
    sub: 'Paintings worth a fortune, and twice the eyes watching them.',
    timeLimit: 170,
    playerStart: [2, 10],
    vault: { col: 37, row: 10 },
    exit: { col: 1, row: 1 },
    walls: [
      wall(10, 2, 1, 8),
      wall(10, 12, 1, 6),
      wall(24, 3, 8, 1),
      wall(24, 15, 8, 1),
      wall(17, 9, 6, 1),
    ],
    cover: [
      { ...wall(5, 4, 2, 1), kind: 'desk' },
      { ...wall(14, 5, 1, 2), kind: 'plant' },
      { ...wall(15, 15, 3, 1), kind: 'crate' },
      { ...wall(28, 8, 2, 1), kind: 'desk' },
      { ...wall(34, 16, 2, 1), kind: 'crate' },
      { ...wall(30, 12, 1, 1), kind: 'plant' },
    ],
    shadows: [wall(3, 14, 5, 3), wall(26, 5, 5, 3), wall(12, 2, 4, 2)],
    guards: [
      guard([[5, 2], [5, 17], [8, 17], [8, 2]]),
      guard([[19, 5], [19, 14], [22, 14], [22, 5]]),
      guard([[31, 4], [31, 12], [36, 12], [36, 4]]),
    ],
    cameras: [camera(14, 0, 90, 80), camera(32, 19, 270, 70)],
    loot: [
      loot(4, 8, 'cash'),
      loot(13, 16, 'gold'),
      loot(20, 6, 'gem'),
      loot(27, 13, 'gold'),
      loot(34, 6, 'cash'),
      loot(37, 15, 'gem'),
    ],
  },
  {
    name: 'FLOOR 3 — THE VAULT FLOOR',
    sub: 'The crown jewels. Four guards, three cameras, one way out.',
    timeLimit: 190,
    playerStart: [20, 18],
    vault: { col: 19, row: 1 },
    exit: { col: 38, row: 18 },
    walls: [
      wall(8, 3, 1, 9),
      wall(31, 3, 1, 9),
      wall(14, 7, 4, 1),
      wall(22, 12, 4, 1),
      wall(14, 13, 1, 4),
      wall(25, 3, 1, 4),
    ],
    cover: [
      { ...wall(4, 6, 2, 1), kind: 'crate' },
      { ...wall(4, 14, 1, 1), kind: 'plant' },
      { ...wall(12, 16, 3, 1), kind: 'desk' },
      { ...wall(27, 16, 3, 1), kind: 'desk' },
      { ...wall(35, 6, 2, 1), kind: 'crate' },
      { ...wall(35, 14, 1, 1), kind: 'plant' },
    ],
    shadows: [wall(2, 3, 4, 3), wall(17, 4, 6, 2), wall(33, 16, 5, 2)],
    guards: [
      guard([[4, 2], [4, 17], [7, 17], [7, 2]]),
      guard([[12, 4], [12, 15], [16, 15], [16, 4]]),
      guard([[24, 4], [24, 15], [28, 15], [28, 4]]),
      guard([[33, 2], [33, 17], [36, 17], [36, 2]]),
    ],
    cameras: [camera(10, 0, 90, 75), camera(20, 0, 90, 60), camera(30, 0, 90, 75)],
    loot: [
      loot(3, 9, 'cash'),
      loot(10, 10, 'gold'),
      loot(16, 5, 'gem'),
      loot(20, 9, 'crown'),
      loot(23, 5, 'gem'),
      loot(29, 10, 'gold'),
      loot(36, 9, 'cash'),
      loot(18, 16, 'gold'),
    ],
  },
];

// Tile helpers: convert tile coords to room pixels (room origin is the
// top-left corner under the HUD bar).
export function tileCenterPx(col, row) {
  return { x: (col + 0.5) * 32, y: (row + 0.5) * 32 };
}
export function rectPx(rect) {
  return { x: rect.x * 32, y: rect.y * 32, w: rect.w * 32, h: rect.h * 32 };
}
