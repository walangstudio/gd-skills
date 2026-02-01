---
name: godot-patterns
description: Best practices for Godot 4.3+ development with GDScript 2.0, including scene organization, signals, performance optimization, and common game patterns.
---

# Godot Patterns

Production-ready patterns for Godot 4.3+ game development with GDScript 2.0.

## When to Activate

- Building games in Godot engine
- Need guidance on scene organization
- Implementing signals and communication
- Creating reusable components
- Optimizing game performance

## Scene Organization

### Project Structure
```
res://
├── scenes/
│   ├── main_menu.tscn
│   ├── gameplay.tscn
│   └── levels/
│       ├── level_1.tscn
│       └── level_2.tscn
├── scripts/
│   ├── player/
│   │   ├── player.gd
│   │   └── player_state_machine.gd
│   ├── enemies/
│   │   ├── enemy_base.gd
│   │   └── enemy_patrol.gd
│   └── managers/
│       ├── audio_manager.gd
│       └── game_manager.gd
├── assets/
│   ├── sprites/
│   ├── sounds/
│   └── music/
└── resources/
    ├── player_data.tres
    └── weapon_data.tres
```

### Scene Hierarchy Best Practices
```
Player (CharacterBody2D) - Root node should be functional
├── Sprite2D - Visuals
├── CollisionShape2D - Physics
├── Components (Node) - Group components
│   ├── HealthComponent
│   ├── MovementComponent
│   └── InputComponent
├── Audio (Node) - Group audio
│   ├── FootstepPlayer (AudioStreamPlayer)
│   └── VoicePlayer (AudioStreamPlayer)
└── AnimationPlayer - Animations
```

## Signal Patterns

### Custom Signals (ALWAYS Use)
```gdscript
class_name Player
extends CharacterBody2D

# Define signals at top of script
signal health_changed(current_health: int, max_health: int)
signal died
signal jumped
signal landed
signal item_collected(item: Node)

@export var max_health: int = 100
var health: int = max_health

func take_damage(amount: int) -> void:
    health = maxi(0, health - amount)
    health_changed.emit(health, max_health)

    if health <= 0:
        die()

func die() -> void:
    died.emit()
    queue_free()

func jump() -> void:
    velocity.y = JUMP_VELOCITY
    jumped.emit()
```

### Connecting Signals
```gdscript
# In _ready() or when spawning
func _ready() -> void:
    # Method 1: Direct connection
    player.health_changed.connect(_on_player_health_changed)
    player.died.connect(_on_player_died)

    # Method 2: With lambda
    button.pressed.connect(func(): print("Button pressed!"))

    # Method 3: Deferred (safe during physics)
    enemy.died.connect(_on_enemy_died, CONNECT_DEFERRED)

func _on_player_health_changed(current: int, maximum: int) -> void:
    $HealthBar.value = (current / float(maximum)) * 100.0

func _on_player_died() -> void:
    get_tree().change_scene_to_file("res://scenes/game_over.tscn")
```

### Signal Best Practices
- Use past tense for event signals (`died`, not `die`)
- Use present tense for property changes (`health_changed`)
- Always type hint signal parameters
- Disconnect signals when no longer needed
- Use CONNECT_DEFERRED for signals during physics

## Resource Patterns

### Custom Resources
```gdscript
# weapon_data.gd
class_name WeaponData
extends Resource

@export var weapon_name: String = "Sword"
@export var damage: int = 10
@export var attack_speed: float = 1.0
@export var sprite: Texture2D
@export var attack_sound: AudioStream
@export_range(1, 100) var ammo_capacity: int = 30

func get_dps() -> float:
    return damage / attack_speed
```

### Using Resources
```gdscript
# In editor: Right-click → New Resource → WeaponData
# Then assign in inspector

class_name Weapon
extends Node2D

@export var weapon_data: WeaponData

func _ready() -> void:
    if weapon_data:
        $Sprite2D.texture = weapon_data.sprite
        print("Weapon DPS: ", weapon_data.get_dps())
```

### Resource Preloading
```gdscript
# Preload (compile-time, faster)
const SWORD_DATA: WeaponData = preload("res://resources/weapons/sword.tres")

# Load (runtime, flexible)
var weapon_data: WeaponData = load("res://resources/weapons/sword.tres")

# ResourceLoader (async, for large resources)
func load_weapon_async(path: String) -> void:
    ResourceLoader.load_threaded_request(path)
    # Check with ResourceLoader.load_threaded_get_status()
```

## Performance Optimization

