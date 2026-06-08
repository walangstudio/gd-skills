# Prompt

The prompt that produced this sample:

> /create-classic-game an ASTEROIDS clone for the Web on a 640x480 canvas:
> a vector ship that rotates with Left/Right, thrusts along its heading with Up,
> and fires bullets with Space. Everything screen-wraps (modulo on all edges).
> Bullets expire after a short lifetime. Asteroids drift; shooting a large one
> splits it into two smaller ones, a small one is destroyed; clearing them all
> wins. Hitting an asteroid costs a life; zero lives loses. Vanilla JavaScript
> and canvas, no build step, no assets — split pure logic into a Node-testable
> logic.js. Use a fixed-timestep loop, modulo wrap, circle-circle collision with
> squared distance, sub-stepped integration so fast bullets don't tunnel, and an
> injected rng (no Math.random in the logic).

## Why it's shaped this way

- **Web + vanilla canvas** so it runs by opening `index.html` — no bundler, no CDN, no binary assets.
- **Named the scope** (640x480, split/destroy rules, lives, win/lose) so the result is bounded.
- **Named the correctness traps** (modulo wrap not subtract, sub-stepped anti-tunnel, squared-distance hit, injected rng) so the logic is right and deterministic, not just "looks like Asteroids".
- **Logic split from rendering** so the mechanics are unit-testable headless in Node.

Iterate from here with follow-ups like: "add a hyperspace teleport on Shift",
"give asteroids three size tiers", "add a UFO that shoots back".
