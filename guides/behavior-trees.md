# Behavior Trees

> A hierarchical AI structure of composable nodes (sequence, selector, decorator, leaf) that's easier to extend and reuse than a flat state machine for complex agents.

## What it is
A tree evaluated top-down each tick. **Leaf** nodes do work (move, attack, check condition) and return success/failure/running. **Composites** combine children: a **sequence** runs children in order until one fails (AND-like); a **selector** tries children until one succeeds (OR-like, fallback logic). **Decorators** wrap a child to modify it (invert, repeat, cooldown, gate on a condition). Behavior trees scale to complex, reactive AI better than FSMs because behaviors are reusable subtrees and priorities are expressed by structure, not a tangle of transitions.

## When to use it
- Complex agents with many prioritized behaviors and frequent interrupts (combat AI, companions, bosses).
- AI you want designers to author/tweak in a visual graph.
- Reusing behavior fragments (a "flee if low HP" subtree) across many enemy types.
- When an FSM's transition count has exploded into spaghetti.

## When NOT to use it
- Trivial AI (patrol + chase + attack). A 3-4 state FSM (`guides/state-machines.md`) is simpler, faster, and clearer. Don't reach for a BT by default.
- A single linear behavior — that's a coroutine/script, not a tree.
- When you have no BT tooling and the agent is simple — hand-rolling a tree to do an FSM's job is over-engineering.
- Hard real-time deterministic lockstep without care — tree evaluation order and `running` state need deterministic handling.

## Per-engine mapping
| Engine | Behavior-tree option (honest about first-party vs community) |
|--------|--------------------------------------------------------------|
| Godot | **No built-in BT.** Community addons: **LimboAI** (BT + HFSM, C++ GDExtension) and **Beehave** (GDScript). Pick one; don't hand-roll. |
| Unity | **No classic built-in BT historically**; Unity's **Behavior** package (formerly Muse Behavior) now ships a first-party graph. Community/asset-store: Behavior Designer, NodeCanvas. |
| Unreal | **First-party Behavior Trees** + Blackboard, native and mature; the canonical engine for BT AI here. (EQS pairs with it for spatial queries.) |
| Roblox | **No built-in BT.** Implement with ModuleScripts (node classes returning success/failure/running) or a community BT library. |
| Defold | **No built-in BT** (and no built-in navmesh). Community Lua BT libs exist; otherwise build leaf/composite nodes yourself in Lua. |
| Web | No engine built-in; JS BT libraries (e.g. behaviortree.js) or roll your own node objects. |

## Minimal example
Unreal is the natural fit (first-party), but here's the engine-agnostic core — a selector of sequences (pseudo, GDScript-ish):
```gdscript
# Selector: try each child until one succeeds (priority fallback)
#   ├─ Sequence: [is_low_hp?] -> [flee]
#   ├─ Sequence: [sees_player?] -> [chase] -> [in_range?] -> [attack]
#   └─ [patrol]                       # default fallback
func tick() -> int:                    # SUCCESS / FAILURE / RUNNING
    for child in children:
        var r := child.tick()
        if r != FAILURE: return r      # selector stops on first non-failure
    return FAILURE
```

## Pitfalls
- **Reinventing an FSM as a BT**: if there are no shared subtrees or priorities, you added ceremony for nothing.
- **`running` mismanagement**: a leaf must report `running` across ticks and resume correctly, or actions restart every frame. Most BT bugs live here.
- **Stateless assumption**: BTs re-evaluate from the root each tick; long actions need explicit running/abort handling, not hidden state.
- **Per-tick cost**: deep trees ticked every frame for many agents add up — throttle tick rate or use event-driven decorators.
- **Claiming a built-in that isn't there**: only Unreal (and now Unity's Behavior package) ship first-party BTs here; Godot/Roblox/Defold/Web rely on addons or hand-rolling. Defold has no navmesh either — pair BTs with a community/AStar pathing solution.

## Related
- `enemy-ai-patterns`, `combat-systems`
- `unreal-patterns`, `godot-patterns`, `unity-patterns`, `defold-patterns`, `roblox-patterns`
- `guides/state-machines.md`, `guides/data-driven.md`, `guides/game-loop-timestep.md`
