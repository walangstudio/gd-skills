# Godot 4.3 — Core Reference

> Pinned to Godot 4.3 (latest stable 4.x). Verify anything newer against https://docs.godotengine.org/en/stable/.

## Core types & entry points
- `Object` — base of everything that uses signals/properties; `RefCounted` for ref-counted data; `Node` for the scene tree.
- `Node` lifecycle: `_enter_tree()`, `_ready()`, `_process(delta)`, `_physics_process(delta)`, `_exit_tree()`.
- `SceneTree` — root of the running scene; access via `get_tree()`. Holds the active scene, pause state, groups.
- Autoloads (singletons): registered in Project Settings > Autoload; accessed globally by node name.
- Groups: `add_to_group("enemies")`, `get_tree().get_nodes_in_group("enemies")`, `get_tree().call_group(...)`.
- `@export` exposes a property to the inspector; `@onready` defers initialization until the node is ready.

## Common tasks
Export vars and grab child nodes:
```gdscript
extends Node2D

@export var speed: float = 200.0
@export var target_path: NodePath
@onready var sprite: Sprite2D = $Sprite2D
@onready var target: Node2D = get_node(target_path)
```

Instance a scene at runtime:
```gdscript
var bullet_scene: PackedScene = preload("res://bullet.tscn")

func shoot() -> void:
    var b := bullet_scene.instantiate()
    add_child(b)
    b.global_position = global_position
```

Groups for broadcast logic:
```gdscript
func _ready() -> void:
    add_to_group("enemies")

func damage_all_enemies() -> void:
    for e in get_tree().get_nodes_in_group("enemies"):
        e.take_damage(10)
```

## Gotchas
- `_ready()` runs bottom-up (children before parents). Don't assume a parent's `@onready` is set in a child's `_ready()`.
- `get_node()`/`$` paths are relative to the node, not the scene root.
- `queue_free()` frees at end of frame, not immediately; guard with `is_instance_valid()` after deferred work.
- Autoloads load before the main scene; don't reference scene-tree nodes from an autoload's `_ready()`.
- `@export var x: int` needs a type or explicit `@export` hint to show correctly in the inspector.

## See also
- `godot-patterns` skill, `godot-style` rule, `godot-specialist` agent
- guides/ for cross-engine architecture patterns
