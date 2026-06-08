# Notes

A complete, dependency-free HTML5 game. **Open `index.html` in any browser to play** — no build step, no server, no external assets.

Top-down survival slice: gather wood and food, manage health/hunger/energy, craft a campfire (5 wood) or axe (3 wood + 1 food), and survive the day-night cycle to day 3.

## Files
- `index.html` — canvas + HUD, loads `logic.js` then `game.js`
- `logic.js` — pure game logic (no DOM): movement, stats, gather, craft, day-night, win/lose. Works in the browser and Node.
- `game.js` — rendering, input, fixed-timestep loop
- `test.js` — headless unit tests for `logic.js`

## Controls
- Arrow keys — move (clamped to world bounds)
- E — gather from the nearest in-reach resource node
- F — eat one food (restores hunger, capped at 100)
- 1 / 2 — craft campfire / axe
- R — restart

## Verification
- **Logic: unit-tested headless** — `node test.js` exercises clamping, input vectors, edge clamping, hunger decay, stat clamps at both bounds, the hunger→health starvation boundary (hunger 1 vs 0), health-clamp/death, gather-once-per-node, reach, atomic craft (insufficient = no-op, sufficient = exact deduct, double-craft = double cost), day-rollover-once-per-cycle, night penalty multiplier, survive-to-day win, frozen-after-end, and the goal-item win path. All pass (15 groups).
- **Syntax** — `node --check` clean on all three JS files.
- **Rendering/input** — verified by inspection, not by an automated browser run in this environment. Open `index.html` to confirm the visual/input behavior. `game.js` calls only the `Logic.*` signatures `logic.js` exports and only references DOM ids defined in `index.html`.

## Correctness rules (each has a test)
- **Stat clamping** — no stat exceeds 100 or drops below 0. Eating at hunger 95 with a 20-restore caps at 100; health never stored negative.
- **Hunger→health coupling** — health drains from starvation only when hunger is *exactly* 0 (tested at the 1-vs-0 boundary), not before.
- **Gather once per node** — a node has `qty`; it yields once per pull and a depleted (`qty 0`) node yields nothing on re-interaction.
- **Atomic craft** — insufficient resources returns `false` and deducts nothing; sufficient deducts the exact cost once and grants one item. Double-craft needs double resources.
- **Day-night** — the clock accumulates and the day counter increments by completed `dayLength` cycles (once per cycle, not per step); the night penalty multiplier applies only during the back half of the cycle.
- **Frozen after end** — once `state` is `won` or `dead`, `step`/`gather`/`craft`/`eat` are all no-ops.

## Patterns worth copying
- **Logic split from rendering** — pure `logic.js` is testable without a DOM (the `step(state, input, dt)` shape plus pure action helpers `gather`/`craft`/`eat`). This is the single most useful habit here.
- **No `Math.random` in logic.js** — all randomness (node spawn positions) lives in `game.js`; the simulation is fully deterministic and testable. Inject an `rng` via `opts` if logic ever needs it.
- **Zero-safe option defaults** — `num(v, d)` treats only `undefined`/`null` as missing, so a tuning value of `0` (e.g. `hungerRate: 0` in a test) is honored instead of being clobbered by `||`.
- **Fixed-timestep accumulator** — `game.js` steps the sim at a fixed 1/60s with a clamp against the spiral-of-death, so the simulation is frame-rate independent (see `guides/game-loop-timestep.md`).
- **Data-driven entities & recipes** — nodes are plain `{x,y,type,qty,amount}` objects; recipes live in `RECIPES`; tuning lives in `createGame(opts)`.

## Iterate from here
- "Add enemies that spawn at night and attack on contact"
- "Add a thirst stat with water nodes"
- "Make low energy reduce movement speed"