### Object Pooling
```gdscript
class_name BulletPool
extends Node

const BULLET_SCENE: PackedScene = preload("res://scenes/bullet.tscn")
const POOL_SIZE: int = 50

var pool: Array[Node] = []
var available: Array[Node] = []

func _ready() -> void:
    for i in POOL_SIZE:
        var bullet: Node = BULLET_SCENE.instantiate()
        bullet.process_mode = Node.PROCESS_MODE_DISABLED
        add_child(bullet)
        pool.append(bullet)
        available.append(bullet)

func spawn_bullet(position: Vector2, direction: Vector2) -> Node:
    if available.is_empty():
        push_warning("Bullet pool exhausted!")
        return null

    var bullet: Node = available.pop_back()
    bullet.global_position = position
    bullet.process_mode = Node.PROCESS_MODE_INHERIT

    # Assume bullet has setup method
    if bullet.has_method("setup"):
        bullet.setup(direction)

    return bullet

func return_bullet(bullet: Node) -> void:
    bullet.process_mode = Node.PROCESS_MODE_DISABLED
    if not available.has(bullet):
        available.append(bullet)
```

### Efficient Collision Detection
```gdscript
# Set up collision layers properly
# Layer 1: Player
# Layer 2: Enemies
# Layer 3: Environment
# Layer 4: Projectiles

# Player setup
func _ready() -> void:
    # Player is on layer 1
    set_collision_layer_value(1, true)
    set_collision_layer_value(2, false)

    # Player collides with layers 2 (enemies) and 3 (environment)
    set_collision_mask_value(1, false)  # Don't collide with other players
    set_collision_mask_value(2, true)   # Collide with enemies
    set_collision_mask_value(3, true)   # Collide with environment
```

### @onready Optimization
```gdscript
# ✅ CORRECT - Use @onready to cache node references
@onready var sprite: Sprite2D = $Sprite2D
@onready var collision: CollisionShape2D = $CollisionShape2D
@onready var health_component: Node = $Components/HealthComponent

func _process(delta: float) -> void:
    sprite.rotation += delta  # Fast - cached reference

# ❌ WRONG - Get node every frame
func _process(delta: float) -> void:
    $Sprite2D.rotation += delta  # Slow - searches tree every frame
```

### Physics Optimization
```gdscript
# Use _physics_process for game logic, _process for visuals
func _physics_process(delta: float) -> void:
    # Movement, collision, game logic
    velocity = calculate_velocity(delta)
    move_and_slide()

func _process(delta: float) -> void:
    # Visual effects, UI updates, interpolation
    $Sprite2D.rotation = lerp_angle($Sprite2D.rotation, target_rotation, delta * 5.0)
```

## State Machine Pattern

### State Base Class
```gdscript
# state.gd
class_name State
extends Node

signal transition_requested(from: State, to_state_name: String)

func enter() -> void:
    pass

func exit() -> void:
    pass

func update(delta: float) -> void:
    pass

func physics_update(delta: float) -> void:
    pass

func handle_input(event: InputEvent) -> void:
    pass
```

### State Machine
```gdscript
# state_machine.gd
class_name StateMachine
extends Node

@export var initial_state: State

var current_state: State
var states: Dictionary = {}

func _ready() -> void:
    # Collect all child states
    for child in get_children():
        if child is State:
            states[child.name] = child
            child.transition_requested.connect(_on_transition_requested)

    if initial_state:
        current_state = initial_state
        current_state.enter()

func _process(delta: float) -> void:
    if current_state:
        current_state.update(delta)

func _physics_process(delta: float) -> void:
    if current_state:
        current_state.physics_update(delta)

func _unhandled_input(event: InputEvent) -> void:
    if current_state:
        current_state.handle_input(event)

func _on_transition_requested(from: State, to_name: String) -> void:
    if from != current_state:
        return

    var new_state: State = states.get(to_name)
    if not new_state:
        push_error("State not found: " + to_name)
        return

    if current_state:
        current_state.exit()

    current_state = new_state
    current_state.enter()
```

### Example States
```gdscript
# player_idle.gd
extends State

func enter() -> void:
    owner.velocity.x = 0

func handle_input(event: InputEvent) -> void:
    if event.is_action_pressed("jump"):
        transition_requested.emit(self, "Jump")
    elif Input.is_action_pressed("move_left") or Input.is_action_pressed("move_right"):
        transition_requested.emit(self, "Run")

# player_run.gd
extends State

const SPEED: float = 200.0

func physics_update(delta: float) -> void:
    var direction: float = Input.get_axis("move_left", "move_right")

    if direction == 0:
        transition_requested.emit(self, "Idle")
        return

    owner.velocity.x = direction * SPEED

func handle_input(event: InputEvent) -> void:
    if event.is_action_pressed("jump"):
        transition_requested.emit(self, "Jump")
```

## Component Pattern

### Health Component
```gdscript
# health_component.gd
class_name HealthComponent
extends Node

signal health_changed(current: int, maximum: int)
signal damage_taken(amount: int)
signal healed(amount: int)
signal died

@export var max_health: int = 100
@export var start_health: int = 100

var current_health: int = 0

func _ready() -> void:
    current_health = start_health

func take_damage(amount: int) -> void:
    if amount <= 0:
        return

    var old_health: int = current_health
    current_health = maxi(0, current_health - amount)

    damage_taken.emit(amount)
    health_changed.emit(current_health, max_health)

    if current_health <= 0 and old_health > 0:
        died.emit()

func heal(amount: int) -> void:
    if amount <= 0:
        return

    current_health = mini(max_health, current_health + amount)
    healed.emit(amount)
    health_changed.emit(current_health, max_health)

func get_health_percentage() -> float:
    return current_health / float(max_health)

func is_alive() -> bool:
    return current_health > 0
```

