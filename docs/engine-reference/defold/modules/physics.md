# Defold 1.9+ — Physics Reference

> Pinned to Defold 1.9+. Verify anything newer against https://defold.com/manuals/ and https://defold.com/ref/stable/.

## Core types & entry points
- **Collision object** component (Box2D under the hood). Types: `dynamic`, `kinematic`, `static`, `trigger`.
- Collision groups + masks: a collision object has a **group** and a list of groups it **collides with** (mask).
- Collision shapes attached to the collision object (box, sphere, capsule, or from a tilemap/convex hull).
- Messages sent to the script on contact: `"collision_response"`, `"contact_point_response"`, `"trigger_response"`.
- `physics.*` API: `physics.raycast`, `physics.set_gravity`, `physics.create_joint`, `physics.set_group`/`get_group`.

## Common tasks
React to collisions:
```lua
function on_message(self, message_id, message, sender)
    if message_id == hash("collision_response") then
        if message.other_group == hash("enemy") then
            -- 'message.other_id' is the other game object
        end
    elseif message_id == hash("trigger_response") then
        if message.enter then
            -- entered the trigger
        else
            -- left the trigger
        end
    end
end
```

Resolve overlap precisely with contact points (kinematic bodies):
```lua
function on_message(self, message_id, message, sender)
    if message_id == hash("contact_point_response") then
        local correction = message.normal * message.distance
        local p = go.get_position()
        go.set_position(p + correction)
    end
end
```

Raycast:
```lua
local from = go.get_position()
local to = from + vmath.vector3(100, 0, 0)
local result = physics.raycast(from, to, { hash("enemy"), hash("wall") })
if result then
    print(result.id, result.position)
end
```

## Gotchas
- `dynamic` bodies are driven entirely by the simulation — don't `go.set_position` them; use forces (`apply_force`) or velocity.
- `kinematic` bodies you move yourself; you must handle `contact_point_response` to stop clipping into things.
- `collision_response` is a coarse "we touched"; `contact_point_response` gives normal + penetration for manual resolution.
- Triggers fire `trigger_response` (with `message.enter` true/false), NOT `collision_response`.
- Group/mask must be mutual: A collides with B only if A's mask includes B's group AND B's mask includes A's group.
- **File format:** author the collision object as its own `.collisionobject` file and reference it from the `.go` via `components { id: "collisionobject" component: "/p/p.collisionobject" }`. Do NOT hand-write an `embedded_components` collision object — its `data:` must be an escaped, line-by-line quoted protobuf string, and any slip yields *"Invalid embedded component 'collisionobject'"*. `mass` must be > 0 for `COLLISION_OBJECT_TYPE_DYNAMIC`, 0 for kinematic/static. See the `defold-patterns` skill "Scene & Component File Formats" for the exact text.

## See also
- `defold-patterns` skill, `defold-style` rule, `defold-specialist` agent
- guides/ for cross-engine architecture patterns
