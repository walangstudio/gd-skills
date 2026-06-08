# Defold 1.9+ — Audio Reference

> Pinned to Defold 1.9+. Verify anything newer against https://defold.com/manuals/ and https://defold.com/ref/stable/.

## Core types & entry points
- **Sound** component — references a sound resource (`.wav` / `.ogg`); attach to a game object.
- `sound.play(url, [props], [complete_function])` and `sound.stop(url)`.
- Legacy message form: `msg.post("#sound", "play_sound", { gain = 0.5 })` / `"stop_sound"`.
- Sound **groups** (set in `game.project` / per resource) for mixing; `sound.set_group_gain`, `sound.get_group_gain`.
- Props: `gain` (linear), `pan`, `speed`, `delay`.

## Common tasks
Play a sound (function API, preferred):
```lua
function fire(self)
    sound.play("#shoot", { gain = 0.8, speed = 1.0 })
end
```

Play with a completion callback:
```lua
sound.play("#explosion", { gain = 1.0 }, function(self, message_id, message, sender)
    -- finished playing
end)
```

Message form + stop:
```lua
msg.post("#music", "play_sound", { gain = 0.5 })
-- later
msg.post("#music", "stop_sound")
```

Adjust a group's gain at runtime:
```lua
sound.set_group_gain(hash("music"), 0.3)
```

## Gotchas
- `gain` is **linear** (0..1+), not decibels.
- Prefer the `sound.play`/`sound.stop` functions; the `play_sound`/`stop_sound` messages are the older path.
- Looping is a property of the sound resource/component setting, not a `play` argument.
- Group names are hashes; mixing/ducking is done via group gains, not per-sound math.
- A `sound` component plays its assigned resource; to play different clips, use multiple sound components or swap resources.

## See also
- `defold-patterns` skill, `defold-style` rule, `defold-specialist` agent
- guides/ for cross-engine architecture patterns
