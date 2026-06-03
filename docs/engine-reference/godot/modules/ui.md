# Godot 4.3 — UI Reference

> Pinned to Godot 4.3 (latest stable 4.x). Verify anything newer against https://docs.godotengine.org/en/stable/.

## Core types & entry points
- `Control` — base of all UI; uses anchors + offsets, not Node2D transforms.
- Containers auto-layout children: `VBoxContainer`, `HBoxContainer`, `GridContainer`, `MarginContainer`, `PanelContainer`, `CenterContainer`.
- Widgets: `Button`, `Label`, `LineEdit`, `TextEdit`, `TextureRect`, `ProgressBar`, `OptionButton`.
- Anchors/presets: `set_anchors_preset()`, or the editor's Layout menu (Full Rect, Center, etc.).
- Themes: `Theme` resource overrides; per-node overrides via `add_theme_*_override`.
- Input: `_gui_input(event)`, focus, `mouse_filter`.

## Common tasks
Build a simple HUD in code:
```gdscript
extends CanvasLayer

@onready var score_label: Label = $MarginContainer/Score

func set_score(n: int) -> void:
    score_label.text = "Score: %d" % n
```

Button signal:
```gdscript
func _ready() -> void:
    $VBoxContainer/StartButton.pressed.connect(_on_start)

func _on_start() -> void:
    get_tree().change_scene_to_file("res://game.tscn")
```

Per-node theme override:
```gdscript
$Label.add_theme_color_override("font_color", Color.RED)
$Label.add_theme_font_size_override("font_size", 32)
```

## Gotchas
- Use containers for layout; manually positioning Controls fights the anchor system.
- A child of a container ignores its own anchors — the container controls size/position.
- `mouse_filter = MOUSE_FILTER_IGNORE` lets clicks pass through a Control (e.g. a full-screen overlay label).
- `Control` needs a non-zero `custom_minimum_size` to occupy space inside a container with no content.
- Put HUDs under a `CanvasLayer` so they're not affected by the game camera.

## See also
- `godot-patterns` skill, `godot-style` rule, `godot-specialist` agent
- guides/ for cross-engine architecture patterns
