# Prompt

The prompt that produced this sample:

> /create-classic-game a tiny arcade game for the Web: move a square with the
> arrow keys around a 480x320 canvas and collect 5 coins to win, then restart
> with R. Vanilla JavaScript and canvas, no build step, no external assets —
> one index.html plus one game.js. Use a fixed-timestep loop and AABB collision.

## Why it's shaped this way

- **Web + vanilla canvas** so it runs by opening `index.html` — no bundler, no CDN, no binary assets.
- **Named the scope** (5 coins, 480x320, restart on R) so the result is bounded.
- **Named the patterns** (fixed timestep, AABB) so the loop and collision are correct, not frame-dependent.

Iterate from here with follow-ups like: "add an enemy that chases the player",
"add a 30-second timer", "make coins worth different points".
