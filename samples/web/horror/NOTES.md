# Notes

A complete, dependency-free HTML5 game. **Open `index.html` in any browser to play** — no build step, no server, no external assets.

Top-down stealth horror: collect both keys, reach the exit at the top to escape.
A guard patrols a fixed route with a vision cone — stay out of it, or it catches
you after a short grace period. The flashlight battery drains over time (faster
when on) and low battery shrinks your view.

## Files
- `index.html` — canvas + HUD, loads `logic.js` then `game.js`
- `logic.js` — pure game logic (no DOM): movement, vision cone, patrol, pickups, battery, win/lose. Works in the browser and Node.
- `game.js` — rendering (cone wedge + low-battery vignette), input, fixed-timestep loop
- `test.js` — headless unit tests for `logic.js`

## Verification
- **Logic: unit-tested headless** — `node test.js` exercises clamp, angle normalization, input vectors, the four vision-cone cases (ahead/behind/out-of-range/outside-half-angle), the angle-wrap case (350° vs 10°), edge clamping, all-keys-before-exit (partial = no win, full = win), count-once pickups, battery drain + clamp-at-0 + on-faster-than-off, catch-past-grace + freeze-after-lost, and grace-reset on lost sight. All pass (15 groups), exits 0.
- **Syntax** — `node --check` clean on all three JS files.
- **Rendering/input** — verified by inspection, not by an automated browser run in this environment. Open `index.html` to confirm the visual/input behavior.

## Patterns worth copying
- **Vision cone done right** — `canSee` compares the enemy's facing to the to-target angle using `normalizeAngle(diff)` folded into `[-PI, PI]`, so the half-angle test is wrap-safe (a guard facing 350° still sees a target at 10°). Range is a squared-free `hypot` check. This is the bug class most cone implementations get wrong.
- **Catch grace, not instant** — the enemy must hold the player in view for `catchGrace` seconds; losing sight resets the timer. Tunable, and it makes the stealth forgiving enough to play.
- **Gate the win** — reaching the exit with keys remaining is a no-op; only `remaining === 0` AND overlap wins. The check is explicit so the order can't be fudged.
- **Resource clamped in logic, visual in render** — battery is a clamped `0..1` stat in `logic.js`; the shrinking-view vignette lives entirely in `game.js`. Logic stays testable; the scare stays cosmetic.
- **Deterministic patrol** — no `Math.random` in `logic.js`; the patrol follows injected waypoints, and a mulberry32 `makeRng` is provided for any future randomness.

## Iterate from here
- "Add a second guard with a different patrol"
- "Give the guard an alert state that speeds it up after it spots you"
- "Make the flashlight reveal keys only inside its beam"
- "Add doors that consume a specific key"
