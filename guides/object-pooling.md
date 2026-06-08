# Object Pooling

> Reuse a fixed set of pre-allocated objects instead of creating and destroying them at runtime, to avoid allocation churn and GC stalls.

## What it is
A pool holds a stash of inactive objects. Instead of `new`/`destroy`, you `acquire` one (activate, reset), use it, then `release` it back (deactivate) for reuse. This eliminates per-spawn allocation and the garbage-collection or destructor stalls that cause frame hitches when spawning many short-lived objects.

## When to use it
- High-churn objects: bullets, particles, projectiles, hit effects, damage numbers, frequently respawned enemies.
- Garbage-collected runtimes (C#, Lua, Luau, JS) where alloc spikes trigger GC pauses.
- Tight memory budgets / mobile / console where instantiation cost is measurable.
- Anything you spawn dozens-plus times per second.

## When NOT to use it
- Low-frequency spawns (a few objects per level). Pooling adds state and bugs for no measurable win — just instantiate.
- Before profiling. Pooling is an optimization; premature pooling complicates code and hides bugs. Confirm alloc/GC is actually your hitch first.
- Objects with heavy per-instance reset cost where re-init approaches construction cost anyway.

## Per-engine mapping
| Engine | How this pattern is expressed |
|--------|-------------------------------|
| Godot | Pre-instantiate from a `PackedScene`, keep a free list; on release hide + `set_process(false)` (or `remove_child`) instead of `queue_free()`. |
| Unity | Built-in `UnityEngine.Pool.ObjectPool<T>` (Unity 2021+), or hand-rolled list of `SetActive(false)` GameObjects. Reuse, don't `Destroy`. |
| Unreal | No universal first-party pool; pool Actors manually (deactivate + `SetActorHiddenInGame`/`SetActorTickEnabled`) or use object/struct pools. Niagara pools its own particles. |
| Roblox | Keep a folder of inactive Instances; reparent into/out of workspace and toggle properties rather than `:Destroy()`/`Instance.new` per spawn. |
| Defold | **Factory-based**: `factory.create()` is cheap, but pre-create a buffer and recycle by moving off-screen + disabling, or use `collectionfactory` for grouped reuse. Factories are the spawn primitive. |
| Web | Plain array free list of objects; reset fields and reuse. Phaser has `Group` with `createMultiple`/`getFirstDead` for built-in pooling. |

## Minimal example
Defold — factory-backed pool (factories are the canonical Defold spawn path):
```lua
function init(self)
    self.pool = {}
    for _ = 1, 64 do
        local id = factory.create("#bullet_factory")
        msg.post(id, "disable")           -- park it
        table.insert(self.pool, id)
    end
end

local function acquire(self, pos)
    local id = table.remove(self.pool)
    if not id then id = factory.create("#bullet_factory") end
    go.set_position(pos, id)
    msg.post(id, "enable")
    return id
end
-- release: msg.post(id,"disable"); table.insert(self.pool, id)
```

## Pitfalls
- **Dirty state on reuse**: forgetting to fully reset velocity, timers, parent, visibility — the object "remembers" its last life. Reset everything on acquire.
- **Pool exhaustion**: running out and either failing silently or falling back to allocation defeats the purpose. Size the pool, or grow deliberately.
- **Dangling references**: code holding a reference to a released object that's now reused as something else. Use generation handles or null on release.
- **Leaks via never-released objects**: an object that's never put back shrinks the pool permanently.
- In Defold, `factory.create` for the recycled object still costs a message round-trip to enable/disable — keep that off the hot path.

## Related
- `defold-patterns`, `unity-patterns`, `godot-patterns`
- `combat-systems`, `enemy-ai-patterns`
- `guides/game-loop-timestep.md`, `guides/ecs-vs-component.md`
