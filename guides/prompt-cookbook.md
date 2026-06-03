# Prompt Cookbook

Curated prompts that get good results from gd-skills. Copy one, fill the brackets,
edit to taste. The pattern that matters: **state the genre/system, the engine, and
the 2-3 details you actually care about** — vague prompts get generic games.

> These are starting points, not magic strings. The more specific the detail, the
> closer the first pass lands.

## Why specificity wins

```
Weak:   /create-platformer
Better: /create-platformer Celeste-like with wall-jump, dash, and coyote time, in Godot, 5 levels, one-hit death
```
The second names the feel (wall-jump/dash/coyote), the engine, the scope, and the
failure model. The generator has something to aim at.

## Full games

```
/create-game 2D platformer, collect coins, avoid patrol + flying enemies, Godot, 5 levels, 3 lives
/create-game Top-down roguelike like Hades, Defold, procedural rooms, permadeath, meta-upgrades between runs
/create-game Match-3 like Candy Crush, Web/Phaser, 8x8, 6 gems + 4 power-ups, moves-limited and time-attack modes
/create-game 4-player co-op horror like Phasmophobia, Unity, EMF/thermometer/spirit-box, ghost hunt phases, proximity voice
/create-game Tower defense like Bloons, Godot, 6 tower types, 20 waves, upgrade tree, one map
```

## Systems and components

```
/build-team combat system with light/heavy attacks, combos, and hitstop, in Godot
/create-enemy ranged archer that kites the player, retreats when close, telegraphs shots
/create-player twin-stick controller, Defold, dash with i-frames, aim with right stick or mouse
/create-menu main + pause + settings with rebindable controls and a colorblind toggle
/create-health shielded health (regen-after-delay shield over a flat HP pool), with damage numbers
```

## Engine-specific asks

```
/setup-defold top-down project, then a player.script using message passing and a collision object
/setup-godot 2D project with autoloads for GameState and AudioManager and an input map for move/jump/dash
"Implement the bullet pool from object-pooling guide in Defold using a factory"
"Port the Godot state machine in player-controllers to Unity with the same states"
```

## Debugging and polish

```
/debug-game enemies fall through the floor sometimes when many spawn at once
/debug-game multiplayer desyncs after ~2 minutes, positions drift on clients
/optimize-performance frame drops to 30fps when 200+ bullets are on screen
/add-game-feel make the jump and landing feel like Celeste — squash/stretch, dust, screen-shake on land
/validate-integration  (after assembling player + enemy + combat + save + UI)
/consistency-check      (after balancing stats across combat, loot, and economy)
```

## Iteration prompts (the real workflow)

Games are made in passes. Good follow-ups after a first generation:

```
"Add a double-jump and a wall-slide, keep everything else"
"The enemies are too aggressive — add a 0.5s reaction delay before they chase"
"Add a boss to level 5 with three phases that change attack patterns at 66% and 33% HP"
"Make coins worth 1 and a 100-coin pickup grant a life — update the entity registry"
"Add controller support and remappable keys to the settings menu"
```

## Tips

- **Name an inspiration** ("like Celeste", "Stardew-style") — it carries a lot of implicit detail.
- **State the engine early** so code is idiomatic from the first pass.
- **Say the scope** (levels, players, modes) so the generator doesn't over- or under-build.
- **Define the fail state** (lives / health bar / one-hit) — it shapes half the systems.
- **Iterate in small diffs** — "add X, keep the rest" beats regenerating from scratch.
- Use `/checkpoint` between sessions so a follow-up picks up where you left off.

## Related
- `guides/data-driven.md` — keep the numbers you mention in the entity registry.
- `guides/review-gates.md` — switch to `lean`/`full` when a prototype becomes a real project.
