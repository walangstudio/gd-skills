# Godot 4.3 — Animation Reference

> Pinned to Godot 4.3 (latest stable 4.x). Verify anything newer against https://docs.godotengine.org/en/stable/.

## Core types & entry points
- `AnimationPlayer` — keyframed animations on any node property; the workhorse.
- `AnimationTree` + `AnimationNodeStateMachine` / blend spaces for complex blending.
- `Tween` via `create_tween()` (SceneTreeTween) — code-driven property interpolation.
- `AnimatedSprite2D` + `SpriteFrames` for frame-based sprite animation.
- `animation_finished` signal on `AnimationPlayer`.

## Common tasks
Play and chain animations:
```gdscript
@onready var anim: AnimationPlayer = $AnimationPlayer

func _ready() -> void:
    anim.play("intro")
    anim.animation_finished.connect(_on_finished)

func _on_finished(name: StringName) -> void:
    if name == "intro":
        anim.play("idle")
```

Code tween (4.x `create_tween()`):
```gdscript
func pop_in() -> void:
    scale = Vector2.ZERO
    var tw := create_tween()
    tw.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
    tw.tween_property(self, "scale", Vector2.ONE, 0.3)
```

Parallel + sequential tweens:
```gdscript
var tw := create_tween()
tw.set_parallel(true)
tw.tween_property(self, "position:x", 200.0, 0.5)
tw.tween_property(self, "modulate:a", 0.0, 0.5)
```

## Gotchas
- The standalone `Tween` *node* is gone in 4.x — always use `create_tween()`.
- A `SceneTreeTween` from `create_tween()` is one-shot; create a fresh one each time (or call `kill()` then recreate).
- `AnimationTree` must have `active = true` and its `anim_player` assigned to drive the `AnimationPlayer`.
- Property paths in tweens use `:` for sub-properties (e.g. `"position:x"`, `"modulate:a"`).
- Tweens are bound to the node that created them; if that node frees, the tween stops.

## See also
- `godot-patterns` skill, `godot-style` rule, `godot-specialist` agent
- guides/ for cross-engine architecture patterns
