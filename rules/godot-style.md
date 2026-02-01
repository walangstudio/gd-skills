# Godot Coding Style (GDScript 2.0)

## Type Hints (MANDATORY)

ALWAYS use type hints for all variables, constants, and function parameters/returns.

```gdscript
# ✅ CORRECT
var health: int = 100
var speed: float = 200.0
var player: CharacterBody2D
const MAX_HEALTH: int = 100

func take_damage(amount: int) -> void:
    health -= amount

func get_position() -> Vector2:
    return global_position

# ❌ WRONG - No type hints
var health = 100
func take_damage(amount):
    health -= amount
```

## Naming Conventions

### Variables and Functions
```gdscript
# snake_case for variables and functions
var player_health: int
var current_speed: float
var is_alive: bool

func calculate_damage(base_damage: int) -> int:
    return base_damage * 2

func _process(delta: float) -> void:
    pass
```

### Classes
```gdscript
# PascalCase for class names
class_name PlayerController
class_name EnemyAI
class_name HealthComponent
```

### Constants
```gdscript
# UPPER_SNAKE_CASE for constants
const MAX_SPEED: float = 500.0
const GRAVITY: float = 980.0
const JUMP_VELOCITY: float = -400.0
```

### Signals
```gdscript
# snake_case, past tense for events
signal health_changed
signal died
signal item_collected
signal level_completed

# NOT: die, collect_item, complete_level
```

### Private Variables/Functions
```gdscript
# Prefix with underscore for private
var _internal_state: int = 0

func _calculate_internal() -> void:
    pass
```

### Enums
```gdscript
# PascalCase for enum type, UPPER_SNAKE_CASE for values
enum State {
    IDLE,
    RUNNING,
    JUMPING,
    FALLING,
    ATTACKING
}

var current_state: State = State.IDLE
```

## File and Scene Naming

```
# Files: snake_case
player_controller.gd
enemy_patrol_ai.gd
health_component.gd

# Scenes: snake_case.tscn
player.tscn
enemy_slime.tscn
main_menu.tscn
level_1.tscn

# Resources: snake_case.tres
weapon_sword.tres
player_data.tres
```

## Scene Organization

### Node Hierarchy
```
Root (Functional node: CharacterBody2D, Area2D, Node2D)
├── Sprite2D or AnimatedSprite2D (Visuals)
├── CollisionShape2D (Physics)
├── Components (Node) - Logical grouping
│   ├── HealthComponent
│   ├── MovementComponent
│   └── AttackComponent
└── Audio (Node) - Audio grouping
    ├── SFXPlayer (AudioStreamPlayer)
    └── VoicePlayer (AudioStreamPlayer)
```

### Node Naming
```gdscript
# PascalCase for node names in scene tree
Player
Sprite2D
CollisionShape2D
HealthComponent
AnimationPlayer
```

## Code Organization

### Script Structure Order
```gdscript
class_name ClassName  # 1. Class name (if exported)
extends BaseClass     # 2. Extends

# 3. Signals
signal health_changed(current: int, maximum: int)
signal died

# 4. Enums
enum State { IDLE, RUNNING, JUMPING }

# 5. Constants
const MAX_HEALTH: int = 100
const SPEED: float = 200.0

# 6. @export variables
@export var max_health: int = 100
@export var speed: float = 200.0

# 7. Public variables
var health: int = max_health
var velocity: Vector2 = Vector2.ZERO

# 8. Private variables
var _internal_timer: float = 0.0

# 9. @onready variables
@onready var sprite: Sprite2D = $Sprite2D
@onready var collision: CollisionShape2D = $CollisionShape2D

# 10. Built-in virtual methods (_ready, _process, etc.)
func _ready() -> void:
    pass

func _process(delta: float) -> void:
    pass

func _physics_process(delta: float) -> void:
    pass

# 11. Public methods
func take_damage(amount: int) -> void:
    pass

# 12. Private methods
func _calculate_damage() -> int:
    return 0

# 13. Signal callbacks (prefix with _on_)
func _on_health_changed(current: int) -> void:
    pass
```

## Best Practices

