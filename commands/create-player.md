---
description: Add a player controller to your game with movement, input handling, and camera. Supports first-person, third-person, top-down, and platformer styles.
---

# Create Player Command

## What This Command Does

Adds a complete player controller to your game:
- ✅ Movement with acceleration and friction
- ✅ Camera setup (perspective-appropriate)
- ✅ Input handling with rebinding support
- ✅ Animation state machine integration
- ✅ Physics (gravity, collisions, slopes)
- ✅ Common abilities (jump, sprint, crouch, dash)

## When to Use

- Starting a new game and need player movement
- Switching player perspective (2D to 3D, etc.)
- Need a specific controller type
- Want controller with built-in animation support

## How It Works

The agent will:

1. **Ask customization questions**:
   - Controller type (First-person, Third-person, Top-down, Platformer, Vehicle)
   - Game dimension (2D, 3D)
   - Abilities (Jump, Sprint, Crouch, Dash, Wall-jump, Double-jump)
   - Camera style (Fixed, Follow, Orbit)
   - Engine (Godot, Unity, Unreal)

2. **Load player-controllers** skill → matching controller type

3. **Generate player** matching your project

## Key Features

### Controller Types
- **First-Person**: WASD + mouse look, FPS-style
- **Third-Person**: Orbit camera, character-relative movement
- **Top-Down**: 8-directional, mouse-aim optional
- **Platformer**: 2D side-scrolling, coyote time, jump buffer
- **Vehicle**: Steering, acceleration, drift

### Integration Points
```
# Player integrates with other systems:
player.add_to_group("player")  # Auto-detected by enemies, cameras
player.take_damage(amount)     # If health system attached
player.velocity                # Physics-based movement
```

## Boilerplate Code

### Godot — Platformer Controller (2D)
```gdscript
class_name PlayerController
extends CharacterBody2D

@export var speed: float = 200.0
@export var jump_velocity: float = -350.0
@export var gravity: float = 900.0
@export var acceleration: float = 1200.0
@export var friction: float = 1000.0

func _physics_process(delta: float) -> void:
    # Gravity
    if not is_on_floor():
        velocity.y += gravity * delta

    # Jump
    if Input.is_action_just_pressed("jump") and is_on_floor():
        velocity.y = jump_velocity

    # Horizontal movement
    var direction := Input.get_axis("move_left", "move_right")
    if direction:
        velocity.x = move_toward(velocity.x, direction * speed, acceleration * delta)
    else:
        velocity.x = move_toward(velocity.x, 0, friction * delta)

    move_and_slide()
```

### Godot — Top-Down Controller (2D)
```gdscript
class_name TopDownController
extends CharacterBody2D

@export var speed: float = 200.0

func _physics_process(_delta: float) -> void:
    var input := Input.get_vector("move_left", "move_right", "move_up", "move_down")
    velocity = input * speed
    move_and_slide()
```

## Scene Structure

```
Player (CharacterBody2D)
├── CollisionShape2D
├── AnimatedSprite2D          # Or Sprite2D + AnimationPlayer
├── HealthComponent           # From /create-health
├── Camera2D                  # Follow camera
├── HurtBox (Area2D)          # Receives damage
│   └── CollisionShape2D
├── StateMachine              # (optional) idle, run, jump, fall
└── RemoteTransform2D         # For camera detachment
```

## Files Created

```
src/
├── player/
│   ├── PlayerController.gd   # Movement and input
│   ├── PlayerAnimations.gd   # Animation state logic
│   └── PlayerAbilities.gd    # Jump, dash, sprint
├── components/
│   └── StateMachine.gd       # Generic state machine
└── scenes/
    └── player.tscn            # Player scene
```

---

**Add a player controller to your game!** Run `/create-player` to get started.
