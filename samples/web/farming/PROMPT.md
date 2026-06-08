# Prompt

The prompt that produced this sample:

> /create-classic-game a tiny tile-farming slice for the Web: a grid of plots
> you till, plant, water, and harvest. Crops grow one stage per day but only if
> they were watered that day; ripe crops harvest for gold; sell to hit a gold
> goal to win. Vanilla JavaScript and canvas, no build step, no external assets —
> one index.html plus a pure logic.js and a render-only game.js. Put the whole
> plot state machine in logic.js and unit-test it headless.

## Why it's shaped this way

- **Web + vanilla canvas** so it runs by opening `index.html` — no bundler, no CDN, no binary assets.
- **Named the scope** (grid, till/plant/water/harvest, gold goal) so the result is bounded.
- **Named the patterns** (plot state machine, watering-gated daily growth) so the
  correctness rules are explicit, not accidental.
- **Logic split from rendering** so the entire state machine is unit-tested without a DOM.

Iterate from here with follow-ups like: "add seasons that restrict which crops
grow", "add a market with fluctuating prices", "add weeds that spread to
neighboring untilled plots".
