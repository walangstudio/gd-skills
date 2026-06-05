---
name: fps-template
description: Complete first-person shooter template with player controller, weapons, enemy AI, health/ammo systems, and levels. Use for creating FPS games like Doom, Quake, or Call of Duty.
---

# FPS Template

Production-ready first-person shooter template with mouse look, weapons, enemy AI, and level progression.

## Verified Reference Implementation

A complete, dependency-free, **headless-tested** reference for this genre ships in the gd-skills repo at `samples/web/shooter/`: the pure mechanics live in `logic.js` (run `node test.js` — 13 passing assert groups) split from rendering/input in `game.js` — a top-down projectile-combat reference, the closest web-runnable analog to an FPS core loop. Mirror that split when you generate — it keeps the core loop unit-testable, and the autonomous-validation loop can trace generated logic against this known-good reference. See each sample's `PROMPT.md` (the spec) and `NOTES.md` (verified vs visual).

## When to Use

- Creating first-person shooter games
- Need mouse look, weapons, shooting mechanics
- Want arena/tactical/horror FPS gameplay
- Building wave-based or mission-based levels

## Sub-Genres Supported

1. **Arena** (Doom, Quake) - Fast movement, weapon pickups, arenas
2. **Tactical** (Counter-Strike, Valorant) - Team-based, precision shooting
3. **Looter** (Borderlands, Destiny) - RPG elements, loot, abilities
4. **Horror** (Resident Evil, FEAR) - Limited ammo, dark atmosphere
5. **Retro** (ULTRAKILL, Dusk) - Old-school mechanics, movement tech

## Core Features

### Player Controller
**Reference**: `player-controllers` skill → First-Person Controller

Additional FPS features:
- Head bob while walking
- Weapon sway/tilt on movement
- Crouch with camera height transition
- Sprint with FOV change

### Enemy AI
**Reference**: `enemy-ai-patterns` skill → Patrol AI, Chase AI, Ranged AI, Boss AI

### Combat
**Reference**: `combat-systems` skill → Health System, Hitscan Weapons, Projectile Weapons

---

## FPS-Specific Systems

### Weapon System
```gdscript
class_name Weapon
extends Node3D

signal ammo_changed(current: int, reserve: int)
signal reloading_started
signal reloading_finished

@export var weapon_name: String = "Pistol"
@export var damage: int = 25
@export var fire_rate: float = 0.2
@export var magazine_size: int = 12
@export var reserve_ammo: int = 60
@export var reload_time: float = 1.5
@export var automatic: bool = false
@export var spread: float = 0.01

var current_ammo: int
var can_fire: bool = true
var is_reloading: bool = false

@onready var raycast: RayCast3D = get_parent().get_node("../RayCast3D")
@onready var animation: AnimationPlayer = $AnimationPlayer
@onready var muzzle_flash: GPUParticles3D = $MuzzleFlash
@onready var audio: AudioStreamPlayer3D = $AudioStreamPlayer3D

func _ready() -> void:
    current_ammo = magazine_size

func _process(_delta: float) -> void:
    if automatic:
        if Input.is_action_pressed("fire") and can_fire and not is_reloading:
            fire()
    else:
        if Input.is_action_just_pressed("fire") and can_fire and not is_reloading:
            fire()
    if Input.is_action_just_pressed("reload") and not is_reloading:
        reload()

func fire() -> void:
    if current_ammo <= 0:
        reload()
        return

    current_ammo -= 1
    can_fire = false
    ammo_changed.emit(current_ammo, reserve_ammo)

    animation.play("fire")
    muzzle_flash.emitting = true
    audio.play()

    # Apply spread and hitscan
    var spread_vector := Vector3(randf_range(-spread, spread), randf_range(-spread, spread), 0)
    raycast.target_position = Vector3(0, 0, -100) + spread_vector
    raycast.force_raycast_update()

    if raycast.is_colliding():
        var target: Node3D = raycast.get_collider()
        if target.has_method("take_damage"):
            target.take_damage(damage, raycast.get_collision_point())

    await get_tree().create_timer(fire_rate).timeout
    can_fire = true

func reload() -> void:
    if reserve_ammo <= 0 or current_ammo == magazine_size:
        return
    is_reloading = true
    reloading_started.emit()
    animation.play("reload")

    await get_tree().create_timer(reload_time).timeout

    var ammo_needed: int = magazine_size - current_ammo
    var ammo_to_add: int = mini(ammo_needed, reserve_ammo)
    current_ammo += ammo_to_add
    reserve_ammo -= ammo_to_add
    is_reloading = false
    reloading_finished.emit()
    ammo_changed.emit(current_ammo, reserve_ammo)
```

