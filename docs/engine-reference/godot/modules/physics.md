# Godot 4.3 — Physics Reference

> Pinned to Godot 4.3 (latest stable 4.x). Verify anything newer against https://docs.godotengine.org/en/stable/.

## Core types & entry points
- `CharacterBody2D` / `CharacterBody3D` — kinematic bodies driven by `velocity` + `move_and_slide()`.
- `RigidBody2D` / `RigidBody3D` — simulated bodies; push via forces/impulses, not direct position.
- `StaticBody2D/3D` — immovable colliders.
- `Area2D` / `Area3D` — overlap/region detection (`body_entered`, `area_entered`), no collision response.
- Collision shapes: `CollisionShape2D/3D` child holds the actual shape resource.
- Collision layers vs masks: a body is *on* its layers and *scans* the bodies on its masks.
- Run physics in `_physics_process(delta)` (fixed timestep), never `_process`.

## Common tasks
Top-down/platformer movement (4.x `move_and_slide()` takes no args):
```gdscript
extends CharacterBody2D

@export var speed: float = 300.0

func _physics_process(_delta: float) -> void:
    var dir := Input.get_vector("left", "right", "up", "down")
    velocity = dir * speed
    move_and_slide()
```

Platformer with gravity + jump:
```gdscript
extends CharacterBody2D

@export var speed := 300.0
@export var jump_velocity := -400.0
var gravity: float = ProjectSettings.get_setting("physics/2d/default_gravity")

func _physics_process(delta: float) -> void:
    if not is_on_floor():
        velocity.y += gravity * delta
    if Input.is_action_just_pressed("jump") and is_on_floor():
        velocity.y = jump_velocity
    velocity.x = Input.get_axis("left", "right") * speed
    move_and_slide()
```

Area2D pickup detection:
```gdscript
func _ready() -> void:
    $Area2D.body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node2D) -> void:
    if body.is_in_group("player"):
        queue_free()
```

## Gotchas
- `move_and_slide()` in 4.x reads/writes the `velocity` property and takes no velocity argument (3.x signature is gone).
- Use `_physics_process`, not `_process`, for anything touching physics.
- Don't set `position` directly on a `RigidBody`; use `move_and_slide` (character), forces (rigid), or `PhysicsServer` for teleports.
- Layers and masks are independent — two bodies collide only if each scans a layer the other occupies.
- `is_on_floor()` is only valid after `move_and_slide()` has run this frame.

## See also
- `godot-patterns` skill, `godot-style` rule, `godot-specialist` agent
- guides/ for cross-engine architecture patterns
