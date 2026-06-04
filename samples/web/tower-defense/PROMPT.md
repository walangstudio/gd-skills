# Prompt

The prompt that produced this sample:

> /create-tower-defense a small web tower defense: enemies walk a fixed waypoint
> path, click to place towers that shoot the furthest-along enemy in range, earn
> gold per kill, lose a life when an enemy leaks, clear all waves to win. Vanilla
> JavaScript + canvas, no build step, no assets. One index.html, logic.js, game.js.

## Why it's shaped this way

- **Waypoint path** (a list of points) keeps enemy movement simple and deterministic — no navmesh needed.
- **Schedule-driven spawning** (an interval per wave, not random) so the logic is fully testable headless.
- **Target the furthest-progressed enemy in range** — the standard TD targeting that feels right and is easy to assert.

Iterate from here: "add a second tower type with splash damage", "add a slow
tower", "show a tower-cost UI and let me sell towers".
