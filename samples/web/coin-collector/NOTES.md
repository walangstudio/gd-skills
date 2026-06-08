# Notes

A complete, dependency-free HTML5 game. **Open `index.html` in any browser to play** — no build step, no server, no external assets.

## Files
- `index.html` — canvas + HUD, loads `logic.js` then `game.js`
- `logic.js` — pure game logic (no DOM): movement, collision, win state. Works in the browser and Node.
- `game.js` — rendering, input, fixed-timestep loop
- `test.js` — headless unit tests for `logic.js`

## Verification
- **Logic: unit-tested headless** — `node test.js` exercises clamping, diagonal-normalized input, AABB-vs-circle collision, edge clamping, win condition, count-once, and freeze-after-win. All pass (8 groups).
- **Syntax** — `node --check` clean on all three JS files.
- **Rendering/input** — verified by inspection, not by an automated browser run in this environment. Open `index.html` to confirm the visual/input behavior.

## Patterns worth copying
- **Logic split from rendering** — pure `logic.js` is testable without a DOM (the `step(state, input, dt)` shape). This is the single most useful habit here.
- **Fixed-timestep accumulator** — `game.js` steps the sim at a fixed 1/60s with a clamp against the spiral-of-death, so movement is frame-rate independent (see `guides/game-loop-timestep.md`).
- **Data-driven entities** — coins and the player are plain objects; tuning lives in `createGame(opts)` (goal, speed, size).
- **AABB-vs-circle** — closest-point collision in `hitsCircle`, reusable for any box/circle pickup.

## Iterate from here
- "Add an enemy that chases the player and ends the run on contact"
- "Add a 30-second timer and a score for time remaining"
- "Make every 5th coin worth 3 and a different color"
