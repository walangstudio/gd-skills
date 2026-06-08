# Godot 4.3 — Navigation Reference

> Pinned to Godot 4.3 (latest stable 4.x). Verify anything newer against https://docs.godotengine.org/en/stable/.

## Core types & entry points
- `NavigationRegion2D` / `NavigationRegion3D` — bakes a `NavigationPolygon` / `NavigationMesh` walkable area.
- `NavigationAgent2D` / `NavigationAgent3D` — pathfinding + avoidance helper on a moving body.
- `NavigationServer2D` / `NavigationServer3D` — low-level path queries and map management.
- `NavigationObstacle2D/3D` — dynamic avoidance obstacles.
- Key agent API: `set_target_position()`, `get_next_path_position()`, `is_navigation_finished()`.

## Common tasks
Agent-driven movement on a `CharacterBody2D`:
```gdscript
extends CharacterBody2D

@export var speed := 200.0
@onready var agent: NavigationAgent2D = $NavigationAgent2D

func set_destination(pos: Vector2) -> void:
    agent.target_position = pos

func _physics_process(_delta: float) -> void:
    if agent.is_navigation_finished():
        return
    var next := agent.get_next_path_position()
    velocity = global_position.direction_to(next) * speed
    move_and_slide()
```

Wait one frame before the first query (the nav map syncs deferred):
```gdscript
func _ready() -> void:
    await get_tree().physics_frame
    agent.target_position = $Goal.global_position
```

## Gotchas
- The navigation map is set up deferred — querying a path on the very first frame returns empty. `await get_tree().physics_frame` first.
- Drive movement from `get_next_path_position()` each physics frame, not from the raw target.
- Regions must be **baked** (`NavigationPolygon`/`NavigationMesh`) or agents have nothing to path on.
- Avoidance (`avoidance_enabled`) emits `velocity_computed` — use that signal's velocity instead of your raw one when avoidance is on.
- Agent radius/height must roughly match the body or paths clip through walls.

## See also
- `godot-patterns` skill, `godot-style` rule, `godot-specialist` agent
- guides/ for cross-engine architecture patterns
