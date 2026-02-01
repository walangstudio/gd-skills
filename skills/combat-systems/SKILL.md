---
name: combat-systems
description: Reusable combat implementations (melee, ranged, magic, damage types). Reference from genre templates.
---

# Combat Systems

Production-ready combat implementations for action games.

## When to Use

Referenced by genre templates that need combat:
- **FPS Template** → Ranged (hitscan/projectile)
- **RPG Template** → Melee + Ranged + Magic
- **Horror Template** → Limited ranged, melee
- **Survival Template** → Melee + Ranged

---

## Health System

Universal health component with damage types.

### Godot
```gdscript
class_name HealthSystem
extends Node

signal health_changed(current: int, maximum: int)
signal damage_taken(amount: int, type: DamageType)
signal healed(amount: int)
signal died

enum DamageType { PHYSICAL, FIRE, ICE, LIGHTNING, POISON }

@export var max_health: int = 100
@export var resistances: Dictionary = {}  # DamageType -> float (0-1)

var current_health: int
var is_dead: bool = false

func _ready() -> void:
    current_health = max_health

func take_damage(amount: int, type: DamageType = DamageType.PHYSICAL) -> void:
    if is_dead:
        return

    # Apply resistance
    var resistance: float = resistances.get(type, 0.0)
    amount = int(amount * (1.0 - resistance))

    current_health = maxi(current_health - amount, 0)
    damage_taken.emit(amount, type)
    health_changed.emit(current_health, max_health)

    if current_health <= 0:
        die()

func heal(amount: int) -> void:
    if is_dead:
        return

    current_health = mini(current_health + amount, max_health)
    healed.emit(amount)
    health_changed.emit(current_health, max_health)

func die() -> void:
    is_dead = true
    died.emit()

func get_health_percent() -> float:
    return float(current_health) / float(max_health)
```

---

## Melee Combat

Close-range attacks with hitboxes.

### Godot
```gdscript
class_name MeleeCombat
extends Node3D

signal attack_started
signal attack_hit(target: Node3D)
signal combo_continued(combo_count: int)

@export var base_damage: int = 25
@export var attack_range: float = 2.0
@export var attack_cooldown: float = 0.5
@export var combo_window: float = 0.8
@export var combo_max: int = 3

var can_attack: bool = true
var combo_count: int = 0
var combo_timer: float = 0.0

@onready var hitbox: Area3D = $Hitbox
@onready var animation: AnimationPlayer = $AnimationPlayer

func _process(delta: float) -> void:
    if combo_timer > 0:
        combo_timer -= delta
        if combo_timer <= 0:
            combo_count = 0

func attack() -> void:
    if not can_attack:
        return

    can_attack = false
    combo_count = mini(combo_count + 1, combo_max)
    combo_timer = combo_window

    attack_started.emit()
    animation.play("attack_%d" % combo_count)

    # Enable hitbox during attack
    hitbox.monitoring = true
    await get_tree().create_timer(0.2).timeout  # Active frames
    hitbox.monitoring = false

    await get_tree().create_timer(attack_cooldown).timeout
    can_attack = true

    if combo_count < combo_max:
        combo_continued.emit(combo_count)

func _on_hitbox_body_entered(body: Node3D) -> void:
    if body.has_method("take_damage"):
        var damage := calculate_damage()
        body.take_damage(damage)
        attack_hit.emit(body)

func calculate_damage() -> int:
    # Combo multiplier
    var multiplier := 1.0 + (combo_count - 1) * 0.25
    return int(base_damage * multiplier)
```

### Melee Weapon Data
```gdscript
class_name MeleeWeaponData
extends Resource

@export var weapon_name: String
@export var damage: int = 20
@export var attack_speed: float = 1.0
@export var range: float = 2.0
@export var knockback: float = 5.0
@export var damage_type: HealthSystem.DamageType
```

---

## Ranged Combat (Hitscan)

Instant raycast weapons (pistols, rifles).

### Godot
```gdscript
class_name HitscanWeapon
extends Node3D

signal fired
signal hit(target: Node3D, position: Vector3)
signal reloaded

@export var damage: int = 25
@export var fire_rate: float = 0.2
@export var magazine_size: int = 12
@export var reload_time: float = 1.5
@export var spread: float = 0.02
@export var max_range: float = 100.0

var current_ammo: int
var can_fire: bool = true
var is_reloading: bool = false

@onready var raycast: RayCast3D = $RayCast3D
@onready var muzzle: Marker3D = $Muzzle

func _ready() -> void:
    current_ammo = magazine_size
    raycast.target_position = Vector3(0, 0, -max_range)

func fire() -> void:
    if not can_fire or is_reloading or current_ammo <= 0:
        if current_ammo <= 0:
            reload()
        return

    can_fire = false
    current_ammo -= 1
    fired.emit()

    # Apply spread
    var spread_offset := Vector3(
        randf_range(-spread, spread),
        randf_range(-spread, spread),
        0
    )
    raycast.rotation += spread_offset
    raycast.force_raycast_update()

    if raycast.is_colliding():
        var target := raycast.get_collider()
        var hit_pos := raycast.get_collision_point()
        hit.emit(target, hit_pos)

        if target.has_method("take_damage"):
            target.take_damage(damage)

        spawn_impact(hit_pos, raycast.get_collision_normal())

    raycast.rotation -= spread_offset

    await get_tree().create_timer(fire_rate).timeout
    can_fire = true

func reload() -> void:
    if is_reloading or current_ammo == magazine_size:
        return

    is_reloading = true
    await get_tree().create_timer(reload_time).timeout
    current_ammo = magazine_size
    is_reloading = false
    reloaded.emit()

func spawn_impact(pos: Vector3, normal: Vector3) -> void:
    var impact := preload("res://effects/impact.tscn").instantiate()
    get_tree().root.add_child(impact)
    impact.global_position = pos
    impact.look_at(pos + normal)
```

