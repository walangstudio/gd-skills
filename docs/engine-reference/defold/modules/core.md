# Defold 1.9+ — Core Reference

> Pinned to Defold 1.9+. Verify anything newer against https://defold.com/manuals/ and https://defold.com/ref/stable/.

## Core types & entry points
- Hierarchy: **collection** contains **game objects**, each game object contains **components** (sprite, script, sound, collision object, etc.).
- `go.*` — game object API: `go.get_position`, `go.set_position`, `go.get`, `go.set`, `go.animate`, `go.delete`.
- URLs identify things: `"#component"`, `"game_object#component"`, `"collection:/path#component"`; build with `msg.url()`.
- `hash()` — string hashing; ids/properties compare as hashes internally.
- `go.property(name, default)` — declares a script property (settable in the editor / from spawn).
- `factory.create(url, position, rotation, properties)` spawns objects at runtime.

## Common tasks
Script properties + lifecycle:
```lua
go.property("speed", 200)

function init(self)
    self.pos = go.get_position()
end

function update(self, dt)
    self.pos.x = self.pos.x + self.speed * dt
    go.set_position(self.pos)
end
```

Address a component on another object via URL:
```lua
local target = msg.url("enemy")        -- "enemy" game object in this collection
msg.post(target, "take_damage", { amount = 10 })

local sprite = msg.url(nil, ".", "sprite")  -- the sprite on this object
```

Spawn with a factory:
```lua
function on_input(self, action_id, action)
    if action_id == hash("fire") and action.pressed then
        factory.create("#bullet_factory", go.get_position())
    end
end
```

## Gotchas
- It's plain **Lua 5.1** (+ LuaJIT) — NOT Luau. No `--!strict`, no `continue`, no `+=`/compound assignment, no integer division `//`.
- `go.set_position` takes a `vmath.vector3`; mutate a copy, don't expect `go.get_position()` to return a live reference.
- URLs are resolved relative to the calling script's game object unless fully qualified.
- Ids are hashes — `hash("foo") == hash("foo")` but printing a hash shows `hash: [foo]`, compare with `hash()` not raw strings.
- Each script instance is the `self` table; don't store cross-object state in module-level locals (shared across all instances).

## See also
- `defold-patterns` skill, `defold-style` rule, `defold-specialist` agent
- guides/ for cross-engine architecture patterns
