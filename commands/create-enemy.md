---
description: Add enemy AI to your game with patrol, chase, attack, and boss behaviors. Works with any game genre and engine.
---

# Create Enemy Command

## What This Command Does

Adds enemy AI to your existing game:
- ✅ Patrol behavior (waypoints, random wander)
- ✅ Player detection (sight, sound, proximity)
- ✅ Chase and attack behaviors
- ✅ State machine (idle, patrol, alert, chase, attack)
- ✅ Health and damage dealing
- ✅ Loot drops on death

## When to Use

- Adding enemies to any game
- Need patrol and chase AI
- Want boss fights with phases
- Building horde/wave enemies

## How It Works

The agent will:

1. **Ask customization questions**:
   - Enemy type (Melee, Ranged, Boss, Horde)
   - AI behavior (Patrol, Guard, Stalk, Swarm)
   - Detection method (Line of sight, Proximity, Sound)
   - Game dimension (2D, 3D)
   - Engine (Godot, Unity, Unreal)

2. **Load enemy-ai-patterns** skill → matching pattern

3. **Generate enemy** matching your project

## Key Features

### Enemy Types
- **Patrol**: Walk waypoints, detect player, chase
- **Chase**: Beeline to player, melee attack
- **Ranged**: Maintain distance, shoot projectiles
- **Boss**: Multiple phases, special attacks, arena
- **Horde**: Simple AI, strength in numbers

### Integration Points
```
# Enemies work with any combat system:
enemy.take_damage(amount)
enemy.died.connect(on_enemy_died)  # For score/loot
enemy.add_to_group("enemy")  # Auto-detected by towers, weapons
```

## Boilerplate Code

### Godot — Enemy State Machine
```gdscript
class_name Enemy
extends CharacterBody2D

enum State { IDLE, PATROL, CHASE, ATTACK, HURT, DEAD }

@export var speed: float = 80.0
@export var chase_speed: float = 120.0
@export var detection_range: float = 200.0
@export var attack_range: float = 40.0
@export var damage: int = 10

var state: State = State.IDLE
var player: Node2D = null

func _physics_process(delta: float) -> void:
    match state:
        State.IDLE:
            if _detect_player():
                state = State.CHASE
        State.PATROL:
            _move_toward_waypoint(delta)
            if _detect_player():
                state = State.CHASE
        State.CHASE:
            if player:
                var dir := global_position.direction_to(player.global_position)
                velocity = dir * chase_speed
                if global_position.distance_to(player.global_position) < attack_range:
                    state = State.ATTACK
                elif global_position.distance_to(player.global_position) > detection_range * 1.5:
                    state = State.IDLE
        State.ATTACK:
            velocity = Vector2.ZERO
            _perform_attack()
        State.DEAD:
            velocity = Vector2.ZERO
    move_and_slide()

func _detect_player() -> bool:
    player = get_tree().get_first_node_in_group("player")
    if player and global_position.distance_to(player.global_position) < detection_range:
        return true
    return false

func _move_toward_waypoint(_delta: float) -> void:
    pass  # Implement waypoint patrol

func _perform_attack() -> void:
    pass  # Deal damage, then return to CHASE
```

## Scene Structure

```
Enemy (CharacterBody2D)
├── CollisionShape2D
├── AnimatedSprite2D
├── HealthComponent           # From /create-health
├── DetectionArea (Area2D)    # Player detection radius
│   └── CollisionShape2D
├── HitBox (Area2D)           # Deals damage to player
│   └── CollisionShape2D
├── NavigationAgent2D         # Pathfinding (optional)
└── LootTable                 # Drop items on death
```

## Files Created

```
src/
├── enemies/
│   ├── Enemy.gd              # Base enemy with state machine
│   ├── MeleeEnemy.gd         # Rush and melee attack
│   ├── RangedEnemy.gd        # Keep distance, shoot
│   └── BossEnemy.gd          # Multi-phase boss
├── components/
│   └── DetectionArea.gd      # Reusable detection zone
└── scenes/
    ├── melee_enemy.tscn
    ├── ranged_enemy.tscn
    └── boss_enemy.tscn
```

---

**Add enemies to your game!** Run `/create-enemy` to get started.