### Unity C# (Weapon)
```csharp
using UnityEngine;

public class Weapon : MonoBehaviour
{
    [Header("Stats")]
    [SerializeField] private string weaponName = "Pistol";
    [SerializeField] private int damage = 25;
    [SerializeField] private float fireRate = 0.2f;
    [SerializeField] private int magazineSize = 12;
    [SerializeField] private float reloadTime = 1.5f;
    [SerializeField] private bool automatic = false;
    [SerializeField] private float spread = 0.01f;

    private int currentAmmo;
    private int reserveAmmo = 60;
    private bool canFire = true;
    private bool isReloading;

    [SerializeField] private Transform muzzle;
    [SerializeField] private ParticleSystem muzzleFlash;
    [SerializeField] private AudioSource audioSource;

    private void Start() => currentAmmo = magazineSize;

    private void Update()
    {
        bool fireInput = automatic ? Input.GetButton("Fire1") : Input.GetButtonDown("Fire1");
        if (fireInput && canFire && !isReloading) Fire();
        if (Input.GetKeyDown(KeyCode.R)) Reload();
    }

    private void Fire()
    {
        if (currentAmmo <= 0) { Reload(); return; }
        currentAmmo--;
        canFire = false;
        muzzleFlash?.Play();
        audioSource?.Play();

        Vector3 spreadDir = muzzle.forward + new Vector3(
            Random.Range(-spread, spread), Random.Range(-spread, spread), 0);
        if (Physics.Raycast(muzzle.position, spreadDir, out RaycastHit hit, 100f))
        {
            if (hit.collider.TryGetComponent<IDamageable>(out var target))
                target.TakeDamage(damage, hit.point);
        }
        Invoke(nameof(ResetFire), fireRate);
    }

    private void ResetFire() => canFire = true;

    private void Reload()
    {
        if (isReloading || reserveAmmo <= 0 || currentAmmo == magazineSize) return;
        isReloading = true;
        Invoke(nameof(FinishReload), reloadTime);
    }

    private void FinishReload()
    {
        int needed = magazineSize - currentAmmo;
        int toAdd = Mathf.Min(needed, reserveAmmo);
        currentAmmo += toAdd;
        reserveAmmo -= toAdd;
        isReloading = false;
    }
}
```

### Defold

First-person look and move live on the player object: the body holds yaw, a child camera object holds pitch. Shooting is a hitscan via `physics.raycast`. The weapon owns ammo/reload state and posts results as messages; the enemy reacts to its own take_damage.

```lua
-- player.script  (body yaws; child "camera" pitches)
go.property("move_speed", 6)
go.property("mouse_sensitivity", 0.0025)

local PITCH_LIMIT = math.pi * 0.49

function init(self)
	msg.post(".", "acquire_input_focus")
	self.yaw = 0
	self.pitch = 0
	self.move = vmath.vector3()
end

function update(self, dt)
	local fwd = vmath.rotate(vmath.quat_rotation_z(self.yaw), vmath.vector3(self.move.x, 0, self.move.z))
	if vmath.length(fwd) > 0 then
		local pos = go.get_position() + vmath.normalize(fwd) * self.move_speed * dt
		go.set_position(pos)
	end
	self.move = vmath.vector3()
end

function on_input(self, action_id, action)
	if action_id == hash("look") then
		self.yaw = self.yaw - action.dx * self.mouse_sensitivity
		self.pitch = math.max(-PITCH_LIMIT, math.min(PITCH_LIMIT, self.pitch + action.dy * self.mouse_sensitivity))
		go.set_rotation(vmath.quat_rotation_y(self.yaw))
		go.set_rotation(vmath.quat_rotation_x(self.pitch), "camera")
	elseif action_id == hash("move_forward") then
		self.move.z = self.move.z - action.value
	elseif action_id == hash("move_back") then
		self.move.z = self.move.z + action.value
	elseif action_id == hash("strafe_left") then
		self.move.x = self.move.x - action.value
	elseif action_id == hash("strafe_right") then
		self.move.x = self.move.x + action.value
	end
end

function final(self)
	msg.post(".", "release_input_focus")
end
```

