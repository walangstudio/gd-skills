---
description: Add a health system to your game with HP, damage, healing, death, and optional armor/shields. Works with any game genre.
---

# Create Health Command

## What This Command Does

Adds a complete health system to your existing game:
- ✅ HP with current/max tracking
- ✅ Damage with invincibility frames
- ✅ Healing and regeneration
- ✅ Death handling with respawn or game-over
- ✅ Optional armor/shield layer
- ✅ HUD health bar

## When to Use

- Adding health to a player or enemy
- Need damage and healing mechanics
- Want armor or shield systems
- Building any combat-oriented game

## How It Works

The agent will:

1. **Ask customization questions**:
   - Target entity (player, enemy, both)
   - Health type (Simple HP, HP + Armor, HP + Shield regen)
   - Death behavior (Respawn, Game Over, Destroy)
   - HUD display (Health bar, Hearts, Numeric)
   - Engine (Godot, Unity, Unreal)

2. **Load combat-systems** skill → Health System section

3. **Generate health component** matching your project

## Key Features

### Health Types
- **Simple HP**: Current/max, take damage, heal
- **HP + Armor**: Damage absorbed by armor first
- **HP + Shield**: Shield regenerates after delay
- **Hearts**: Discrete health units (Zelda-style)

### Integration Points
```
# Any node with health responds to:
entity.take_damage(amount)
entity.heal(amount)
entity.health_changed.connect(on_health_changed)
entity.died.connect(on_died)
```

## Boilerplate Code

### Godot — Health Component
```gdscript
class_name HealthComponent
extends Node

signal health_changed(current: int, maximum: int)
signal died
signal damage_taken(amount: int)

@export var max_health: int = 100
@export var invincibility_duration: float = 0.5

var current_health: int
var is_invincible: bool = false

func _ready() -> void:
    current_health = max_health

func take_damage(amount: int) -> void:
    if is_invincible or current_health <= 0:
        return
    current_health = maxi(current_health - amount, 0)
    health_changed.emit(current_health, max_health)
    damage_taken.emit(amount)

    if current_health <= 0:
        died.emit()
        return

    # I-frames
    if invincibility_duration > 0:
        is_invincible = true
        await get_tree().create_timer(invincibility_duration).timeout
        is_invincible = false

func heal(amount: int) -> void:
    current_health = mini(current_health + amount, max_health)
    health_changed.emit(current_health, max_health)

func get_health_ratio() -> float:
    return float(current_health) / float(max_health)
```

### Godot — Health Bar HUD
```gdscript
class_name HealthBar
extends ProgressBar

@export var health_component: HealthComponent

func _ready() -> void:
    if health_component:
        health_component.health_changed.connect(_on_health_changed)
        max_value = health_component.max_health
        value = health_component.current_health

func _on_health_changed(current: int, maximum: int) -> void:
    max_value = maximum
    var tween := create_tween()
    tween.tween_property(self, "value", current, 0.2)
```

## Scene Structure

```
Player (CharacterBody2D/3D)
├── CollisionShape
├── Sprite / Mesh
├── HealthComponent          # Attach this node
├── AnimationPlayer          # Flash on hit
└── HitBox (Area2D/3D)       # Connects to take_damage
```

## Files Created

```
src/
├── components/
│   └── HealthComponent.gd   # Reusable health node
├── ui/
│   └── HealthBar.gd         # HUD health bar
└── scenes/
    └── health_bar.tscn       # Health bar prefab
```

---

**Add health to your game!** Run `/create-health` to get started.
