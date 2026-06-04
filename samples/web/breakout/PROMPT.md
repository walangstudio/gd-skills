# Prompt

The prompt that produced this sample:

> /create-classic-game a tiny Breakout for the Web: a paddle at the bottom of a
> 480x320 canvas, a ball that bounces off the walls, ceiling, and paddle, and a
> grid of bricks that break on contact. Move the paddle with the mouse or the
> Left/Right arrows. Score one point per brick, lose a life when the ball drops
> past the bottom, clear every brick to win, and restart with R. Vanilla
> JavaScript and canvas, no build step, no external assets — one index.html plus
> one game.js. Use a fixed-timestep loop and AABB reflection collision.

## Why it's shaped this way

- **Web + vanilla canvas** so it runs by opening `index.html` — no bundler, no CDN, no binary assets.
- **Named the scope** (paddle, ball, brick grid, lives, 480x320, restart on R) so the result is bounded.
- **Named the patterns** (fixed timestep, AABB reflection) so the loop and bounce physics are correct, not frame-dependent.

Iterate from here with follow-ups like: "add multiple brick rows worth different
points", "add a power-up that widens the paddle", "speed the ball up as bricks
clear".
