# Prompt

The prompt that produced this sample:

> /create-classic-game a tiny top-down space shooter for the Web on a 480x320
> canvas: a ship at the bottom moves left/right with the arrow keys and fires
> bullets upward on Space (with a fire cooldown so holding doesn't spam every
> frame). Enemies spawn from the top and descend; a bullet hitting an enemy
> destroys both and scores a point. An enemy reaching the bottom or touching the
> ship costs a life — 3 lives. Reach 10 kills to win, lose at 0 lives, R to
> restart. Vanilla JavaScript and canvas, no build step, no external assets —
> index.html plus game.js plus a pure logic.js. Use a fixed-timestep loop, AABB
> collision, an injected RNG for spawns so the logic is deterministic and
> testable, and sub-step fast movers so bullets can't tunnel through enemies.

## Why it's shaped this way

- **Web + vanilla canvas** so it runs by opening `index.html` — no bundler, no CDN, no binary assets.
- **Named the scope** (10 kills, 3 lives, 480x320, restart on R) so the result is bounded.
- **Named the patterns** (fixed timestep, AABB, injected RNG, sub-stepping) so the loop, collision, determinism, and fast-mover correctness are right rather than accidental.
- **Pure `logic.js` with an injected `rng`** keeps all mechanics unit-testable headless — no `Math.random` in the tested path, so spawns and outcomes are reproducible.

## Iterate from here with follow-ups like:

- "Add enemies that shoot back"
- "Add waves that speed up every 10 kills"
- "Give the player a 3-shot spread power-up"
