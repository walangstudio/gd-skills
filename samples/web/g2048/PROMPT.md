# Prompt

The prompt that produced this sample:

> /create-classic-game a tiny 2048 sliding-tile puzzle for the Web: a 4x4 grid
> of numbers, arrow keys slide and merge equal tiles, reach 2048 to win, R to
> restart. Vanilla JavaScript and a DOM grid, no build step, no external assets
> — one index.html, one game.js, plus a pure logic.js. Keep all mechanics
> (slide/merge, move, spawn, win/lose) in logic.js as DOM-free functions with an
> injected rng so they can be unit-tested headless.

## Why it's shaped this way

- **Web + DOM grid** so it runs by opening `index.html` — no bundler, no CDN, no binary assets. A 4x4 grid of `<div>`s is simpler than canvas here and the tiles are just text.
- **Named the scope** (4x4, reach 2048, restart on R) so the result is bounded.
- **Named the mechanics and the bugs to avoid** — single-merge-per-move (no `[2,2,2,2] -> [8]`), `moved` flag to skip spawning on a no-op move, reuse one `slideRowLeft` for all four directions via reverse/transpose. Those are the classic 2048 mistakes.
- **Injected rng** (no `Math.random` in `logic.js`) so `spawnTile` is deterministic under test.

Iterate from here with follow-ups like: "add an undo (keep the last grid)",
"animate the tile slides", "add a best-score in localStorage".
