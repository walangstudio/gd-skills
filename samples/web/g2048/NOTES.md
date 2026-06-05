# Notes

A complete, dependency-free 2048. **Open `index.html` in any browser to play** — no build step, no server, no external assets. The board is a 4x4 DOM grid of `<div>`s.

## Files
- `index.html` — the DOM grid + HUD, loads `logic.js` then `game.js`
- `logic.js` — pure game logic (no DOM): slide/merge, move, spawn, win/lose. Works in the browser and Node.
- `game.js` — rendering, arrow-key input, restart
- `test.js` — headless unit tests for `logic.js`

## Verification
- **Logic: unit-tested headless** — `node test.js` exercises compress, single-merge, no-double-merge, scoring, all four move directions, `moved=false` on a no-op, deterministic `spawnTile` (cell + 2-vs-4 + no-overwrite + full-board no-op), `hasMoves` true/false, win at 2048, lose when stuck, and `applyMove` no-op. All pass (**16 groups**), exit 0.
- **Syntax** — `node --check` clean on all three JS files.
- **Rendering/input** — verified by inspection, not by an automated browser run in this environment. Open `index.html` to confirm the visual/input behavior.

## Key decisions
- **One `slideRowLeft`, four directions** — `move()` reverses rows for `right`, transposes for `up`, and reverse+transpose for `down`, runs the single left-slide, then transforms back. No per-direction merge code to keep in sync.
- **No-double-merge** — `slideRowLeft` compresses non-zeros, then walks left-to-right merging a pair and skipping its partner (`i++`), so a freshly merged tile can't merge again this move. `[2,2,2,2] -> [4,4,0,0]`, not `[8,0,0,0]`. This is the test that matters most; it's explicit in `test.js`.
- **`moved` flag** — `move()` reports whether anything changed; `applyMove` only spawns a tile (and only changes score/state) when `moved` is true, so a no-op press never spawns.
- **Injected rng** — `spawnTile(grid, rng)` takes the rng so it's deterministic under test; `game.js` passes `Math.random`. No `Math.random` in `logic.js`.
- **Lose only when truly stuck** — `hasMoves` checks all four directions; the lost-state test uses a real full board where the freed cell refills into a fully-stuck grid (found by search, not hand-waved).

## Patterns worth copying
- **Logic split from rendering** — pure `logic.js` is testable without a DOM. Same habit as the coin-collector sample.
- **Transform-to-canonical** — solving one orientation (`slideRowLeft`) and mapping the others onto it via reverse/transpose. Reusable any time a grid op is symmetric across directions.
- **Dependency injection for randomness** — pass the rng in instead of reaching for the global, so the random path is deterministic in tests.

## Iterate from here
- "Add undo: stash the previous grid+score and restore on U"
- "Persist a best score in localStorage"
- "Animate tile slides with CSS transforms"
