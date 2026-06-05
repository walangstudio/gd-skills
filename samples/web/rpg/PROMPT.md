# Prompt

The prompt that produced this sample:

> /create-classic-game a tiny top-down tile RPG slice for the Web: an 8x6 grid
> dungeon of floor/wall/enemy/item/exit tiles. Arrow keys / WASD step the player
> one tile at a time; walking into an enemy is bump-combat (deterministic, player
> hits then a surviving enemy hits back); kills grant xp + gold and level up
> (raise stats, refill hp). Step onto a potion to pick it up; P drinks one,
> healing without overheal. Escape through the exit once every enemy is cleared
> to win; hp to 0 loses. Vanilla JavaScript and canvas, no build step, no external
> assets — one index.html plus one game.js, with the mechanics in a pure logic.js.

## Why it's shaped this way

- **Web + vanilla canvas** so it runs by opening `index.html` — no bundler, no CDN, no binary assets.
- **Named the scope** (8x6 grid, bump-combat, level-up, potions, exit-to-win) so the result is bounded.
- **Pure tile logic split out** so the real bug classes — off-map bounds, count-once combat, level-up math, overheal — are unit-tested headless.
- **Deterministic combat (no `Math.random`)** so every fight is reproducible in tests. Inject `opts.rng` if you later want damage variance.

Iterate from here with follow-ups like: "add ranged enemies", "add a shop on the
exit tile", "give items beyond potions (keys, weapons)", "add fog-of-war".
