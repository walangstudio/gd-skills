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

## Status

Godot and Defold samples land first (open, scriptable, fast to verify in-engine);
other engines follow. Each sample is verified to build/run in its engine before it
is added — a sample that hasn't been run in the engine is not committed here.

## Large assets

Binary assets (sprites, audio, models) use Git LFS — see `.gitattributes`. Keep
samples small; prefer primitives and a few placeholder assets over large art.
