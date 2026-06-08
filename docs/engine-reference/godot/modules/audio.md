# Godot 4.3 — Audio Reference

> Pinned to Godot 4.3 (latest stable 4.x). Verify anything newer against https://docs.godotengine.org/en/stable/.

## Core types & entry points
- `AudioStreamPlayer` (non-positional), `AudioStreamPlayer2D`, `AudioStreamPlayer3D` (spatialized).
- `AudioStream` resources: `AudioStreamWAV`, `AudioStreamOggVorbis`, `AudioStreamMP3`.
- Audio buses: configured in the Audio panel; route players via the `bus` property.
- `AudioServer` — runtime bus volume/effects control.
- `AudioStreamPlayer.finished` signal; `.playing`, `.stream`, `.volume_db`, `.pitch_scale`.

## Common tasks
Play a one-shot SFX:
```gdscript
@onready var sfx: AudioStreamPlayer = $SFX

func play_hit() -> void:
    sfx.stream = preload("res://hit.ogg")
    sfx.play()
```

Looping music via an autoload:
```gdscript
extends AudioStreamPlayer  # registered as Music autoload

func _ready() -> void:
    stream = preload("res://theme.ogg")
    bus = "Music"
    play()
```

Set a bus volume at runtime:
```gdscript
func set_master_volume(linear: float) -> void:
    var idx := AudioServer.get_bus_index("Master")
    AudioServer.set_bus_volume_db(idx, linear_to_db(linear))
```

## Gotchas
- Volume is in **decibels** (`volume_db`), not linear. Convert with `linear_to_db()` / `db_to_linear()`.
- For looping, the loop must be set on the imported `AudioStream` (import settings), not just by replaying.
- `AudioStreamPlayer2D/3D` attenuate by distance; use the plain `AudioStreamPlayer` for UI/music.
- Bus names are case-sensitive strings; a typo silently routes to no effect.
- Many simultaneous one-shots on one player cut each other off; pool players or use multiple.

## See also
- `godot-patterns` skill, `godot-style` rule, `godot-specialist` agent
- guides/ for cross-engine architecture patterns
