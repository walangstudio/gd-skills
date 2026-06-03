# Defold Coding Style (Lua)

Defold scripts are plain Lua (5.1 + LuaJIT). This is **not** Luau — do NOT add `--!strict` or type annotations (that is the Roblox convention). Style below is Defold-idiomatic.

## The Model First

- Game objects are containers; components do the work; collections are scenes.
- Compose behaviour by attaching components and passing messages. **Never** use inheritance to share behaviour between game objects.
- Address things by URL (`"/path/object#component"`); store ids as hashes.

## Naming Conventions

```lua
-- snake_case for locals, functions, and self fields
local move_speed = 200
local function apply_damage(self, amount) end
self.current_health = 100

-- UPPER_SNAKE_CASE for module-level constants
local JUMP_VELOCITY = -400
local MAX_AMMO = 30

-- files: snake_case
player.script
enemy_patrol.script
game_controller.script

-- collections / go files: snake_case
main.collection
player.go
```

## Hash Your Message Ids and Urls

```lua
-- ✅ CORRECT — hash compared against hashed message_id
function on_message(self, message_id, message, sender)
	if message_id == hash("take_damage") then ... end
end

-- ✅ Precompute frequently-used hashes
local MSG_DAMAGE = hash("take_damage")

-- ❌ WRONG — comparing message_id to a raw string never matches
if message_id == "take_damage" then ... end
```

## Lifecycle Callbacks

Use the standard callbacks; keep each focused.

```lua
function init(self)    end   -- set up state, acquire input focus
function final(self)   end   -- release input focus, clean up
function update(self, dt) end -- per-frame logic (use dt, never assume 60fps)
function on_message(self, message_id, message, sender) end
function on_input(self, action_id, action) end
function on_reload(self) end  -- hot reload (optional)
```

- Only call `msg.post(".", "acquire_input_focus")` on objects that actually need input, and release it in `final`.
- Always multiply movement by `dt` in `update`.

## go.property for Data-Driven Objects

```lua
-- ✅ CORRECT — editable per-instance, no magic numbers
go.property("speed", 200)
go.property("max_health", 100)

function init(self)
	self.health = self.max_health
end

-- ❌ WRONG — hardcoded, not tunable in editor
function init(self)
	self.speed = 200
	self.health = 100
end
```

## Message Passing, Not Reaching In

```lua
-- ✅ CORRECT — ask the other object to act on itself
msg.post("/enemies/goblin#script", "take_damage", { amount = 25 })

-- ❌ WRONG — there is no shared mutable state to reach into in Defold;
--           do not try to read another object's `self`
```

## Factories Over Create/Delete Churn

```lua
-- ✅ Pool reusable instances (bullets, particles, enemies)
local id = table.remove(self.pool)
go.set_position(spawn_pos, id)
msg.post(id, "enable")

-- ❌ Creating and deleting every frame fragments memory
local id = factory.create("#bulletfactory", spawn_pos)  -- then go.delete soon after
```

## Modules for Shared Code

```lua
-- ✅ CORRECT — return a table from a module, require it
local M = {}
function M.lerp(a, b, t) return a + (b - a) * t end
return M

-- ❌ WRONG — globals leak across all scripts
function lerp(a, b, t) return a + (b - a) * t end  -- no `local`, pollutes _G
```

## Code Quality Checklist

Before submitting Defold code, verify:

- [ ] Scripts are plain Lua — no `--!strict`, no Luau type annotations
- [ ] Every `message_id` comparison uses `hash("...")`, not a raw string
- [ ] No game object inherits from another — behaviour is composed via components/messages
- [ ] Movement and timers use `dt`, never hardcoded frame assumptions
- [ ] Tunable values use `go.property`, not magic numbers
- [ ] Input focus is acquired only where needed and released in `final`
- [ ] Frequently spawned objects are pooled via a factory, not create/delete'd
- [ ] Shared code lives in `require`'d modules that return a table; no globals
- [ ] String ids stored as `hash(...)` and urls via `msg.url(...)`
- [ ] One responsibility per script; long scripts split into modules

## Common Anti-Patterns to Avoid

### ❌ WRONG: Luau-style typing in Defold
```lua
--!strict
local health: number = 100   -- this is Roblox, not Defold
```
### ✅ CORRECT: Plain Lua
```lua
local health = 100
```

### ❌ WRONG: Comparing message_id to a string
```lua
if message_id == "jump" then end   -- never true; message_id is a hash
```
### ✅ CORRECT: Hash both sides
```lua
if message_id == hash("jump") then end
```

### ❌ WRONG: Synchronous assumption after msg.post
```lua
msg.post("#script", "get_score")
local s = self.score   -- messages are delivered NEXT frame; s is stale
```
### ✅ CORRECT: Reply via a message
```lua
-- requester sends "get_score"; owner replies msg.post(sender, "score", {value=s})
```

### ❌ WRONG: Polling another object's transform every frame for "collision"
```lua
if vmath.length(go.get_position("/enemy") - go.get_position()) < 16 then end
```
### ✅ CORRECT: Use a collision object and react to `collision_response`

## Performance Guidelines

- Pool frequently-spawned objects with factories.
- Precompute hashes once (module-level locals) instead of calling `hash()` in hot loops.
- Keep `update` light; prefer event-driven `on_message` over per-frame polling.
- Use collision groups/masks to limit physics checks.
- Cache `require`'d modules at file scope, not inside callbacks.

---

**Remember**: plain Lua (no Luau types), hash every message id, compose with components and messages (never inherit or reach in), make objects data-driven with `go.property`, and pool with factories.
