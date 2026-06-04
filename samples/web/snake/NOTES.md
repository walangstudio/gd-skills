# Notes

A complete, dependency-free HTML5 game. **Open `index.html` in any browser to play** — no build step, no server, no external assets.

## Files
- `index.html` — canvas + HUD, loads `logic.js` then `game.js`
- `logic.js` — pure game logic (no DOM): movement, growth, collision, food placement. Works in the browser and Node.
- `game.js` — rendering, input, fixed-tick loop
- `test.js` — headless unit tests for `logic.js`

## Verification
- **Logic: unit-tested headless** — `node test.js` exercises one-cell advance, 180-degree reversal rejection, grow-and-score on eat, wall death, self-collision death, freeze-after-death, and deterministic food placement. All pass (7 groups).
- **Syntax** — `node --check` clean on all three JS files.
- **Rendering/input** — verified by inspection, not by an automated browser run in this environment. Open `index.html` to confirm the visual/input behavior.

## Patterns worth copying
- **Logic split from rendering** — pure `logic.js` is testable without a DOM (the `step(state, rng)` shape). This is the single most useful habit here.
- **Injected rng for determinism** — food placement takes an rng argument instead of calling `Math.random` inside the logic, so tests pin exactly where food lands. `Math.random` lives only in `game.js`.
- **Fixed tick for discrete moves** — `game.js` advances the snake once every 0.12s via an accumulator, so the move cadence is frame-rate independent (see `guides/game-loop-timestep.md`).
- **Reversal guard** — `setDir` rejects 180-degree turns against the committed `dir`, so a double tap in one tick can't fold the snake back on itself.
- **Tail-aware self-collision** — the tail cell is freed before the head check unless the snake is growing, so chasing your own tail is legal.

## Iterate from here
- "Add a wrap-around mode where edges teleport instead of killing"
- "Speed the tick up by 10% every 5 points"
- "Add a rare golden food worth 3 points and a different color"
