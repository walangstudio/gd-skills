# Prompt

The prompt that produced this sample:

> /create-classic-game a top-down survival slice for the Web on a 480x320 canvas:
> move a square with the arrow keys, gather wood and food from resource nodes,
> manage health/hunger/energy stats, craft a campfire, and survive a day-night
> cycle to day 3. Vanilla JavaScript and canvas, no build step, no external
> assets — one index.html plus one game.js, with the mechanics split into a pure,
> unit-tested logic.js. Use a fixed-timestep loop, clamp every stat to [0,100],
> couple starvation to health only at hunger 0, and make crafting atomic.

## Why it's shaped this way

- **Web + vanilla canvas** so it runs by opening `index.html` — no bundler, no CDN, no binary assets.
- **Named the scope** (3 stats, wood/food nodes, campfire recipe, survive to day 3) so the result is bounded.
- **Named the correctness rules** (stat clamping, hunger→health boundary, atomic craft, gather-once, one day per cycle) so the simulation is right, not just running.
- **Pure logic split out** so every rule above is unit-tested headless in `test.js`.

Iterate from here with follow-ups like: "add enemies that spawn at night",
"add a thirst stat with water nodes", "make energy gate movement speed".
