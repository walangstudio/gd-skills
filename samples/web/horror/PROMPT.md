# Prompt

The prompt that produced this sample:

> /create-classic-game a top-down stealth-horror slice for the Web on a 480x320
> canvas: move a square with the arrow keys, collect both keys, then reach the
> exit at the top to escape. A guard patrols a set route and has a vision cone
> (facing, half-angle, range) — if it holds you in view past a short grace period
> you're caught. A flashlight battery drains over time, faster when the light is
> on, and low battery shrinks your view. Vanilla JavaScript and canvas, no build
> step, no external assets — one index.html, pure logic.js, game.js for render.
> Fixed-timestep loop; keep all mechanics pure and unit-tested.

## Why it's shaped this way

- **Web + vanilla canvas** so it runs by opening `index.html` — no bundler, no CDN, no binary assets.
- **Named the scope** (2 keys, exit, one patrolling guard, 480x320) so the result is bounded.
- **Named the patterns** (vision cone with normalized angle difference, fixed timestep, pure logic split) so the math and the loop are correct, not approximated.
- **Resource pressure** (flashlight battery) gives the stealth a cost without extra UI.

Iterate from here with follow-ups like: "add a second guard", "make noise draw the
guard toward you", "add doors that need a specific key", "alert state that speeds
the guard up after it spots you".
