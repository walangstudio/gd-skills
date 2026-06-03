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

### Defold
```lua
-- health.script attached to any damageable .go. Damage types are hashes;
-- resistances are read from go.property-driven values set at spawn.
go.property("max_health", 100)
go.property("controller", msg.url())  -- told when this object dies

function init(self)
	self.health = self.max_health
	self.dead = false
	self.resistances = {}             -- [hash("fire")] = 0.5, etc. (set via message)
end

local function emit_health(self)
	msg.post("#", "health_changed", { current = self.health, maximum = self.max_health })
end

function on_message(self, message_id, message, sender)
	if message_id == hash("take_damage") then
		if self.dead then return end
		local resist = self.resistances[message.type or hash("physical")] or 0
		local amount = math.floor(message.amount * (1 - resist))
		self.health = math.max(self.health - amount, 0)
		msg.post("#", "damage_taken", { amount = amount, type = message.type })
		emit_health(self)
		if self.health <= 0 then
			self.dead = true
			msg.post(self.controller, "died", { id = go.get_id() })
			msg.post("#", "died")
		end
	elseif message_id == hash("heal") then
		if self.dead then return end
		self.health = math.min(self.health + message.amount, self.max_health)
		emit_health(self)
	elseif message_id == hash("set_resistance") then
		self.resistances[message.type] = message.value
	end
end
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

### Defold
```lua
-- melee.script. The hitbox is a collision object child "#hitbox" enabled only
-- during active frames; targets it touches receive a take_damage message.
go.property("base_damage", 25)
go.property("attack_cooldown", 0.5)
go.property("combo_window", 0.8)
go.property("combo_max", 3)
go.property("active_frames", 0.2)

function init(self)
	self.can_attack = true
	self.cooldown_left = 0
	self.combo_count = 0
	self.combo_timer = 0
	self.hitbox_left = 0
	msg.post("#hitbox", "disable")
end

local function calc_damage(self)
	local multiplier = 1.0 + (self.combo_count - 1) * 0.25
	return math.floor(self.base_damage * multiplier)
end

function update(self, dt)
	if self.cooldown_left > 0 then
		self.cooldown_left = self.cooldown_left - dt
		if self.cooldown_left <= 0 then self.can_attack = true end
	end
	if self.combo_timer > 0 then
		self.combo_timer = self.combo_timer - dt
		if self.combo_timer <= 0 then self.combo_count = 0 end
	end
	if self.hitbox_left > 0 then
		self.hitbox_left = self.hitbox_left - dt
		if self.hitbox_left <= 0 then msg.post("#hitbox", "disable") end
	end
end

local function attack(self)
	if not self.can_attack then return end
	self.can_attack = false
	self.combo_count = math.min(self.combo_count + 1, self.combo_max)
	self.combo_timer = self.combo_window
	self.cooldown_left = self.attack_cooldown
	self.hitbox_left = self.active_frames

	msg.post("#sprite", "play_animation", { id = hash("attack_" .. self.combo_count) })
	msg.post("#hitbox", "enable")
end

function on_message(self, message_id, message, sender)
	if message_id == hash("attack") then
		attack(self)
	elseif message_id == hash("collision_response") and self.hitbox_left > 0 then
		msg.post(message.other_id, "take_damage", { amount = calc_damage(self), type = hash("physical") })
	end
end

-- melee weapon data lives in a require'd module, returned as plain tables:
-- scripts/weapons.lua
--   local M = {}
--   M.sword = { name = "Sword", damage = 20, attack_speed = 1.0,
--               range = 2.0, knockback = 5.0, damage_type = hash("physical") }
--   return M
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

### Defold
```lua
-- hitscan_weapon.script on a "#muzzle"-bearing weapon .go. Fires an async ray
-- cast; the impact factory "#impactfactory" spawns the hit effect on response.
go.property("damage", 25)
go.property("fire_rate", 0.2)
go.property("magazine_size", 12)
go.property("reload_time", 1.5)
go.property("spread", 0.02)
go.property("max_range", 100.0)

local HIT_GROUPS = { hash("enemy"), hash("wall") }

function init(self)
	self.ammo = self.magazine_size
	self.cooldown_left = 0
	self.reload_left = 0
end

function update(self, dt)
	if self.cooldown_left > 0 then self.cooldown_left = self.cooldown_left - dt end
	if self.reload_left > 0 then
		self.reload_left = self.reload_left - dt
		if self.reload_left <= 0 then self.ammo = self.magazine_size end
	end
end

local function reload(self)
	if self.reload_left > 0 or self.ammo == self.magazine_size then return end
	self.reload_left = self.reload_time
end

local function fire(self)
	if self.cooldown_left > 0 or self.reload_left > 0 then return end
	if self.ammo <= 0 then reload(self) return end

	self.ammo = self.ammo - 1
	self.cooldown_left = self.fire_rate

	local from = go.get_position("#muzzle")
	local rot = go.get_rotation("#muzzle")
	local fwd = vmath.rotate(rot, vmath.vector3(0, 0, -1))
	-- apply spread
	fwd.x = fwd.x + math.random() * 2 * self.spread - self.spread
	fwd.y = fwd.y + math.random() * 2 * self.spread - self.spread
	local to = from + vmath.normalize(fwd) * self.max_range
	physics.raycast_async(from, to, HIT_GROUPS)
end

function on_message(self, message_id, message, sender)
	if message_id == hash("fire") then
		fire(self)
	elseif message_id == hash("reload") then
		reload(self)
	elseif message_id == hash("ray_cast_response") then
		if message.group == hash("enemy") then
			msg.post(message.id, "take_damage", { amount = self.damage, type = hash("physical") })
		end
		factory.create("#impactfactory", message.position)
	end
end
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

### Defold
```lua
-- projectile.script. Spawned by a factory; the spawner passes dir/shooter via the
-- factory.create properties table. Moves itself and reacts to collision messages.
go.property("speed", 30.0)
go.property("damage", 50)
go.property("lifetime", 5.0)
go.property("gravity_affected", false)

