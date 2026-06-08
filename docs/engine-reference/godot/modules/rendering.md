# Godot 4.3 — Rendering Reference

> Pinned to Godot 4.3 (latest stable 4.x). Verify anything newer against https://docs.godotengine.org/en/stable/.

## Core types & entry points
- `CanvasItem` — base of all 2D visuals (`Node2D`, `Control`).
- `Sprite2D` (static) / `AnimatedSprite2D` (`SpriteFrames`-driven).
- `Camera2D` (`make_current()` / `enabled`) and `Camera3D`.
- `CanvasLayer` — draws independent of the world camera (HUDs, parallax layers).
- `SubViewport` + `SubViewportContainer` for render-to-texture.
- Shaders: `.gdshader` files with `shader_type canvas_item` (2D) or `spatial` (3D); applied via `ShaderMaterial`.
- 3D: `MeshInstance3D`, `StandardMaterial3D`, `DirectionalLight3D`/`OmniLight3D`, `WorldEnvironment`.

## Common tasks
Animated sprite playback:
```gdscript
@onready var anim: AnimatedSprite2D = $AnimatedSprite2D

func _ready() -> void:
    anim.play("walk")

func idle() -> void:
    anim.play("idle")
```

Camera follow:
```gdscript
extends Camera2D

@export var target: Node2D
@export var smoothing := 5.0

func _process(delta: float) -> void:
    if target:
        global_position = global_position.lerp(target.global_position, smoothing * delta)
```

A simple 2D shader (`tint.gdshader`):
```glsl
shader_type canvas_item;
uniform vec4 tint : source_color = vec4(1.0);

void fragment() {
    COLOR = texture(TEXTURE, UV) * tint;
}
```
```gdscript
var mat := ShaderMaterial.new()
mat.shader = preload("res://tint.gdshader")
$Sprite2D.material = mat
```

## Gotchas
- HUD elements belong under a `CanvasLayer` so a moving `Camera2D` doesn't drag them.
- 4.x shader uniform color hint is `: source_color` (was `hint_color` in 3.x).
- `Camera2D` is current automatically if it's the only one; otherwise call `make_current()`.
- `modulate` multiplies color including alpha; `self_modulate` affects only the node, not children.
- The default renderer is Forward+; the Compatibility renderer drops some 3D features — verify shaders per backend.

## See also
- `godot-patterns` skill, `godot-style` rule, `godot-specialist` agent
- guides/ for cross-engine architecture patterns
