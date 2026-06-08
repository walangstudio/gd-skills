# Notes

A complete, dependency-free match-3 puzzle. **Open `index.html` to play** — click two adjacent gems to swap; matches clear, drop, refill, and cascade. No build step, no assets.

## Files
- `index.html` — canvas + score HUD, loads `logic.js` then `game.js`
- `logic.js` — pure logic (no DOM): match detection, swap-or-revert, gravity, RNG-injected refill, cascades. Runs in the browser and Node.
- `game.js` — rendering, click-to-swap input, redraw loop (passes `Math.random` as the RNG)
- `test.js` — headless unit tests for `logic.js`

## Verification
- **Logic: unit-tested headless** — `node test.js` covers horizontal/vertical match detection, no-match grids, non-adjacent + no-match swap rejection (exact revert), a matching swap (moved/cleared/score), full board settle after a swap (no matches, no holes — proving cascades + refill resolved), and column gravity. All pass (8 groups).
- **Syntax** — `node --check` clean on all three JS files.
- **Rendering/input** — verified by inspection, not by an automated browser run in this environment. Open `index.html` to confirm.

## Patterns worth copying
- **Injected RNG** — randomness is a parameter, not a global call, so the logic is deterministic and testable. The single most useful habit for any procedural system.
- **Match detection by run-scan** — one pass per row and per column, marking runs of 3+; no per-cell neighbor checks.
- **Resolve loop = the cascade** — clear → gravity → refill → re-scan until stable; the same loop handles a single match and a 5-chain cascade.
- **Swap-or-revert** — apply the swap, test for a match, undo if none; the move is only committed when it does something.

## Iterate from here
- "Add a 20-move limit and a target score to win"
- "Make a 4-match leave a line-clearing special gem"
- "Animate gems sliding and falling"
