---
description: Activates Defold engine development mode. Sets context for Lua scripting, the component/collection/GameObject model, message passing, factories, and Box2D physics.
---

# Defold Development Mode

You are now working in **Defold 1.9+** mode.

## Language & Framework
- **Language**: Lua (5.1 + LuaJIT) — plain Lua, NOT Luau (no `--!strict`, no type annotations)
- **Engine**: Defold 1.9+ (2D-first, embedded Box2D)
- **Model**: game objects (containers) hold components; collections are scenes
- **Communication**: asynchronous message passing (`msg.post` / `on_message`)

## Conventions
- Compose behaviour with components and messages — never inherit between game objects
- Address objects by URL (`"/level/player#script"`); store ids as `hash(...)`
- Compare every `message_id` against `hash("...")`, never a raw string
- Make objects data-driven with `go.property(...)`
- Pool frequently-spawned objects with factories instead of create/delete
- Use `dt` for all per-frame movement and timers

## File Structure
```
mygame/
├── game.project              (engine config + bootstrap collection)
├── input/game.input_binding  (action name -> input)
├── main/                     (.collection + .script bootstrap)
├── objects/                  (.go + .script per entity)
├── scripts/                  (shared .lua modules, require'd)
├── gui/                      (.gui + .gui_script)
└── assets/                   (atlases, sounds, fonts, tilesources)
```

## Key Patterns
- `init(self)` → setup; `final(self)` → cleanup
- `update(self, dt)` → per-frame logic
- `on_message(self, message_id, message, sender)` → react to messages
- `on_input(self, action_id, action)` → input (after `acquire_input_focus`)
- `factory.create(...)` → spawn/pool objects
- collection proxy → swap scenes (menu ↔ gameplay)
- collision object component → Box2D physics + `collision_response`/`contact_point_response`

## Version Reference
- Consult `docs/engine-reference/defold/VERSION.md` and `docs/engine-reference/defold/modules/<domain>.md` before emitting APIs; do not use anything newer than the pinned version.

## Use These Skills
- `defold-patterns` for engine-specific patterns
- `defold-style` rule for coding standards
- `defold-specialist` agent for complex issues
