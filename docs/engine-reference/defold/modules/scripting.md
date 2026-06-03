# Defold 1.9+ — Scripting Reference

> Pinned to Defold 1.9+. Verify anything newer against https://defold.com/manuals/ and https://defold.com/ref/stable/.

## Core types & entry points
- Plain **Lua 5.1** (LuaJIT runtime). No Luau features.
- Script lifecycle callbacks: `init(self)`, `final(self)`, `update(self, dt)`, `fixed_update(self, dt)`, `on_message(self, message_id, message, sender)`, `on_input(self, action_id, action)`, `on_reload(self)`.
- Message passing is the core communication model: `msg.post(receiver_url, message_id, message_table)`.
- `require("module")` for shared Lua modules (return a table).
- `self` is the per-instance state table.

## Common tasks
Message passing between objects:
```lua
-- sender.script
msg.post("/enemy#script", "take_damage", { amount = 25 })

-- enemy/script.script
function on_message(self, message_id, message, sender)
    if message_id == hash("take_damage") then
        self.hp = self.hp - message.amount
        if self.hp <= 0 then
            go.delete()
        end
    end
end
```

Handle input (input bindings map actions in `game.input_binding`):
```lua
function init(self)
    msg.post(".", "acquire_input_focus")
end

function on_input(self, action_id, action)
    if action_id == hash("jump") and action.pressed then
        self.vel_y = 600
    end
end
```

A shared module:
```lua
-- utils.lua
local M = {}
function M.clamp(v, lo, hi) return math.max(lo, math.min(hi, v)) end
return M

-- in a script
local utils = require("main.utils")
local x = utils.clamp(value, 0, 100)
```

## Gotchas
- Lua 5.1 only: no `goto`/labels-as-continue patterns from 5.2, no bitwise operators (use the `bit` library / LuaJIT `bit`), no `//`.
- Must `msg.post(".", "acquire_input_focus")` before `on_input` fires for that object.
- `message_id` and `action_id` are hashes — compare with `hash("...")`, not string literals.
- Module-level locals are shared across every instance of that script; per-instance state goes in `self`.
- `update` runs every frame; `fixed_update` runs at the fixed physics step (use it for physics-coupled logic).

## See also
- `defold-patterns` skill, `defold-style` rule, `defold-specialist` agent
- guides/ for cross-engine architecture patterns
