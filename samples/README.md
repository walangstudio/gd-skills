# Samples

Complete, runnable game projects per engine, used two ways:

1. **Copy-paste starting points** — open one in its engine and build on it.
2. **Few-shot exemplars** — each carries the prompt that generated it, so the agent can learn the target style.

## Layout

```
samples/<engine>/<name>/
├── <project files>      # a real, runnable project for that engine
├── PROMPT.md            # the exact prompt that produced this sample
└── NOTES.md             # iteration history + what to copy / watch out for
```

`<engine>` is one of: `godot`, `unity`, `unreal`, `roblox`, `defold`, `web`.

## Verification policy

Every sample's **testable logic is unit-tested headless** (the logic is split from
rendering so it runs without an engine — see the web sample's `test.js`). Runtime
and visual behavior is **verified in-engine where the engine is available**, and
each `NOTES.md` states exactly what was and wasn't verified. A sample never claims
to run if its run wasn't checked.

## Available

All three are dependency-free HTML5 canvas games (no build, no deps). Each splits
pure `logic.js` from `game.js` so the mechanics are unit-tested with `node test.js`.
Open any `index.html` to play.

- **`web/coin-collector`** — move, collect 5 coins, win. Fixed timestep, AABB-vs-circle. (8 test groups)
- **`web/snake`** — grid movement, grow on eat, wall/self collision. Discrete-tick loop, injected RNG. (7 test groups)
- **`web/breakout`** — paddle + ball, brick reflection, lives/win/lose. Sub-stepped ball (no tunneling). (13 test groups)
- **`web/platformer`** — gravity, jump (grounded-only, no double-jump), AABB platform collision, reach the goal. Sub-stepped fall (no tunneling). (10 test groups)
- **`web/tower-defense`** — waypoint enemy pathing, click-to-place towers, furthest-along targeting, gold/lives/waves. (9 test groups)
- **`web/match3`** — swap-or-revert, run-scan match detection, gravity + RNG-injected refill, cascades. (8 test groups)

Every sample's `test.js` runs in CI (`scripts/test-samples.sh`), so the logic can't
silently regress. Godot and Defold samples follow (open + scriptable, fast to
verify in-editor); Unity/Unreal after.

## Large assets

Binary assets (sprites, audio, models) use Git LFS — see `.gitattributes`. Keep
samples small; prefer primitives and a few placeholder assets over large art.