local GRAVITY = -20.0

function init(self)
	self.dir = vmath.rotate(go.get_rotation(), vmath.vector3(0, 0, -1))
	self.velocity = self.dir * self.speed
	self.age = 0
end

function update(self, dt)
	self.age = self.age + dt
	if self.age >= self.lifetime then
		go.delete()
		return
	end

	if self.gravity_affected then
		self.velocity.y = self.velocity.y + GRAVITY * dt
		go.set_rotation(vmath.quat_rotation_y(math.atan2(self.velocity.x, self.velocity.z)))
	end
	go.set_position(go.get_position() + self.velocity * dt)
end

function on_message(self, message_id, message, sender)
	if message_id == hash("collision_response") then
		if message.other_group == hash("enemy") then
			msg.post(message.other_id, "take_damage", { amount = self.damage, type = hash("physical") })
		end
		factory.create("#explosionfactory", go.get_position())
		go.delete()
	end
end
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

### Defold
```lua
-- ability.script. Abilities are plain-table definitions registered by id; the
-- script tracks mana and per-ability cooldowns and runs an "execute" callback.
go.property("max_mana", 100)
go.property("mana_regen", 5.0)        -- per second

function init(self)
	self.mana = self.max_mana
	self.abilities = {}               -- [id] = { mana_cost, cooldown, execute(self) }
	self.cooldowns = {}               -- [id] = remaining seconds
end

local function register(self, id, ability)
	self.abilities[id] = ability
end

function update(self, dt)
	if self.mana < self.max_mana then
		self.mana = math.min(self.mana + self.mana_regen * dt, self.max_mana)
	end
	for id, t in pairs(self.cooldowns) do
		t = t - dt
		if t <= 0 then self.cooldowns[id] = nil else self.cooldowns[id] = t end
	end
end

local function use_ability(self, id)
	local ability = self.abilities[id]
	if not ability then return false end
	if self.cooldowns[id] then return false end
	if self.mana < ability.mana_cost then return false end

	self.mana = self.mana - ability.mana_cost
	self.cooldowns[id] = ability.cooldown
	if ability.execute then ability.execute(self) end
	msg.post("#", "ability_used", { id = id })
	return true
end

function on_message(self, message_id, message, sender)
	if message_id == hash("register_ability") then
		register(self, message.id, message.ability)
	elseif message_id == hash("use_ability") then
		use_ability(self, message.id)
	end
end

-- Ability definitions live in a require'd module returning plain tables:
-- scripts/abilities.lua
--   local M = {}
--   M.fireball = { mana_cost = 20, cooldown = 5.0, damage = 50,
--                  damage_type = hash("fire"), range = 10.0,
--                  execute = function(self) --[[ spawn projectile, etc. ]] end }
--   return M
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

### Defold
```lua
-- damage_number.script on a small .go that carries a "#label" component.
-- Spawn one from a factory at the hit position, passing amount + crit flag.
go.property("rise", 1.5)
go.property("duration", 0.8)
go.property("amount", 0)
go.property("crit", false)

function init(self)
	label.set_text("#label", tostring(self.amount))

	local color = self.crit and vmath.vector4(1, 1, 0, 1) or vmath.vector4(1, 1, 1, 1)
	go.set("#label", "color", color)
	local scale = self.crit and 1.3 or 1.0
	go.set_scale(scale)

	-- float up
	local pos = go.get_position()
	go.animate(".", "position.y", go.PLAYBACK_ONCE_FORWARD, pos.y + self.rise,
		go.EASING_OUTQUAD, self.duration)
	-- fade out, then delete
	go.animate("#label", "color.w", go.PLAYBACK_ONCE_FORWARD, 0,
		go.EASING_INQUAD, self.duration, 0, function()
			go.delete()
		end)
end

-- spawn from gameplay:
-- factory.create("#damagefactory", hit_pos, nil, { amount = dmg, crit = is_crit })
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
