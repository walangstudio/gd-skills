# Notes

A complete, dependency-free HTML5 Asteroids clone. **Open `index.html` in any browser to play** — no build step, no server, no external assets.

## Files
- `index.html` — canvas + HUD, loads `logic.js` then `game.js`
- `logic.js` — pure game logic (no DOM): wrap, thrust, rotation, bullets, splitting, collision, win/lose. Works in the browser and Node.
- `game.js` — vector rendering, keyboard input, fixed-timestep loop
- `test.js` — headless unit tests for `logic.js`

## Verification
- **Logic: unit-tested headless** — `node test.js` passes **13 groups**: modulo wrap (negatives + multi-screen), thrust-along-heading, rotation, bullet fires from the nose, bullet expiry, circle-circle boundary, **fast-bullet tunneling regression**, large-splits-into-2, small-destroyed, score-counts-once, `splitAsteroid` purity, life loss on collision, win-on-clear / lose-at-0-lives, and frozen-after-game-over. Exits 0.
- **Tunneling check is real** — with `maxSubStep` raised so no sub-stepping happens, the same fast bullet scores 0 (tunnels through); with the default it scores 1. So the regression test guards an actual bug, not a tautology.
- **Syntax** — `node --check` clean on all three JS files.
- **Rendering/input** — verified by inspection, not by an automated browser run in this environment. Open `index.html` to confirm the visual/input behavior (rotate, thrust flame, fire, screen-wrap, split).

## Key decisions
- **Mild damping, not frictionless or hard friction.** `damping: 0.4` /sec gives a space-y drift that still settles, so the ship is controllable on a small canvas. Set `damping: 0` in `createGame` opts for classic frictionless Asteroids. Documented and tunable.
- **Modulo wrap, not subtract.** `wrap(v, max) = ((v % max) + max) % max` so a ship one frame past the left edge reappears on the right and large overshoots wrap correctly. A single `if (v < 0) v += max` breaks for displacements larger than the screen.
- **Sub-stepped integration (anti-tunnel).** `integrate()` splits any move into sub-steps no larger than `maxSubStep` px and tests bullet-vs-asteroid collision after each, so a fast bullet can't skip over an asteroid in one `dt`. Ship and asteroids use the same integrator for wrap correctness.
- **Squared-distance collision.** `circlesHit` compares `dx*dx + dy*dy` to `(r1+r2)^2` — no `sqrt`, and the boundary case is tested exactly.
- **Injected rng, no `Math.random` in logic.js.** Split directions come from `g.rng`, which defaults to a seeded mulberry32 (`makeRng`) so tests are deterministic. `game.js` injects `Math.random` for visual variety.
- **Edge-triggered fire.** `game.js` queues one bullet per Space `keydown` (ignoring auto-repeat) and clears the flag the first time `step` consumes it, so a single press fires exactly one bullet even with the fixed-timestep accumulator running multiple sub-steps per frame.

## Patterns worth copying
- **Logic split from rendering** — pure `logic.js` with the `step(state, input, dt)` shape is testable without a DOM. The single most useful habit here.
- **Fixed-timestep accumulator** — `game.js` steps the sim at a fixed 1/60s with a spiral-of-death clamp (see `guides/game-loop-timestep.md`).
- **Injected randomness** — keep `Math.random` out of the simulation so it's deterministic and unit-testable; inject the rng at the boundary.
- **Sub-stepped collision** — the general fix for fast movers tunneling through thin colliders.

## Iterate from here
- "Add a hyperspace teleport on Shift that drops the ship at a random spot"
- "Give asteroids three size tiers (large -> medium -> small)"
- "Add a UFO that drifts across and shoots back"
