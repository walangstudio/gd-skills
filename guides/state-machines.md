# State Machines (FSM)

> A finite set of named states with explicit transitions, so an entity is always in exactly one well-defined state and you never juggle a pile of overlapping bools.

## What it is
An FSM models behavior as discrete states (idle, walk, attack, dead) plus rules for moving between them. At any moment the entity is in one state; only that state's logic runs. Two common implementations: **enum + switch** (one variable, a switch in update — fast, fine for a handful of states) and **state objects** (one class/node per state with `enter`/`update`/`exit` — scales better, cleaner per-state code). FSMs kill the "is it jumping AND attacking AND stunned?" bool soup.

## When to use it
- Player/character control with clearly distinct modes (grounded, airborne, dashing, climbing).
- Enemy AI with discrete behaviors (patrol, chase, attack, flee, dead).
- Game flow (menu, playing, paused, game-over) and UI screens.
- Animation/ability gating where states are mutually exclusive.

## When NOT to use it
- Two or three independent booleans that don't interact — `isPaused`, `isMuted` don't need a machine.
- Highly hierarchical/parallel AI with many interrupts and shared sub-behaviors — that's where a **behavior tree** (`guides/behavior-trees.md`) or HFSM earns its keep.
- A single linear sequence — that's a coroutine/timeline, not a state machine.

## Per-engine mapping
| Engine | How this pattern is expressed |
|--------|-------------------------------|
| Godot | "State node" pattern: a `StateMachine` node with child `State` nodes (each a script with `enter`/`update`/`exit`); or an `enum` + `match` in `_physics_process`. AnimationTree state machine for animation. |
| Unity | `enum` + `switch` in `Update`, or one MonoBehaviour/class per state. Animator state machine for animation graphs (don't run gameplay logic in it). |
| Unreal | Enum + switch, a state component, or the **Gameplay Ability System** for ability-gated states. Animation State Machines in AnimBP for anim. |
| Roblox | A ModuleScript per state or a state table; `self.State` field switched in a `Heartbeat` loop. |
| Defold | `self.state` field switched in `update`, with transitions driven by `on_message` (e.g. receiving `"hit"` → `"stagger"` state). Messages are the transition triggers. |
| Web | `switch(state)` in the update loop, or a small state-object map `{ idle: {...}, run: {...} }`. Libraries like XState for complex flows. |

## Minimal example
Godot — enum + match (the lean version that's right most of the time):
```gdscript
enum State { IDLE, CHASE, ATTACK, DEAD }
var state: State = State.IDLE

func _physics_process(delta: float) -> void:
    match state:
        State.IDLE:   if _sees_player(): state = State.CHASE
        State.CHASE:  _move_toward(player); if _in_range(): state = State.ATTACK
        State.ATTACK: _attack(); if not _in_range(): state = State.CHASE
        State.DEAD:   pass
```

## Pitfalls
- **Forgetting exit logic**: leaving a state without cleaning up (timers, animations, flags) leaks behavior into the next state. Centralize `exit`.
- **Transition explosion**: every-state-to-every-state gets unmanageable past ~6 states — move to state objects or a hierarchical FSM.
- **Doing transitions in two places**: deciding the same transition in both `enter` and `update` causes flicker. One owner per transition.
- **Mixing animation and gameplay state**: the Animator/AnimationTree should follow gameplay state, not be it.
- **Stuck states**: no path out of a state (missing transition) = soft-lock. Audit that every state can exit.

## Related
- `enemy-ai-patterns`, `player-controllers`, `combat-systems`, `ui-menu-systems`
- `godot-patterns`, `unity-patterns`, `defold-patterns`, `roblox-patterns`
- `guides/behavior-trees.md`, `guides/message-passing.md`, `guides/event-bus.md`
