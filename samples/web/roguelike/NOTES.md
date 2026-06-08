# Notes

A complete, dependency-free HTML5 turn-based roguelike. **Open `index.html` in any browser to play** — no build step, no server, no external assets.

## Files
- `index.html` — canvas + HUD, loads `logic.js` then `game.js`
- `logic.js` — pure game logic (no DOM): dungeon generation, turn stepping, chase AI, combat, descend/win/lose. Works in the browser and Node.
- `game.js` — grid rendering, keyboard input, the turn loop (advances only on a keypress)
- `test.js` — headless unit tests for `logic.js`

## How a turn works
`step(g, action)` is the whole game clock. The player acts first (move, bump-attack, or wait); then **every living enemy takes exactly one turn**. There is no `dt` and no `requestAnimationFrame` simulation — `game.js` only redraws; it calls `step` once per keypress.

- A move into a wall or off the edge is a **no-op that does not consume a turn** (you don't lose a move to a bonk, and enemies don't get a free step). Documented and tested.
- Attacking and waiting **do** consume a turn (enemies still act).
- Once `state` is `won` or `lost`, `step` is frozen — no further turns process.

## Verification
- **Logic: unit-tested headless** — `node test.js` exercises RNG determinism, dungeon determinism, end-to-end determinism (same seed + actions → identical outcome), wall/edge bounds on player and enemy moves, enemy-acts-exactly-once, no-stacking, bump damage once, dead-enemy removed once, attack-is-a-turn, enemy-kills-player, freeze-after-game-over, and descend/win on the stairs. All pass (**15 groups**), exits 0.
- **Syntax** — `node --check` clean on all three JS files.
- **Rendering/input** — verified by inspection, not by an automated browser run in this environment. Open `index.html` to confirm the visual/input behavior.

## Patterns worth copying
- **Logic split from rendering** — pure `logic.js` is testable without a DOM (the `step(state, action)` shape). This is the single most useful habit here.
- **Injected RNG, never `Math.random` in logic** — `makeRng(seed)` (mulberry32) is passed into `generateDungeon`, so the same seed reproduces the exact dungeon and run. `game.js` is the only place that picks a seed with `Math.random`. This is what makes the determinism tests possible.
- **Turn-based stepping** — the world advances per discrete action, not per frame. Easy to reason about and trivially deterministic.
- **Greedy chase AI** — step on the axis with the larger gap; fall back to the other axis if blocked; never move through walls, off the grid, or onto another creature. A cheap, readable baseline before A*.
- **Snapshot the actor list before iterating** — `g.enemies.slice()` so a mid-loop removal (a dead enemy) can't skip or double-act another enemy.

## Iterate from here
- "Add fog of war and a torch radius"
- "Add pickups: a healing potion and a damage scroll"
- "Replace greedy chase with A* pathfinding"
