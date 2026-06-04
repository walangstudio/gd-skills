# Notes

A complete, dependency-free tower defense. **Open `index.html` to play** — click to place towers, defend the path, clear both waves. No build step, no assets.

## Files
- `index.html` — canvas + HUD (gold / lives / wave), loads `logic.js` then `game.js`
- `logic.js` — pure logic (no DOM): waypoint enemy movement, tower targeting/firing, gold/lives, waves, win/lose. Runs in the browser and Node.
- `game.js` — rendering, click-to-place input, fixed-timestep loop
- `test.js` — headless unit tests for `logic.js`

## Verification
- **Logic: unit-tested headless** — `node test.js` covers path advancement, leak→life-loss, tower placement/funds/occupancy, in-range damage+kill+reward, furthest-progressed targeting, win on all-waves-cleared, loss on zero lives, and freeze-after-end. All pass (9 groups).
- **Syntax** — `node --check` clean on all three JS files.
- **Rendering/input** — verified by inspection, not by an automated browser run in this environment. Open `index.html` to confirm.

## Patterns worth copying
- **Waypoint pathing** — enemies carry a `wp` index + cumulative `traveled`; `advanceEnemy` walks the budget across multiple waypoints in one step (no overshoot, no skipped corners).
- **Deterministic targeting** — "furthest along the path within range" is a single, testable rule (`traveled` is the sort key).
- **Schedule-driven spawning** — waves spawn on an interval, so the whole sim is reproducible and unit-testable with no RNG.
- **Loss beats a same-step win** — leaking your last life is a loss even if it emptied the board.

## Iterate from here
- "Add a slow tower and a splash tower"
- "Add a third, faster wave and a boss enemy"
- "Let me sell a tower for half its cost"