```lua
-- weapon.script  (sibling of the camera; raycasts from the camera forward)
go.property("damage", 25)
go.property("fire_rate", 0.2)
go.property("magazine_size", 12)
go.property("reserve_ammo", 60)
go.property("reload_time", 1.5)
go.property("automatic", false)
go.property("range", 100)

local HITSCAN_GROUPS = { hash("enemy"), hash("world") }

local function fire(self)
	if self.is_reloading or self.cooldown > 0 then return end
	if self.current_ammo <= 0 then reload(self); return end
	self.current_ammo = self.current_ammo - 1
	self.cooldown = self.fire_rate
	msg.post("#muzzle_flash", "play")
	msg.post("/hud#gui", "ammo_changed", { current = self.current_ammo, reserve = self.reserve_ammo })

	local from = go.get_world_position("camera")
	local dir = vmath.rotate(go.get_world_rotation("camera"), vmath.vector3(0, 0, -1))
	local hit = physics.raycast(from, from + dir * self.range, HITSCAN_GROUPS)
	if hit then
		msg.post(hit.id, "take_damage", { amount = self.damage, point = hit.position })
	end
end

function reload(self)
	if self.is_reloading or self.reserve_ammo <= 0 or self.current_ammo == self.magazine_size then return end
	self.is_reloading = true
	timer.delay(self.reload_time, false, function()
		local needed = self.magazine_size - self.current_ammo
		local to_add = math.min(needed, self.reserve_ammo)
		self.current_ammo = self.current_ammo + to_add
		self.reserve_ammo = self.reserve_ammo - to_add
		self.is_reloading = false
		msg.post("/hud#gui", "ammo_changed", { current = self.current_ammo, reserve = self.reserve_ammo })
	end)
end

function init(self)
	self.current_ammo = self.magazine_size
	self.cooldown = 0
	self.is_reloading = false
end

function update(self, dt)
	if self.cooldown > 0 then self.cooldown = self.cooldown - dt end
	if self.automatic and self.firing then fire(self) end
end

function on_input(self, action_id, action)
	if action_id == hash("fire") then
		if self.automatic then
			self.firing = action.value > 0
		elseif action.pressed then
			fire(self)
		end
	elseif action_id == hash("reload") and action.pressed then
		reload(self)
	end
end
```

```lua
-- enemy.script  (reacts to its own take_damage; no inheritance, message-driven)
go.property("max_health", 100)

function init(self)
	self.health = self.max_health
end

function on_message(self, message_id, message, sender)
	if message_id == hash("take_damage") then
		self.health = math.max(0, self.health - message.amount)
		msg.post("#sprite", "play_animation", { id = hash("hit") })
		if self.health == 0 then
			msg.post("/game#controller", "enemy_killed", { id = go.get_id() })
			go.delete()
		end
	end
end
```

### Weapon Manager
```gdscript
class_name WeaponManager
extends Node3D

signal weapon_changed(weapon: Weapon)

var weapons: Array[Weapon] = []
var current_weapon_index: int = 0

func _ready() -> void:
    for child in get_children():
        if child is Weapon:
            weapons.append(child)
            child.visible = false
    if weapons.size() > 0:
        equip_weapon(0)

func _input(event: InputEvent) -> void:
    for i in range(mini(weapons.size(), 9)):
        if event.is_action_pressed("weapon_%d" % (i + 1)):
            equip_weapon(i)
            return
    if event.is_action_pressed("next_weapon"):
        equip_weapon((current_weapon_index + 1) % weapons.size())
    elif event.is_action_pressed("prev_weapon"):
        equip_weapon((current_weapon_index - 1 + weapons.size()) % weapons.size())

func equip_weapon(index: int) -> void:
    if index < 0 or index >= weapons.size():
        return
    if current_weapon_index < weapons.size():
        weapons[current_weapon_index].visible = false
        weapons[current_weapon_index].set_process(false)
    current_weapon_index = index
    weapons[current_weapon_index].visible = true
    weapons[current_weapon_index].set_process(true)
    weapon_changed.emit(weapons[current_weapon_index])

func add_ammo(weapon_type: String, amount: int) -> void:
    for weapon in weapons:
        if weapon.weapon_name == weapon_type:
            weapon.reserve_ammo += amount
            break
```

