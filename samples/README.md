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

- **`web/coin-collector`** — vanilla HTML5 canvas game (no build, no deps). Logic unit-tested via `node test.js`; open `index.html` to play.

Godot and Defold samples follow (open + scriptable, fast to verify in-editor);
Unity/Unreal after.

## Large assets

Binary assets (sprites, audio, models) use Git LFS — see `.gitattributes`. Keep
samples small; prefer primitives and a few placeholder assets over large art.
