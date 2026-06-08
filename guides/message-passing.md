# Message Passing

> Decoupled communication where senders address messages to receivers without holding a direct reference to their type or implementation.

## What it is
One object sends a named message (often with a payload) to another; the receiver handles it on its own terms. Sender and receiver share only a message contract, not a class reference. Delivery may be synchronous (handled now) or asynchronous (queued, delivered next frame). Defold is the canonical example: every object communicates by `msg.post`, there is no inheritance, and messages are delivered asynchronously.

## When to use it
- Communicating across systems that should not know each other's types.
- Crossing a boundary (client/server, scene/scene, object/object) where a hard reference is impossible or undesirable.
- One-to-one or one-to-few notifications where a full event bus is overkill.
- Networked code where the message is literally serialized over the wire.

## When NOT to use it
- A direct method call is clearer and the two objects already legitimately know each other. Don't launder a function call through a message.
- You need a return value synchronously — messages model fire-and-forget, not request/response.
- Hot inner loops: async dispatch and string/hash addressing add overhead. Call directly.

## Per-engine mapping
| Engine | How this pattern is expressed |
|--------|-------------------------------|
| Godot | `signal` emit/connect (sync, same frame); `call_deferred` for next-idle delivery. Signals are the idiomatic decoupled channel. |
| Unity | C# `event`/`Action`, `UnityEvent` (inspector-wired), or `SendMessage` (reflection-based, slow — avoid). |
| Unreal | Dynamic/multicast delegates (`DECLARE_DYNAMIC_MULTICAST_DELEGATE`), Blueprint Event Dispatchers. |
| Roblox | `BindableEvent` (same machine) and `RemoteEvent` (client/server); `:Fire()` / `.Event:Connect()`. |
| Defold | `msg.post(receiver, "message_id", {data})` → handled in `on_message(self, message_id, message, sender)`. Async, next-frame, hash-addressed. No inheritance — this IS the comms model. |
| Web | `EventEmitter` (Node/Phaser `emitter.emit`/`.on`), or `postMessage` across workers/iframes. |

## Minimal example
Defold — the natural fit, async by design:
```lua
-- sender
msg.post("/enemy#script", "take_damage", { amount = 10 })

-- receiver: enemy.script
function on_message(self, message_id, message, sender)
    if message_id == hash("take_damage") then
        self.hp = self.hp - message.amount
        if self.hp <= 0 then msg.post("#", "die") end
    end
end
```

## Pitfalls
- Async delivery means the effect lands next frame — don't read state immediately after posting and expect it changed (classic Defold bug).
- Stringly/hash-typed message IDs aren't checked at compile time; a typo silently goes nowhere. Centralize IDs as constants.
- No reply channel built in — model request/response as two messages, and handle the case where no reply ever comes.
- Over-routing everything through messages makes control flow hard to trace. Reserve it for real boundaries.

## Related
- `defold-patterns`, `godot-patterns`, `roblox-patterns`
- `combat-systems`, `dialogue-systems`
- `guides/event-bus.md`, `guides/state-machines.md`, `guides/data-driven.md`