### Defold

Each weapon is a separate game object parented to the camera. The manager enables the active one and disables the rest by message, and routes ammo pickups to the matching weapon. No object reaches into another.

```lua
-- weapon_manager.script  (parent of weapon_0, weapon_1, ... child objects)
local SLOTS = { hash("/player/camera/weapon_0"), hash("/player/camera/weapon_1"), hash("/player/camera/weapon_2") }

local function equip(self, index)
	if index < 1 or index > #SLOTS then return end
	for i, id in ipairs(SLOTS) do
		local on = (i == index)
		msg.post(id, on and "enable" or "disable")
		msg.post(msg.url(nil, id, "weapon"), on and "acquire_input_focus" or "release_input_focus")
	end
	self.current = index
	msg.post("/hud#gui", "weapon_changed", { slot = index })
end

function init(self)
	msg.post(".", "acquire_input_focus")
	self.current = 1
	equip(self, 1)
end

function on_input(self, action_id, action)
	if not action.pressed then return end
	if action_id == hash("weapon_1") then equip(self, 1)
	elseif action_id == hash("weapon_2") then equip(self, 2)
	elseif action_id == hash("weapon_3") then equip(self, 3)
	elseif action_id == hash("next_weapon") then equip(self, (self.current % #SLOTS) + 1)
	elseif action_id == hash("prev_weapon") then equip(self, ((self.current - 2) % #SLOTS) + 1)
	end
end

function on_message(self, message_id, message, sender)
	if message_id == hash("add_ammo") then
		for _, id in ipairs(SLOTS) do
			msg.post(msg.url(nil, id, "weapon"), "add_reserve", { type = message.type, amount = message.amount })
		end
	end
end
```

### Pickup System
```gdscript
class_name Pickup
extends Area3D

enum PickupType { HEALTH, ARMOR, AMMO }

@export var pickup_type: PickupType = PickupType.HEALTH
@export var amount: int = 25
@export var ammo_type: String = "Pistol"
@export var respawn_time: float = 30.0
@export var bob_speed: float = 2.0
@export var bob_height: float = 0.2

var start_y: float
var time: float = 0.0

@onready var mesh: MeshInstance3D = $MeshInstance3D
@onready var collision: CollisionShape3D = $CollisionShape3D

func _ready() -> void:
    start_y = position.y
    body_entered.connect(_on_body_entered)

func _process(delta: float) -> void:
    time += delta
    position.y = start_y + sin(time * bob_speed) * bob_height
    mesh.rotate_y(delta)

func _on_body_entered(body: Node3D) -> void:
    if not body.is_in_group("player"):
        return
    match pickup_type:
        PickupType.HEALTH:
            if body.has_method("heal"):
                body.heal(amount)
        PickupType.ARMOR:
            if body.has_method("add_armor"):
                body.add_armor(amount)
        PickupType.AMMO:
            var wm: WeaponManager = body.get_node_or_null("Head/Camera3D/WeaponHolder")
            if wm:
                wm.add_ammo(ammo_type, amount)
    collect()

func collect() -> void:
    mesh.visible = false
    collision.set_deferred("disabled", true)
    if respawn_time > 0:
        await get_tree().create_timer(respawn_time).timeout
        mesh.visible = true
        collision.set_deferred("disabled", false)
    else:
        queue_free()
```

### Defold

A pickup is a game object with a trigger collision object. It bobs in `update`, and on `trigger_response` with the player it tells the player to heal or routes ammo through the weapon manager, then disables itself (respawning by timer or deleting).

