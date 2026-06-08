# Prompt

The prompt that produced this sample:

> /create-classic-game a tiny Snake game for the Web: steer a snake on a grid
> with the arrow keys around a 480x320 canvas, eat food to grow and score, die
> on wall or self collision, then restart with R. Vanilla JavaScript and canvas,
> no build step, no external assets — one index.html plus one game.js. Use a
> fixed tick for discrete moves and keep the grid logic pure so it can be tested.

## Why it's shaped this way

- **Web + vanilla canvas** so it runs by opening `index.html` — no bundler, no CDN, no binary assets.
- **Named the scope** (grid snake, 480x320, grow on food, die on collision, restart on R) so the result is bounded.
- **Named the patterns** (fixed tick for discrete moves, pure grid logic, injected rng for deterministic tests) so the move cadence and food placement are correct and testable.

Iterate from here with follow-ups like: "add a wrap-around mode instead of wall
death", "add a speed-up every 5 points", "add a second food worth 3 points".
