# Notes

A complete, dependency-free HTML5 top-down space shooter. **Open `index.html` in any browser to play** — no build step, no server, no external assets.

## Files
- `index.html` — canvas + HUD, loads `logic.js` then `game.js`
- `logic.js` — pure game logic (no DOM, no `Math.random`): movement, firing, spawning, collision, life loss, win/lose state. Works in the browser and Node.
- `game.js` — rendering, keyboard input, the injected RNG (`Math.random`), and the fixed-timestep loop
- `test.js` — headless unit tests for `logic.js`

## Verification
- **Logic: unit-tested headless** — `node test.js` passes **13 groups**: helpers (clamp/AABB/input), movement clamp, fire cooldown (1s @ 0.25s = 4 shots), bullet-vs-enemy hit, **tunneling regression**, life loss on bottom-reach, life loss on player collision, win at goal, lose at 0 lives, **win/lose precedence**, frozen-after-end, kill-counts-once, and deterministic rng spawning. Exits 0.
- **Syntax** — `node --check` clean on `logic.js`, `game.js`, `test.js`.
- **Rendering/input** — verified by inspection, not by an automated browser run in this environment. Open `index.html` to confirm the visual/input behavior (ship draw, bullet/enemy rendering, win/lose overlay, R restart).

## Key design decisions
- **Injected RNG.** `Logic.step(g, input, dt, rng)` takes the random source as a parameter; `logic.js` contains **no `Math.random`**. `game.js` passes `() => Math.random()`; tests pass a deterministic sequence generator. This is what makes spawn-dependent behavior reproducible in tests.
- **Sub-stepping against tunneling.** A bullet (or enemy) moving more than the smallest collider dimension in one step would jump *past* its target without ever overlapping. `integrate()` splits the frame into `ceil(maxDisplacement / minColliderSize)` sub-steps and resolves collisions after each, so a 5000 px/s bullet at dt=0.1 (500 px/frame) still hits a 22 px enemy in its path. Covered by the tunneling regression test.
- **Win/lose precedence.** Survival is checked before the win condition: if a kill on the same step reaches the goal *and* an enemy drains the last life, the run is reported **"lost"**. The kill still scores; the result just doesn't misreport a win you didn't survive. Covered by the precedence test.
- **Fire cooldown as state.** `cooldown` counts down each step; `fire()` is a no-op while it's positive. Holding fire yields exactly `floor(duration / fireCooldown)` shots — tested.
- **Each kill counts once.** Bullets and enemies carry a `dead` flag set on first overlap; dead entities are filtered out at the end of the step, so a kill scores exactly once even across multiple steps.

## Patterns worth copying
- **Logic split from rendering** — pure `logic.js` (`step(state, input, dt, rng)`) is testable without a DOM. The single most useful habit here.
- **Fixed-timestep accumulator** — `game.js` steps the sim at a fixed 1/60 s with a clamp against the spiral-of-death (see `guides/game-loop-timestep.md`).
- **Injected randomness** — dependency-inject the RNG so the simulation is deterministic under test.
- **Continuous-collision sub-stepping** — the fix for fast-mover tunneling; reusable wherever a mover can travel farther than a collider in one frame.

## Iterate from here
- "Add enemies that fire bullets downward"
- "Add waves that increase enemy speed and spawn rate over time"
- "Add a power-up that widens the ship's fire to three bullets"