---

## Ranged Combat (Projectile)

Physical projectiles (rockets, arrows).

### Godot
```gdscript
class_name Projectile
extends CharacterBody3D

@export var speed: float = 30.0
@export var damage: int = 50
@export var lifetime: float = 5.0
@export var gravity_affected: bool = false

var direction: Vector3
var shooter: Node3D

func _ready() -> void:
    await get_tree().create_timer(lifetime).timeout
    queue_free()

func launch(dir: Vector3, from: Node3D) -> void:
    direction = dir.normalized()
    shooter = from
    look_at(global_position + direction)

func _physics_process(delta: float) -> void:
    velocity = direction * speed

    if gravity_affected:
        velocity.y -= 9.8 * delta
        direction = velocity.normalized()
        look_at(global_position + direction)

    var collision := move_and_collide(velocity * delta)
    if collision:
        on_hit(collision.get_collider(), collision.get_position())

func on_hit(target: Node3D, position: Vector3) -> void:
    if target == shooter:
        return

    if target.has_method("take_damage"):
        target.take_damage(damage)

    # Spawn explosion or impact
    spawn_effect(position)
    queue_free()

func spawn_effect(pos: Vector3) -> void:
    var effect := preload("res://effects/explosion.tscn").instantiate()
    get_tree().root.add_child(effect)
    effect.global_position = pos
```

---

## Magic/Ability System

Cooldown-based abilities with resource cost.

### Godot
```gdscript
class_name AbilitySystem
extends Node

signal ability_used(ability: AbilityData)
signal mana_changed(current: int, maximum: int)
signal cooldown_updated(ability_id: String, remaining: float)

@export var max_mana: int = 100
@export var mana_regen: float = 5.0  # Per second

var current_mana: int
var abilities: Dictionary = {}  # id -> AbilityData
var cooldowns: Dictionary = {}  # id -> remaining time

func _ready() -> void:
    current_mana = max_mana

func _process(delta: float) -> void:
    # Mana regen
    if current_mana < max_mana:
        current_mana = mini(current_mana + int(mana_regen * delta), max_mana)
        mana_changed.emit(current_mana, max_mana)

    # Update cooldowns
    for id in cooldowns.keys():
        cooldowns[id] -= delta
        cooldown_updated.emit(id, cooldowns[id])
        if cooldowns[id] <= 0:
            cooldowns.erase(id)

func register_ability(ability: AbilityData) -> void:
    abilities[ability.id] = ability

func use_ability(id: String) -> bool:
    if not abilities.has(id):
        return false

    var ability: AbilityData = abilities[id]

    # Check cooldown
    if cooldowns.has(id):
        return false

    # Check mana
    if current_mana < ability.mana_cost:
        return false

    # Use ability
    current_mana -= ability.mana_cost
    mana_changed.emit(current_mana, max_mana)

    cooldowns[id] = ability.cooldown
    ability_used.emit(ability)

    # Execute ability effect
    ability.execute(get_parent())
    return true
```

### Ability Data
```gdscript
class_name AbilityData
extends Resource

@export var id: String
@export var name: String
@export var description: String
@export var icon: Texture2D
@export var mana_cost: int = 20
@export var cooldown: float = 5.0
@export var damage: int = 50
@export var damage_type: HealthSystem.DamageType
@export var range: float = 10.0
@export var area_of_effect: float = 0.0  # 0 = single target

func execute(caster: Node3D) -> void:
    # Override in specific abilities
    pass
```

---

## Damage Numbers

Visual feedback for damage dealt.

### Godot
```gdscript
class_name DamageNumber
extends Node3D

@onready var label: Label3D = $Label3D

func show_damage(amount: int, is_crit: bool = false) -> void:
    label.text = str(amount)

    if is_crit:
        label.modulate = Color.YELLOW
        label.font_size = 32
    else:
        label.modulate = Color.WHITE
        label.font_size = 24

    # Float up and fade
    var tween := create_tween()
    tween.set_parallel(true)
    tween.tween_property(self, "position:y", position.y + 1.5, 0.8)
    tween.tween_property(label, "modulate:a", 0.0, 0.8)
    tween.tween_callback(queue_free)

# Usage: Spawn at hit position
static func spawn(pos: Vector3, amount: int, is_crit: bool = false) -> void:
    var num := preload("res://ui/damage_number.tscn").instantiate()
    Engine.get_main_loop().root.add_child(num)
    num.global_position = pos
    num.show_damage(amount, is_crit)
```

---

## Configuration by Genre

| Genre | Primary Combat | Secondary |
|-------|---------------|-----------|
| FPS | Hitscan + Projectile | - |
| RPG | Melee + Magic | Ranged |
| Horror | Melee | Limited ranged |
| Survival | Melee + Ranged | Crafted weapons |
| Action | Melee combo | Magic abilities |

---

**Reference this skill** from genre templates for combat implementations.
