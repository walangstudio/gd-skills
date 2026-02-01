---
description: Activates Godot Engine development mode. Sets context for GDScript 2.0, node tree architecture, signals, and Godot 4.3+ best practices.
---

# Godot Development Mode

You are now working in **Godot Engine 4.3+** mode.

## Language & Framework
- **Language**: GDScript 2.0 with static typing
- **Engine**: Godot 4.3+ (latest stable 4.x)
- **Scene system**: Node tree hierarchy, `.tscn` scene files
- **Scripting**: Signals, groups, autoloads, exported variables

## Conventions
- Use `class_name` for all reusable scripts
- Static typing on ALL variables, parameters, and return types
- Signals for decoupled communication between nodes
- `@export` for inspector-visible properties
- `@onready` for node references
- Autoload singletons for global state (GameManager, AudioManager)

## File Structure
```
project/
├── scenes/       (.tscn files)
├── scripts/      (.gd files)
├── assets/       (sprites, audio, fonts)
├── addons/       (plugins)
└── project.godot (config)
```

## Key Patterns
- `_ready()` → initialization
- `_process(delta)` → per-frame logic
- `_physics_process(delta)` → physics updates (60 Hz)
- `_input(event)` → input handling
- `CharacterBody2D/3D` for player/enemy movement
- `Area2D/3D` for triggers and detection
- `NavigationAgent` for pathfinding

## Use These Skills
- `godot-patterns` for engine-specific patterns
- `godot-style` rule for coding standards
- `godot-specialist` agent for complex issues
