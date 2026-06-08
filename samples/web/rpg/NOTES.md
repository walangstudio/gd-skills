# Notes

A complete, dependency-free HTML5 game. **Open `index.html` in any browser to play** — no build step, no server, no external assets.

A top-down tile RPG slice: step around an 8x6 dungeon, bump-fight enemies, pick up potions, level up, and escape through the exit once everything is cleared.

## Files
- `index.html` — canvas + HUD, loads `logic.js` then `game.js`
- `logic.js` — pure game logic (no DOM): tile movement, bump-combat, items, leveling, win/lose. Works in the browser and Node.
- `game.js` — rendering, input (turn-based on keydown), HUD sync
- `test.js` — headless unit tests for `logic.js`

## Controls
- Arrow keys / WASD — step one tile; into an enemy = bump-attack
- P — drink a potion (heals, capped at maxHp)
- R — restart

## Verification
- **Logic: unit-tested headless** — `node test.js` exercises bounds (off every edge), wall-block, bump-combat, count-once kills, xp/gold-once, level-up (stats + hp refill + xp carryover), item pickup (no duplicate), potion heal-cap + single-consume, death, win-only-when-cleared, and freeze-after-win/loss. All pass (14 groups), exit 0.
- **Syntax** — `node --check` clean on all three JS files.
- **Rendering/input** — verified by inspection, not by an automated browser run in this environment. Open `index.html` to confirm the visual/input behavior. Canvas is 320x240 = 8x6 tiles at 40px; every DOM id `game.js` reads (`hp`, `lvl`, `gold`, `pot`, `state`, `game`) exists in `index.html`.

## Patterns worth copying
- **Logic split from rendering** — pure `logic.js` is testable without a DOM (the `step(state, dir)` shape). The single most useful habit here.
- **Deterministic combat** — no `Math.random` in `logic.js`, so fights are reproducible. Inject `opts.rng` only if you want variance, keeping the core testable.
- **Bounds-check every tile access** — `tileAt` returns `WALL` for out-of-bounds, and `step` early-returns on an off-map target, so edge moves are no-ops instead of crashes.
- **Data-driven entities** — map, enemies, and items are plain data passed to `createGame(opts)`; the dungeon layout lives as a string grid in `game.js`.
- **State gate** — `step`/`usePotion` no-op unless `state === "playing"`, so a finished game is frozen in one place.

## Iterate from here
- "Add ranged enemies that hit from a distance"
- "Add a shop tile that spends gold on potions or atk"
- "Add more item kinds — keys that open locked doors, a weapon that raises atk"
- "Add fog-of-war that reveals tiles as you explore"
