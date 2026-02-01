---
name: enemy-ai-patterns
description: Reusable enemy AI implementations (patrol, chase, ranged, boss, horde). Reference from genre templates.
---

# Enemy AI Patterns

Production-ready enemy AI implementations for various behaviors and engines.

## When to Use

Referenced by genre templates that need enemy AI:
- **FPS Template** → Ranged, Chase, Boss
- **Horror Template** → Patrol, Chase, Boss (stalker)
- **RPG Template** → Patrol, Chase, Ranged, Boss
- **Survival Template** → Horde, Chase, Ranged
- **Tower Defense Template** → Path-following enemies

---

## Patrol AI

Walks between waypoints or along platform edges.

### Godot
```gdscript
class_name PatrolEnemy
extends CharacterBody3D

@export var patrol_points: Array[Marker3D] = []
@export var move_speed: float = 3.0
@export var wait_time: float = 2.0

var current_point: int = 0
var waiting: bool = false

@onready var nav_agent: NavigationAgent3D = $NavigationAgent3D

func _physics_process(delta: float) -> void:
    if waiting or patrol_points.is_empty():
        return

    nav_agent.target_position = patrol_points[current_point].global_position

    if nav_agent.is_navigation_finished():
        advance_patrol()
        return

    var next_pos := nav_agent.get_next_path_position()
    var direction := (next_pos - global_position).normalized()
    velocity = direction * move_speed
    velocity.y -= 9.8 * delta

    look_at(Vector3(next_pos.x, global_position.y, next_pos.z))
    move_and_slide()

func advance_patrol() -> void:
    waiting = true
    await get_tree().create_timer(wait_time).timeout
    current_point = (current_point + 1) % patrol_points.size()
    waiting = false
```

---

## Chase AI

Follows and attacks the player when detected.

### Godot
```gdscript
class_name ChaseEnemy
extends CharacterBody3D

@export var move_speed: float = 4.0
@export var detection_range: float = 15.0
@export var attack_range: float = 2.0
@export var attack_damage: int = 10
@export var attack_cooldown: float = 1.0

var target: Node3D
var can_attack: bool = true

@onready var nav_agent: NavigationAgent3D = $NavigationAgent3D

func _ready() -> void:
    target = get_tree().get_first_node_in_group("player")

func _physics_process(delta: float) -> void:
    if not target:
        return

    var distance := global_position.distance_to(target.global_position)

    if distance > detection_range:
        return  # Idle or patrol

    if distance <= attack_range:
        attack()
    else:
        chase(delta)

func chase(delta: float) -> void:
    nav_agent.target_position = target.global_position
    var next_pos := nav_agent.get_next_path_position()
    var direction := (next_pos - global_position).normalized()

    velocity.x = direction.x * move_speed
    velocity.z = direction.z * move_speed
    velocity.y -= 9.8 * delta

    look_at(Vector3(target.global_position.x, global_position.y, target.global_position.z))
    move_and_slide()

func attack() -> void:
    if not can_attack:
        return
    can_attack = false

    if target.has_method("take_damage"):
        target.take_damage(attack_damage)

    await get_tree().create_timer(attack_cooldown).timeout
    can_attack = true
```

---

## Ranged AI

Takes cover and shoots at player from distance.

### Godot
```gdscript
class_name RangedEnemy
extends CharacterBody3D

@export var projectile_scene: PackedScene
@export var fire_rate: float = 1.5
@export var attack_range: float = 15.0
@export var min_range: float = 5.0  # Backs away if closer

var target: Node3D
var can_shoot: bool = true

@onready var muzzle: Marker3D = $Muzzle

func _physics_process(delta: float) -> void:
    if not target:
        return

    var distance := global_position.distance_to(target.global_position)
    look_at(Vector3(target.global_position.x, global_position.y, target.global_position.z))

    if distance < min_range:
        # Back away
        var away := (global_position - target.global_position).normalized()
        velocity.x = away.x * 3.0
        velocity.z = away.z * 3.0
    elif distance <= attack_range and can_see_target():
        shoot()
        velocity.x = 0
        velocity.z = 0

    velocity.y -= 9.8 * delta
    move_and_slide()

func can_see_target() -> bool:
    var space := get_world_3d().direct_space_state
    var query := PhysicsRayQueryParameters3D.create(global_position, target.global_position)
    query.exclude = [self]
    var result := space.intersect_ray(query)
    return result.is_empty() or result.collider == target

func shoot() -> void:
    if not can_shoot:
        return
    can_shoot = false

    var projectile := projectile_scene.instantiate()
    get_tree().root.add_child(projectile)
    projectile.global_position = muzzle.global_position
    projectile.look_at(target.global_position)

    await get_tree().create_timer(fire_rate).timeout
    can_shoot = true
```