### Using Components
```gdscript
# player.gd
class_name Player
extends CharacterBody2D

@onready var health_component: HealthComponent = $Components/HealthComponent
@onready var health_bar: ProgressBar = $UI/HealthBar

func _ready() -> void:
    health_component.health_changed.connect(_on_health_changed)
    health_component.died.connect(_on_died)

func _on_health_changed(current: int, maximum: int) -> void:
    health_bar.value = (current / float(maximum)) * 100.0

func _on_died() -> void:
    # Play death animation
    # Disable input
    # Trigger game over
    queue_free()
```

## Autoload/Singleton Pattern

### Audio Manager (Autoload)
```gdscript
# audio_manager.gd (Add to Project Settings → Autoload)
extends Node

const MUSIC_BUS: String = "Music"
const SFX_BUS: String = "SFX"

var music_player: AudioStreamPlayer
var current_music: String = ""

func _ready() -> void:
    music_player = AudioStreamPlayer.new()
    music_player.bus = MUSIC_BUS
    add_child(music_player)

func play_music(music_name: String, fade_duration: float = 1.0) -> void:
    if current_music == music_name and music_player.playing:
        return

    var music_path: String = "res://assets/music/%s.ogg" % music_name
    if not ResourceLoader.exists(music_path):
        push_error("Music not found: " + music_path)
        return

    # Crossfade
    if music_player.playing:
        var tween: Tween = create_tween()
        tween.tween_property(music_player, "volume_db", -80, fade_duration)
        tween.tween_callback(func():
            music_player.stream = load(music_path)
            music_player.play()
            var fade_in: Tween = create_tween()
            fade_in.tween_property(music_player, "volume_db", 0, fade_duration)
        )
    else:
        music_player.stream = load(music_path)
        music_player.play()

    current_music = music_name

func stop_music(fade_duration: float = 1.0) -> void:
    if not music_player.playing:
        return

    var tween: Tween = create_tween()
    tween.tween_property(music_player, "volume_db", -80, fade_duration)
    tween.tween_callback(func():
        music_player.stop()
        music_player.volume_db = 0
    )
    current_music = ""

func play_sfx(sfx_name: String, volume_db: float = 0.0) -> void:
    var sfx_path: String = "res://assets/sounds/%s.wav" % sfx_name
    if not ResourceLoader.exists(sfx_path):
        push_warning("SFX not found: " + sfx_path)
        return

    var player: AudioStreamPlayer = AudioStreamPlayer.new()
    player.stream = load(sfx_path)
    player.bus = SFX_BUS
    player.volume_db = volume_db
    add_child(player)
    player.play()

    # Auto-cleanup when done
    player.finished.connect(func(): player.queue_free())

func set_music_volume(linear_volume: float) -> void:
    AudioServer.set_bus_volume_db(
        AudioServer.get_bus_index(MUSIC_BUS),
        linear_to_db(linear_volume)
    )

func set_sfx_volume(linear_volume: float) -> void:
    AudioServer.set_bus_volume_db(
        AudioServer.get_bus_index(SFX_BUS),
        linear_to_db(linear_volume)
    )
```

## Common Mistakes to Avoid

### ❌ WRONG: No Type Hints
```gdscript
var health = 100
func take_damage(amount):
    health -= amount
```

### ✅ CORRECT: Always Use Type Hints
```gdscript
var health: int = 100
func take_damage(amount: int) -> void:
    health -= amount
```

### ❌ WRONG: Getting Nodes Every Frame
```gdscript
func _process(delta: float) -> void:
    $Sprite2D.rotation += delta
    get_node("AnimationPlayer").play("walk")
```

### ✅ CORRECT: Cache with @onready
```gdscript
@onready var sprite: Sprite2D = $Sprite2D
@onready var animation: AnimationPlayer = $AnimationPlayer

func _process(delta: float) -> void:
    sprite.rotation += delta
    animation.play("walk")
```

### ❌ WRONG: Global Variables
```gdscript
# globals.gd
var player_health: int = 100  # Mutable global state
var player_score: int = 0
```

### ✅ CORRECT: Signals & Proper Architecture
```gdscript
# Use signals to communicate
signal score_changed(new_score: int)

# Or proper singleton with getters/setters
class GameState:
    var _score: int = 0

    func get_score() -> int:
        return _score

    func add_score(amount: int) -> void:
        _score += amount
        score_changed.emit(_score)
```

---

**Remember**: Use type hints everywhere, organize scenes with components, use signals for communication, cache node references with @onready, implement object pooling for frequently spawned objects, and follow the Godot scene tree architecture.
