# Defold 1.9+ — Rendering Reference

> Pinned to Defold 1.9+. Verify anything newer against https://defold.com/manuals/ and https://defold.com/ref/stable/.

## Core types & entry points
- **Sprite** component — draws from an **atlas** (or tile source); `sprite.play_flipbook`, `sprite.set_hflip`.
- **Tilemap** component — grid of tiles from a tile source; `tilemap.set_tile`, `tilemap.get_tile`.
- **Material** (`.material`) binds vertex/fragment programs + constants; sprites/tilemaps reference one.
- The **render script** (`.render_script`) owns the draw pipeline: predicates, render targets, draw order, clear.
- `go.animate` animates component/material properties (e.g. `tint`).
- Messages to sprites: `"play_animation"` (legacy) / use `sprite.play_flipbook(url, id)`.

## Common tasks
Play a flipbook animation on a sprite:
```lua
function init(self)
    sprite.play_flipbook("#sprite", "run")
end

-- with a completion callback
sprite.play_flipbook("#sprite", "explode", function(self, message_id, message, sender)
    go.delete()
end)
```

Tint a sprite over time with go.animate:
```lua
go.animate("#sprite", "tint", go.PLAYBACK_ONCE_FORWARD,
    vmath.vector4(1, 0, 0, 1), go.EASING_INOUTQUAD, 0.5)
```

Set a tile in a tilemap:
```lua
tilemap.set_tile("/level#tilemap", "ground", x, y, tile_index)
```

## Gotchas
- The render script controls everything drawn — adding a new draw predicate/material usually means editing `default.render_script` (copy it into your project to customize).
- `sprite.play_flipbook` (1.x) is the current API; older `msg.post("#sprite", "play_animation", ...)` still works but prefer the function.
- Sprite `tint` is a `vector4` (RGBA, 0..1); animate via `go.animate("#sprite", "tint", ...)`.
- Atlas animation ids are hashes; `sprite.play_flipbook` accepts the string and hashes it.
- Z-order/draw order comes from the render script predicates + the component's Z position, not a single "layer" field.

## See also
- `defold-patterns` skill, `defold-style` rule, `defold-specialist` agent
- guides/ for cross-engine architecture patterns