```lua
-- pickup.script
go.property("kind", hash("health"))   -- health | armor | ammo
go.property("amount", 25)
go.property("ammo_type", hash("pistol"))
go.property("respawn_time", 30)
go.property("bob_speed", 2)
go.property("bob_height", 0.2)

function init(self)
	self.start = go.get_position()
	self.time = 0
	self.collected = false
end

function update(self, dt)
	if self.collected then return end
	self.time = self.time + dt
	local p = self.start
	go.set_position(vmath.vector3(p.x, p.y + math.sin(self.time * self.bob_speed) * self.bob_height, p.z))
	go.set_rotation(vmath.quat_rotation_y(self.time))
end

local function collect(self)
	self.collected = true
	msg.post("#sprite", "disable")
	msg.post("#collision", "disable")
	if self.respawn_time > 0 then
		timer.delay(self.respawn_time, false, function()
			self.collected = false
			msg.post("#sprite", "enable")
			msg.post("#collision", "enable")
		end)
	else
		go.delete()
	end
end

function on_message(self, message_id, message, sender)
	if message_id == hash("trigger_response") and message.enter and not self.collected then
		if message.other_group == hash("player") then
			if self.kind == hash("ammo") then
				msg.post("/player#weapon_manager", "add_ammo", { type = self.ammo_type, amount = self.amount })
			else
				msg.post(message.other_id, self.kind == hash("armor") and "add_armor" or "heal", { amount = self.amount })
			end
			collect(self)
		end
	end
end
```

### Head Bob Effect
```gdscript
# Add to FPS player script
var bob_time: float = 0.0
const BOB_FREQUENCY: float = 2.0
const BOB_AMPLITUDE: float = 0.05

func apply_head_bob(delta: float) -> void:
    if is_on_floor() and velocity.length() > 0.1:
        bob_time += delta * velocity.length()
        camera.position.y = sin(bob_time * BOB_FREQUENCY) * BOB_AMPLITUDE
    else:
        camera.position.y = lerpf(camera.position.y, 0.0, delta * 10.0)
```

### Defold

Offset the child camera object's local y by a sine of accumulated bob time while moving, and lerp it back to rest when still. Drive `speed` from the player's actual move each frame.

```lua
-- head_bob.script  (attached to the camera child object)
go.property("bob_frequency", 2)
go.property("bob_amplitude", 0.05)

function init(self)
	self.bob_time = 0
	self.rest_y = go.get_position().y
	self.speed = 0
end

function update(self, dt)
	local p = go.get_position()
	if self.speed > 0.1 then
		self.bob_time = self.bob_time + dt * self.speed
		p.y = self.rest_y + math.sin(self.bob_time * self.bob_frequency) * self.bob_amplitude
	else
		p.y = vmath.lerp(math.min(1, dt * 10), p.y, self.rest_y)
	end
	go.set_position(p)
end

function on_message(self, message_id, message, sender)
	if message_id == hash("set_speed") then
		self.speed = message.speed   -- player posts its horizontal speed each frame
	end
end
```

---

## Level Structure

```
FPSLevel (Node3D)
├── WorldEnvironment
├── DirectionalLight3D (sun)
├── NavigationRegion3D
│   └── LevelGeometry
├── Player (spawn point)
├── Enemies
│   ├── EnemyPatrol, EnemyRanged
│   └── EnemySpawner (wave mode)
├── Pickups
│   ├── HealthPack, ArmorPickup, AmmoBox
├── Doors
│   ├── KeyDoor (requires key)
│   └── SwitchDoor (requires button)
├── Triggers
│   ├── LevelEndTrigger
│   └── AmbushTrigger
└── Audio
    ├── AmbientSound
    └── MusicPlayer
```

---

## Customization Options

**Sub-Genre**:
- Arena (Doom, Quake)
- Tactical (Counter-Strike)
- Looter (Borderlands)
- Horror (Resident Evil)
- Retro (ULTRAKILL)

**Weapons**:
- Pistol only (survival)
- Pistol + Shotgun
- Full arsenal (pistol, shotgun, rifle, rocket launcher)
- Melee focused (sword, axe)

**Enemy Types**:
- Melee rushers (zombies)
- Ranged soldiers
- Mixed combat
- Boss battles

**Level Style**:
- Linear missions
- Arena/wave survival
- Open exploration
- Procedural generation

**Health System**:
- Regenerating (modern)
- Pickups only (classic)
- Limited lives
- Hardcore (no saves)

---

**Remember**: FPS games need responsive mouse look, satisfying weapon feedback (recoil, sound, particles), varied enemy AI, and clear level readability. Always include a crosshair and make ammo/health pickups visible.
