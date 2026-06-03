---
description: Set up a new Defold project with proper structure, bootstrap collection, input bindings, shared modules, and game.project config. Quick-start for any Defold game.
---

# Setup Defold Command

## What This Command Does

Creates a properly structured Defold project:
- ✅ Folder structure (main, objects, scripts, gui, assets)
- ✅ Bootstrap collection wired in `game.project`
- ✅ Input bindings (`input/game.input_binding`) with common actions
- ✅ Shared Lua modules (game_state, math_utils)
- ✅ A top-level controller script
- ✅ `.gitignore` for Defold (build artifacts)
- ✅ Collision groups/masks convention

## Folder Structure Created

```
mygame/
├── game.project              # engine config; bootstrap = main/main.collection
├── input/
│   └── game.input_binding    # move_left, move_right, jump, fire, pause
├── main/
│   ├── main.collection       # bootstrap scene
│   └── main.script           # top-level controller (scene flow)
├── objects/
│   ├── player.go
│   ├── player.script
│   ├── enemy.go
│   └── enemy.script
├── scripts/
│   ├── game_state.lua        # shared state module
│   └── math_utils.lua        # helpers (clamp, lerp, approach)
├── gui/
│   ├── hud.gui
│   └── hud.gui_script
├── assets/
│   ├── atlases/
│   ├── sounds/
│   ├── fonts/
│   └── tilesources/
└── .gitignore                # /build, /.internal
```

## Conventions Applied

- Plain Lua (not Luau) — no `--!strict`, no type annotations
- Message passing between objects; `hash()` on every message id
- `go.property` for tunable, per-instance values
- Factories + pooling for bullets/particles/enemies
- Collision groups: `player`, `enemy`, `pickup`, `environment`, `projectile`

## Usage

```
User: /setup-defold

Agent: Setting up Defold project! What kind?
→ 2D Platformer
→ Top-down
→ Arcade / single-screen

[Creating project...]

✅ Defold project ready! Open the folder in the Defold editor and press Build.
```

---

**Set up your Defold project!** Run `/setup-defold` to get started. See the `defold-patterns` skill, `defold-style` rule, and `defold-specialist` agent for implementation.
