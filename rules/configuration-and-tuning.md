# Configuration & Tuning

No magic numbers. Every value a designer or player might want to change — movement speed,
jump height, gravity, health, damage, cooldowns, fire rate, spawn counts/rates, costs, drop
rates, sizes, ranges, timers, colors, level/wave data — MUST live in one discoverable, editable
place, expressed the engine's idiomatic way. It must NEVER be a bare literal buried inside
gameplay logic where a non-engineer can't find it.

The test: *"to rebalance this game or reskin a level, do I edit data / exported properties in one
obvious spot, or hunt through function bodies?"* If it's the latter, it's wrong.

## Rules

- **Tunables are exported / serialized properties or config data** — grouped, named, with sane
  defaults — not literals inside `if`/loops/`_process`/`update`.
- **One tuning surface per system** (a config resource/asset/module), and ideally a single
  game-wide balance/config the rest reads from. Centralize; don't scatter the same knob.
- **Repeated or related constants get a named home** (a constants module / config table) even
  when not designer-facing, so there's exactly one place to change them.
- **Content = data**: enemies, items, weapons, levels that differ only by values live in data
  the engine loads (`guides/data-driven.md`) — "add an enemy" should be "add a row", not "write
  a class".
- **Genuinely one-off, single-use values** may stay as a *named* local constant (clearer than an
  external asset). A named constant is fine; a bare literal in logic is not.
- **Validate config on load** — bad data (negative HP, missing id) fails loud at boot, not deep
  in gameplay.

## Where it goes (engine-idiomatic)

| Engine | Per-instance tunable | Bulk / shared config |
|--------|----------------------|----------------------|
| Godot  | `@export var speed := 200.0` (inspector-editable) | custom `Resource` (`.tres`), `preload`ed |
| Unity  | `[SerializeField] float speed = 5f;` | **ScriptableObject** asset |
| Unreal | `UPROPERTY(EditAnywhere, Category="Tuning")` | **DataAsset** / **DataTable** (CSV/JSON) |
| Roblox | instance **Attributes** (`:SetAttribute`) | config **ModuleScript** returning a table |
| Defold | `go.property("speed", 200)` (editor/factory-settable) | a `config` Lua module / `.json` resource |
| Web    | a `config.js` object / `config.json` | one JSON/JS config module loaded at boot |

## Anti-patterns

- ❌ `if health < 30:` · `velocity.x = 200` · `wait(2.5)` · `damage = 7` inline in logic.
- ✅ `if health < cfg.low_health:` · `velocity.x = speed` (exported) · `wait(cfg.hunt_delay)` · `damage = weapon.def.damage`.
- ❌ The same constant copy-pasted across files. ✅ One named source the others read.
- ❌ Level layout / wave composition hardcoded in a script. ✅ Level/wave data in an editable asset.

See `guides/data-driven.md` for the full pattern and per-engine data containers.
