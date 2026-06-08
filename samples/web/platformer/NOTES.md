# Notes

A complete, dependency-free HTML5 platformer. **Open `index.html` in any browser to play** — no build step, no server, no external assets.

## Files
- `index.html` — canvas + HUD, loads `logic.js` then `game.js`
- `logic.js` — pure game logic (no DOM): gravity, jumping, AABB platform collision, win state. Works in the browser and Node.
- `game.js` — rendering, input, fixed-timestep loop
- `test.js` — headless unit tests for `logic.js`

## Verification
- **Logic: unit-tested headless** — `node test.js` exercises gravity, horizontal movement, landing on a platform, jump gated to the ground (no mid-air double jump), the world-floor clamp, the goal win condition, and freeze-after-win. All pass (9 groups).
- **Syntax** — `node --check` clean on all three JS files.
- **Rendering/input** — verified by inspection, not by an automated browser run in this environment. Open `index.html` to confirm the visual/input behavior.

## Patterns worth copying
- **Logic split from rendering** — pure `logic.js` is testable without a DOM (the `step(state, input, dt)` shape). This is the single most useful habit here.
- **Gravity + AABB platform resolution** — vy accumulates gravity each step; collisions resolve per-axis so landing on top snaps the player to the platform top and stops vy, while side and underside hits stop penetration.
- **onGround-gated jump** — `onGround` is reset every step before collision resolution and only re-earned by a landing, so a jump cannot repeat in mid-air.
- **Fixed-timestep accumulator** — `game.js` steps the sim at a fixed 1/60s with a clamp against the spiral-of-death, so physics is frame-rate independent (see `guides/game-loop-timestep.md`).

## Iterate from here
- "Add a moving platform that carries the player"
- "Add spikes that reset the run on contact"
- "Add coyote time and jump buffering so jumps feel forgiving"