### Use @onready for Node References
```gdscript
# ✅ CORRECT
@onready var sprite: Sprite2D = $Sprite2D

func _process(delta: float) -> void:
    sprite.rotation += delta

# ❌ WRONG
func _process(delta: float) -> void:
    $Sprite2D.rotation += delta  # Searches tree every frame
```

### Use Enums for States
```gdscript
# ✅ CORRECT
enum PlayerState { IDLE, RUNNING, JUMPING, FALLING }
var current_state: PlayerState = PlayerState.IDLE

# ❌ WRONG
var current_state: String = "idle"  # String comparisons are slow and error-prone
```

### Use const for Scene Preloading
```gdscript
# ✅ CORRECT
const BULLET_SCENE: PackedScene = preload("res://scenes/bullet.tscn")

# ❌ WRONG
var bullet_scene = load("res://scenes/bullet.tscn")  # Loads every time
```

### Signal Naming and Usage
```gdscript
# ✅ CORRECT - Past tense
signal died
signal health_changed
signal item_collected

func die() -> void:
    died.emit()  # Event happened

# ❌ WRONG - Present/imperative tense
signal die
signal change_health
```

### Use Type-Safe Comparisons
```gdscript
# ✅ CORRECT
if current_health <= 0:
    die()

if is_on_floor():
    can_jump = true

# ❌ WRONG
if current_health == 0:  # Should use <= for safety
    die()
```

### Avoid Magic Numbers
```gdscript
# ✅ CORRECT
const JUMP_VELOCITY: float = -400.0
const GRAVITY: float = 980.0

velocity.y = JUMP_VELOCITY
velocity.y += GRAVITY * delta

# ❌ WRONG
velocity.y = -400  # What does -400 mean?
velocity.y += 980 * delta
```

## Code Quality Checklist

Before submitting code, verify:

- [ ] All variables have type hints
- [ ] All function parameters have type hints
- [ ] All functions have return type hints (use `-> void` if no return)
- [ ] Constants use UPPER_SNAKE_CASE
- [ ] Functions and variables use snake_case
- [ ] Classes use PascalCase
- [ ] Signals use past tense (died, not die)
- [ ] @onready used for node references
- [ ] No magic numbers (use const)
- [ ] No global mutable state
- [ ] Signals defined at top of script
- [ ] @export used for inspector-visible properties
- [ ] Private members prefixed with underscore
- [ ] Functions are small (<50 lines ideally)
- [ ] No deep nesting (>3 levels)

## Common Anti-Patterns to Avoid

### ❌ WRONG: Mutable Globals
```gdscript
# globals.gd (Autoload)
var player_health: int = 100  # Anyone can mutate this
```

### ✅ CORRECT: Use Signals or Getters
```gdscript
# game_state.gd (Autoload)
signal health_changed(new_health: int)

var _player_health: int = 100

func get_health() -> int:
    return _player_health

func set_health(value: int) -> void:
    _player_health = value
    health_changed.emit(_player_health)
```

### ❌ WRONG: String-Based State
```gdscript
var state: String = "idle"

if state == "idle":  # Typo-prone
    pass
```

### ✅ CORRECT: Enum-Based State
```gdscript
enum State { IDLE, RUNNING }
var state: State = State.IDLE

if state == State.IDLE:  # Type-safe
    pass
```

### ❌ WRONG: Tight Coupling
```gdscript
# enemy.gd
func _on_collision(body):
    if body.name == "Player":  # Depends on specific node name
        body.health -= 10      # Directly accessing player's internal state
```

### ✅ CORRECT: Loose Coupling with Signals/Methods
```gdscript
# enemy.gd
func _on_collision(body: Node) -> void:
    if body.has_method("take_damage"):
        body.take_damage(10)
```

## Performance Guidelines

- Use `@onready` to cache node references
- Prefer `_physics_process` for game logic (runs at fixed 60 FPS)
- Use `_process` for visuals and UI (runs every frame)
- Implement object pooling for frequently spawned objects
- Use collision layers/masks efficiently
- Avoid `get_node()` in loops
- Use `call_deferred()` when modifying scene tree during physics
- Profile with built-in profiler (Debug → Profiler)

---

**Remember**: Type everything, use snake_case for functions/variables, use signals for communication, cache node references with @onready, and follow the Godot scene-based architecture.
