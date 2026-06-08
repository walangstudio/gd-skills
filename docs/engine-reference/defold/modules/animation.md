# Defold 1.9+ — Animation Reference

> Pinned to Defold 1.9+. Verify anything newer against https://defold.com/manuals/ and https://defold.com/ref/stable/.

## Core types & entry points
- `go.animate(url, property, playback, to, easing, duration, [delay], [complete_fn])` — tween any animatable property (position, scale, rotation, material constants, sprite tint).
- `sprite.play_flipbook(url, anim_id, [complete_fn], [options])` — frame (flipbook) animation from an atlas.
- `gui.animate(node, prop, to, easing, duration, ...)` — GUI node animation.
- Playback modes: `go.PLAYBACK_ONCE_FORWARD`, `..._LOOP_FORWARD`, `..._ONCE_PINGPONG`, etc.
- Easing: `go.EASING_LINEAR`, `go.EASING_INOUTQUAD`, `go.EASING_OUTBACK`, etc.
- Spine and Model components have their own animation APIs (`spine.play_anim`, `model.play_anim`) where used.

## Common tasks
Tween position and scale:
```lua
function init(self)
    go.animate(".", "position.x", go.PLAYBACK_ONCE_FORWARD, 400,
        go.EASING_INOUTQUAD, 1.0)
    go.animate("#sprite", "scale", go.PLAYBACK_LOOP_PINGPONG,
        vmath.vector3(1.2), go.EASING_INOUTSINE, 0.5)
end
```

Flipbook with completion:
```lua
sprite.play_flipbook("#sprite", "attack", function(self, message_id, message, sender)
    sprite.play_flipbook("#sprite", "idle")
end)
```

Cancel an animation:
```lua
go.cancel_animations(".", "position.x")
```

## Gotchas
- `go.animate` animates a single property path (`"position.x"`, `"euler.z"`, `"scale"`); animate sub-components separately.
- `sprite.play_flipbook` is frame animation; `go.animate` is property tweening — different APIs for different jobs.
- A looping `go.animate` runs forever until `go.cancel_animations`; a one-shot's `complete_fn` fires once.
- Material constants (e.g. `tint`) animate via `go.animate("#sprite", "tint", ...)` with a `vector4`.
- Spine/model animation is a separate component+API; don't reach for `sprite.play_flipbook` on those.

## See also
- `defold-patterns` skill, `defold-style` rule, `defold-specialist` agent
- guides/ for cross-engine architecture patterns
