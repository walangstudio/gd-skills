# Prompt

The prompt that produced this sample:

> /create-classic-game a tiny turn-based grid roguelike for the Web: a procedural
> dungeon of rooms and corridors on a 24x16 grid, an `@` player with hp, `g`
> enemies that chase greedily, bump-to-attack combat, and `>` stairs to descend.
> The world only advances when the player acts (no real-time loop). Win by
> reaching the stairs at the target depth; lose at 0 hp. Vanilla JavaScript and
> canvas, no build step, no external assets — one index.html plus one game.js,
> with the pure logic split out for headless unit tests.

## Why it's shaped this way

- **Web + vanilla canvas** so it runs by opening `index.html` — no bundler, no CDN, no binary assets.
- **Named the scope** (24x16 grid, descend to a target depth, `@`/`g`/`>` glyphs) so the result is bounded.
- **Named the patterns** (turn-based stepping, greedy chase, bump-to-attack, injected RNG) so the loop, the AI, and determinism are correct by construction, not accidental.
- **Pure logic split** (`logic.js`) so the move/combat/chase rules are unit-tested headless with `node test.js` — no DOM needed.

## Iterate from here

- "Add a field of view / fog of war so unexplored tiles are hidden"
- "Add items: a potion that heals and a scroll that hits every adjacent enemy"
- "Give enemies real A* pathfinding instead of greedy single-axis chase"
- "Add a second enemy type that flees at low hp"
