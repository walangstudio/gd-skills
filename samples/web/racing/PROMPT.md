# Prompt

The prompt that produced this sample:

> /create-classic-game a top-down lap racer for the Web: drive a car around a
> 640x480 canvas with the arrow keys (up = throttle, down = brake/reverse,
> left/right = steer), passing ordered checkpoints in sequence to complete a lap,
> 3 laps to win, restart with R. Vanilla JavaScript and canvas, no build step,
> no external assets — one index.html plus one game.js. Use a fixed-timestep
> loop, speed-dependent steering, and sub-stepped integration so a fast car
> can't tunnel past a checkpoint.

## Why it's shaped this way

- **Web + vanilla canvas** so it runs by opening `index.html` — no bundler, no CDN, no binary assets.
- **Named the scope** (3 laps, ordered checkpoints, 640x480, restart on R) so the result is bounded.
- **Named the hard patterns** (fixed timestep, speed-scaled steering, sub-stepped anti-tunnel) so the genuinely bug-prone parts are correct, not hand-waved.
- **Ordered checkpoints** make "a lap" unambiguous and force the order/wrap logic that distinguishes a real lap racer from "drive through any circle".

Iterate from here with follow-ups like: "add a wall the car collides with",
"add a best-lap time", "add a second AI car", "make the track surface slow the
car off-road".
