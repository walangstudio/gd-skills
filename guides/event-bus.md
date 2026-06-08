# Event Bus

> A central pub/sub hub that lets many systems broadcast and subscribe to named events without holding references to each other.

## What it is
A single global (or scoped) object that everyone can publish to and subscribe from. A publisher fires an event; any number of subscribers react. It's message passing's many-to-many cousin: senders and receivers never reference each other, only the bus and the event name. Great for cross-cutting notifications (player died, score changed, level loaded); dangerous when it becomes the only way anything talks.

## When to use it
- Genuinely global, cross-system events with multiple uninterested-in-each-other listeners (UI, audio, achievements all react to "enemy_killed").
- Decoupling that a direct reference can't cleanly express (the publisher shouldn't know who, if anyone, cares).
- Broadcast where the set of listeners changes at runtime.

## When NOT to use it
- One sender, one known receiver — use a direct call or a single signal/delegate. Don't globalize a private conversation.
- Frequent, ordered, or return-value-bearing interactions — a bus gives no ordering guarantee and no responses.
- When debuggability matters most: a bus turns "who changed this?" into a manhunt. Prefer explicit wiring for core flows.
- As the default for everything. An all-bus codebase is as coupled as a spaghetti one, just invisibly.

## Per-engine mapping
| Engine | How this pattern is expressed |
|--------|-------------------------------|
| Godot | Autoload singleton (`EventBus`) defining `signal`s; anything `EventBus.something.connect(...)` / `EventBus.something.emit(...)`. Idiomatic global signal bus. |
| Unity | `static` C# event/`Action` on a manager, or **ScriptableObject-based event channels** (one SO asset per event, designer-wireable) — the modern decoupled idiom. |
| Unreal | A `UGameInstanceSubsystem` exposing multicast delegates, or a global event manager Actor. Blueprint Event Dispatchers for the visual path. |
| Roblox | A `BindableEvent` (or a ModuleScript wrapping several) acting as a shared hub; `RemoteEvent` when the bus must cross the client/server boundary. |
| Defold | No global bus primitive — a dedicated **controller/manager game object** that other objects `msg.post` to and that re-broadcasts. You build the hub from message passing. |
| Web | A shared `EventEmitter` instance (Node/Phaser) imported everywhere, or a tiny custom pub/sub map. |

## Minimal example
Godot — autoload signal bus (the cleanest first-party version):
```gdscript
# EventBus.gd (registered as an autoload named EventBus)
signal enemy_killed(enemy: Node, points: int)

# publisher (anywhere):
EventBus.enemy_killed.emit(self, 50)

# subscribers (UI, audio, achievements — each independently):
func _ready() -> void:
    EventBus.enemy_killed.connect(_on_enemy_killed)
```

## Pitfalls
- **Lifetime/leaks**: subscribers that outlive their need keep firing (or crash). Disconnect on free/destroy; weak refs or auto-cleanup help.
- **Untraceable flow**: nothing statically links emit to handlers. Name events precisely and log/inspect the bus when debugging.
- **Ordering**: listeners fire in undefined or registration order. Never rely on it; if you need order, you need a different mechanism.
- **Overuse**: routing direct, local interactions through a global bus hides coupling instead of removing it.
- In Defold, your hand-built hub is a single object — watch it becoming a god-object bottleneck.

## Related
- `godot-patterns`, `unity-patterns`, `roblox-patterns`, `defold-patterns`, `javascript-patterns`
- `audio-systems`, `ui-menu-systems`, `save-load-systems`
- `guides/message-passing.md`, `guides/state-machines.md`
