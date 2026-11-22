# Velvet Vault — The Midnight Heist

[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![Rank](https://make.fun/badge/best-heist-game-20261122-0559/mift2609/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![Reward](https://make.fun/badge/best-heist-game-20261122-0559/mift2609/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

**Velvet Vault** is an original top-down heist game that runs entirely
offline in a desktop browser. You are the thief in the black hat: slip
past patrolling guards and sweeping security cameras, hold `E` to crack
the vault, pocket the gold, gems and cash, and reach the green EXIT
before the alarm timer runs out — across three floors of the Velvet
Vault, each busier and better guarded than the last.

Owner: **mift2609** · Repo: **best-heist-game-20261122-0559**

## How to play

- **Move** with `WASD` or the arrow keys. **Shift** sneaks — slower,
  quieter, and much harder to spot.
- **Guards** patrol fixed routes with yellow vision cones. Step into a
  cone and their suspicion climbs; at 100% they raise the alarm and
  chase you. Break line of sight and they give up and go back.
- **Cameras** sweep red cones from the walls. Being seen by one fills
  the **alarm meter** directly. At 100% the vault seals shut and the
  run is over.
- **Shadows** (dark blue patches) hide you — detection is halved there.
  **Sneaking** halves it again.
- **Q** or a **mouse click** throws a coin (3 per floor) to lure a guard
  away from your route.
- **Hold E beside the vault** to crack it (about 3.5 seconds — don't let
  go). The vault pays **$5,000** and unlocks the green **EXIT**.
- Walk over **loot** to pocket it: cash $150, gold $250, gems $500, and
  on the last floor the crown $1,200.
- Finish a floor without ever being spotted for a **+$500 ghost bonus**,
  plus $10 per second left on the timer.
- Three floors of rising difficulty: **The Lobby** (2 guards, 1 camera),
  **The Gallery** (3 guards, 2 cameras), **The Vault Floor** (4 guards,
  3 cameras, the crown jewels). Keys: `P` pause · `M` mute ·
  `R` restart floor · `Enter` start. Your best score is saved in the
  browser.

## Run it

No build step, no network. Serve the `game/` folder with any static
server and open `game/index.html`, e.g.:

```sh
cd game && python3 -m http.server 8080
# open http://localhost:8080/
```

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` with the vendored make.fun library.
- `game/index.html` — the page shell: canvas, styles and the module
  loader; the HUD is drawn on the canvas so it is in every screenshot.
- `game/src/config.js` — every tuning constant: speeds, cones, detection,
  alarm, vault, scoring and colours.
- `game/src/levels.js` — the three floor maps (walls, cover, shadows,
  guard patrols, cameras, loot, vault and exit).
- `game/src/world.js` — the simulation: guard patrol/chase/investigate
  AI, vision cones with line of sight, suspicion, the alarm meter,
  vault cracking, loot, coins and the exit.
- `game/src/render.js` — paints the heist top-down: floor, velvet
  carpet, shadows, cones, guards, cameras, vault, loot, exit, the thief
  and every screen (title, pause, busted, floor clear, getaway).
- `game/src/input.js` — keyboard movement and mouse coin throws.
- `game/src/audio.js` — procedural WebAudio sounds (pickup, crack ticks,
  alarm, vault, clear, win). No sound files.
- `game/src/game.js` — the state machine: screens, score, ghost bonus,
  best score and floor flow.
- `game/src/shots.js` — the autopilot that stages the screenshot scenes.
- `game/src/main.js` — bootstrap and the fixed-step game loop.
- `screenshots/` — real renders of the game in a browser.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

## Screenshots

`?shot=start` shows the title screen over a live patrol, `?shot=play`
a mid-heist moment — thief sneaking at the vault, a guard closing in,
alarm at 38% — and `?shot=end` the clean getaway screen, handy for
taking the screenshots in `screenshots/`.