---

## Boss AI (Phase-Based)

Multi-phase boss with different attack patterns.

### Godot
```gdscript
class_name BossEnemy
extends CharacterBody3D

signal phase_changed(phase: int)
signal defeated

@export var max_health: int = 500
@export var phase_thresholds: Array[float] = [0.66, 0.33]  # Health percentages

enum Phase { ONE, TWO, THREE }
var current_phase: Phase = Phase.ONE
var current_health: int

func _ready() -> void:
    current_health = max_health

func take_damage(amount: int) -> void:
    current_health -= amount
    check_phase_transition()

    if current_health <= 0:
        die()

func check_phase_transition() -> void:
    var health_percent := float(current_health) / float(max_health)

    if current_phase == Phase.ONE and health_percent <= phase_thresholds[0]:
        transition_to_phase(Phase.TWO)
    elif current_phase == Phase.TWO and health_percent <= phase_thresholds[1]:
        transition_to_phase(Phase.THREE)

func transition_to_phase(new_phase: Phase) -> void:
    current_phase = new_phase
    phase_changed.emit(int(new_phase))

    # Phase-specific behavior changes
    match new_phase:
        Phase.TWO:
            # Become more aggressive
            $AttackTimer.wait_time *= 0.7
        Phase.THREE:
            # Enrage mode
            $AttackTimer.wait_time *= 0.5

func _on_attack_timer_timeout() -> void:
    match current_phase:
        Phase.ONE:
            basic_attack()
        Phase.TWO:
            if randf() > 0.5:
                special_attack()
            else:
                basic_attack()
        Phase.THREE:
            rage_attack()

func basic_attack() -> void:
    pass  # Implement per-boss

func special_attack() -> void:
    pass  # Implement per-boss

func rage_attack() -> void:
    pass  # Implement per-boss

func die() -> void:
    defeated.emit()
    queue_free()
```

---

## Horde/Swarm AI

Simple AI for many enemies attacking at once.

### Godot
```gdscript
class_name HordeEnemy
extends CharacterBody3D

@export var move_speed: float = 5.0
@export var separation_distance: float = 1.5
@export var damage: int = 5

var target: Node3D

func _ready() -> void:
    target = get_tree().get_first_node_in_group("player")
    add_to_group("horde")

func _physics_process(delta: float) -> void:
    if not target:
        return

    # Move toward target
    var to_target := (target.global_position - global_position).normalized()

    # Separation from other horde members
    var separation := Vector3.ZERO
    for enemy in get_tree().get_nodes_in_group("horde"):
        if enemy == self:
            continue
        var dist := global_position.distance_to(enemy.global_position)
        if dist < separation_distance:
            separation += (global_position - enemy.global_position).normalized()

    var direction := (to_target + separation * 0.3).normalized()
    velocity.x = direction.x * move_speed
    velocity.z = direction.z * move_speed
    velocity.y -= 9.8 * delta

    move_and_slide()
```

---

## State Machine Integration

```gdscript
# Use with any enemy type
enum State { IDLE, PATROL, CHASE, ATTACK, FLEE, DEAD }
var current_state: State = State.IDLE

func _physics_process(delta: float) -> void:
    match current_state:
        State.IDLE:
            process_idle(delta)
        State.PATROL:
            process_patrol(delta)
        State.CHASE:
            process_chase(delta)
        State.ATTACK:
            process_attack(delta)
        State.FLEE:
            process_flee(delta)

func change_state(new_state: State) -> void:
    exit_state(current_state)
    current_state = new_state
    enter_state(new_state)
```

---

## Detection System

```gdscript
# Add to any enemy
@export var sight_range: float = 15.0
@export var sight_angle: float = 60.0  # degrees
@export var hearing_range: float = 10.0

func can_see_target() -> bool:
    if not target:
        return false

    var to_target := target.global_position - global_position
    var distance := to_target.length()

    if distance > sight_range:
        return false

    var angle := rad_to_deg(acos(to_target.normalized().dot(-transform.basis.z)))
    if angle > sight_angle:
        return false

    # Raycast check
    return not is_blocked_by_wall()

func can_hear_target() -> bool:
    if not target:
        return false
    return global_position.distance_to(target.global_position) <= hearing_range
```

---

## Configuration by Genre

| Genre | Primary AI | Secondary AI |
|-------|-----------|--------------|
| FPS | Ranged, Chase | Boss |
| Horror | Patrol (stalker) | Chase |
| RPG | Patrol, Ranged | Boss (multi-phase) |
| Survival | Horde, Chase | Ranged |
| TD | Path-follow | - |

---

**Reference this skill** from genre templates for enemy AI implementations.
