# Notes

A complete, dependency-free HTML5 game. **Open `index.html` in any browser to play** — no build step, no server, no external assets.

## Files
- `index.html` — canvas + HUD (score / lives), loads `logic.js` then `game.js`
- `logic.js` — pure game logic (no DOM): paddle clamping, ball physics, brick collision, win/lose state. Works in the browser and Node.
- `game.js` — rendering, input (mouse + arrows), fixed-timestep loop
- `test.js` — headless unit tests for `logic.js`

## Verification
- **Logic: unit-tested headless** — `node test.js` exercises paddle clamping, wall reflection, ceiling reflection, brick kill + score, win on last brick, life loss past the bottom, lose at zero lives, and freeze after win/loss. All pass (11 groups).
- **Syntax** — `node --check` clean on all three JS files.
- **Rendering/input** — verified by inspection, not by an automated browser run in this environment. Open `index.html` to confirm the visual/input behavior.

## Patterns worth copying
- **Logic split from rendering** — pure `logic.js` is testable without a DOM (the `step(state, dt)` shape). This is the single most useful habit here.
- **AABB reflection** — the ball reflects off walls, ceiling, paddle, and bricks by resolving on the shallower penetration axis (`overlapX` vs `overlapY` in `step`), reusable for any box-vs-box bounce.
- **Fixed-timestep accumulator** — `game.js` steps the sim at a fixed 1/60s with a clamp against the spiral-of-death, so the ball is frame-rate independent (see `guides/game-loop-timestep.md`).
- **Data-driven entities** — paddle, ball, and bricks are plain objects; tuning lives in `createGame(opts)` (speed, lives, grid).

## Iterate from here
- "Add multiple brick rows worth different points and colors"
- "Add a power-up that widens the paddle for a few seconds"
- "Speed the ball up a little each time a brick is cleared"
