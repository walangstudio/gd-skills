---
name: fps-template
description: Complete first-person shooter template with player controller, weapons, enemy AI, health/ammo systems, and levels. Use for creating FPS games like Doom, Quake, or Call of Duty.
---

# FPS Template

Production-ready first-person shooter template with mouse look, weapons, enemy AI, and level progression.

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
