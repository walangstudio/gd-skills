# Prompt

The prompt that produced this sample:

> /create-classic-game a tiny side-view platformer for the Web: move a square
> with the arrow keys across a 480x320 canvas, jump with Space or Up, land on
> platforms, and reach the goal to win, then restart with R. Vanilla JavaScript
> and canvas, no build step, no external assets — one index.html plus one
> game.js. Use a fixed-timestep loop, gravity, and AABB platform collision.

## Why it's shaped this way

- **Web + vanilla canvas** so it runs by opening `index.html` — no bundler, no CDN, no binary assets.
- **Named the scope** (480x320, jump to platforms, reach the goal, restart on R) so the result is bounded.
- **Named the patterns** (fixed timestep, gravity, AABB) so the loop, physics, and collision are correct, not frame-dependent.

Iterate from here with follow-ups like: "add a moving platform", "add spikes
that reset the run", "add a coyote-time window so jumps feel forgiving".
