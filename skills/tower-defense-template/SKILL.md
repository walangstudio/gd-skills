---
name: tower-defense-template
description: Tower defense template with tower placement, enemy waves, upgrade paths, and economy. Use for games like Bloons TD, Kingdom Rush, or Plants vs Zombies.
---

# Tower Defense Template

Production-ready tower defense template with tower building, wave management, upgrades, and economy.

## When to Use

- Creating tower defense games
- Need tower placement and upgrade systems
- Want enemy wave spawning with pathing
- Building strategic defense gameplay

## Sub-Genres Supported

1. **Classic TD** (Bloons, Kingdom Rush) - Fixed paths, tower placement zones
2. **Maze TD** (Desktop TD) - Players build the maze with towers
3. **Lane Defense** (Plants vs Zombies) - Grid lanes, front-line defense
4. **Auto-battler** (Legion TD) - Unit placement, automated combat
5. **Action TD** (Orcs Must Die) - Third-person combat + traps

## Core Features

### Enemy AI
**Reference**: `enemy-ai-patterns` skill → Patrol AI (path following)

### Combat
**Reference**: `combat-systems` skill → Projectile combat, Health System

---

## Tower Defense-Specific Systems

### Tower System
```gdscript
class_name Tower
extends Node2D

signal enemy_killed(enemy: Node2D)
signal upgraded(new_level: int)

enum TargetMode { FIRST, LAST, STRONGEST, CLOSEST }

@export var tower_name: String = "Arrow Tower"
@export var damage: float = 10.0
@export var fire_rate: float = 1.0  # Shots per second
@export var attack_range: float = 150.0
@export var projectile_scene: PackedScene
@export var target_mode: TargetMode = TargetMode.FIRST
@export var cost: int = 100

var level: int = 1
var max_level: int = 3
var fire_timer: float = 0.0
var current_target: Node2D

var upgrade_costs: Array[int] = [150, 250]
var damage_per_level: Array[float] = [10, 18, 30]
var range_per_level: Array[float] = [150, 170, 200]

@onready var range_area: Area2D = $RangeArea
@onready var sprite: Sprite2D = $Sprite2D

func _ready() -> void:
    update_range_shape()

func _process(delta: float) -> void:
    fire_timer += delta
    if fire_timer >= 1.0 / fire_rate:
        var target: Node2D = find_target()
        if target:
            shoot(target)
            fire_timer = 0.0

func find_target() -> Node2D:
    var enemies: Array[Node2D] = get_enemies_in_range()
    if enemies.is_empty():
        return null

    match target_mode:
        TargetMode.FIRST:
            return get_furthest_along_path(enemies)
        TargetMode.LAST:
            return get_least_along_path(enemies)
        TargetMode.STRONGEST:
            enemies.sort_custom(func(a, b): return a.health > b.health)
            return enemies[0]
        TargetMode.CLOSEST:
            enemies.sort_custom(func(a, b):
                return global_position.distance_to(a.global_position) < global_position.distance_to(b.global_position))
            return enemies[0]
    return enemies[0]

func get_enemies_in_range() -> Array[Node2D]:
    var enemies: Array[Node2D] = []
    for body in range_area.get_overlapping_bodies():
        if body.is_in_group("enemy"):
            enemies.append(body)
    return enemies

func get_furthest_along_path(enemies: Array[Node2D]) -> Node2D:
    var best: Node2D = enemies[0]
    var best_progress: float = 0.0
    for e in enemies:
        if e.has_method("get_path_progress"):
            var p: float = e.get_path_progress()
            if p > best_progress:
                best_progress = p
                best = e
    return best

func get_least_along_path(enemies: Array[Node2D]) -> Node2D:
    var best: Node2D = enemies[0]
    var best_progress: float = 999.0
    for e in enemies:
        if e.has_method("get_path_progress"):
            var p: float = e.get_path_progress()
            if p < best_progress:
                best_progress = p
                best = e
    return best

func shoot(target: Node2D) -> void:
    if projectile_scene:
        var proj: Node2D = projectile_scene.instantiate()
        get_parent().add_child(proj)
        proj.global_position = global_position
        proj.setup(target, damage)

func upgrade() -> bool:
    if level >= max_level:
        return false
    level += 1
    damage = damage_per_level[level - 1]
    attack_range = range_per_level[level - 1]
    update_range_shape()
    upgraded.emit(level)
    return true

func get_upgrade_cost() -> int:
    if level >= max_level:
        return -1
    return upgrade_costs[level - 1]

func get_sell_value() -> int:
    var total_spent: int = cost
    for i in range(level - 1):
        total_spent += upgrade_costs[i]
    return int(total_spent * 0.7)

func update_range_shape() -> void:
    var shape: CircleShape2D = range_area.get_node("CollisionShape2D").shape
    shape.radius = attack_range
```

### Unity C# — Tower System
```csharp
public class Tower : MonoBehaviour
{
    public enum TargetMode { First, Last, Strongest, Closest }

    [Header("Stats")]
    [SerializeField] private string towerName = "Arrow Tower";
    [SerializeField] private float damage = 10f;
    [SerializeField] private float fireRate = 1f;
    [SerializeField] private float attackRange = 5f;
    [SerializeField] private int cost = 100;
    [SerializeField] private TargetMode targetMode = TargetMode.First;
    [SerializeField] private GameObject projectilePrefab;

    [Header("Upgrades")]
    [SerializeField] private int[] upgradeCosts = { 150, 250 };
    [SerializeField] private float[] damagePerLevel = { 10, 18, 30 };
    [SerializeField] private float[] rangePerLevel = { 5, 6, 7 };

    public int Level { get; private set; } = 1;
    public int MaxLevel => 3;
    private float fireTimer;

    private void Update()
    {
        fireTimer += Time.deltaTime;
        if (fireTimer >= 1f / fireRate)
        {
            var target = FindTarget();
            if (target != null) { Shoot(target); fireTimer = 0; }
        }
    }

    private Transform FindTarget()
    {
        var colliders = Physics.OverlapSphere(transform.position, attackRange, LayerMask.GetMask("Enemy"));
        if (colliders.Length == 0) return null;

        return targetMode switch
        {
            TargetMode.Closest => colliders
                .OrderBy(c => Vector3.Distance(transform.position, c.transform.position)).First().transform,
            TargetMode.Strongest => colliders
                .OrderByDescending(c => c.GetComponent<Health>()?.CurrentHP ?? 0).First().transform,
            _ => colliders[0].transform
        };
    }

    private void Shoot(Transform target)
    {
        var proj = Instantiate(projectilePrefab, transform.position, Quaternion.identity);
        proj.GetComponent<Projectile>().Setup(target, damage);
    }

    public bool Upgrade()
    {
        if (Level >= MaxLevel) return false;
        Level++;
        damage = damagePerLevel[Level - 1];
        attackRange = rangePerLevel[Level - 1];
        return true;
    }

    public int GetUpgradeCost() => Level >= MaxLevel ? -1 : upgradeCosts[Level - 1];
}
```

### Wave System
```gdscript
class_name WaveSystem
extends Node

signal wave_started(wave_number: int)
signal wave_completed(wave_number: int)
signal enemy_spawned(enemy: Node2D)
signal all_waves_completed

@export var spawn_path: Path2D

var current_wave: int = 0
var enemies_alive: int = 0
var wave_in_progress: bool = false

var wave_data: Array[Dictionary] = [
    {"enemies": [{"type": "basic", "count": 10, "delay": 0.5}]},
    {"enemies": [{"type": "basic", "count": 15, "delay": 0.4}, {"type": "fast", "count": 5, "delay": 0.3}]},
    {"enemies": [{"type": "basic", "count": 10, "delay": 0.4}, {"type": "tank", "count": 3, "delay": 1.0}]},
    {"enemies": [{"type": "fast", "count": 20, "delay": 0.2}]},
    {"enemies": [{"type": "boss", "count": 1, "delay": 0.0}]},
]

var enemy_scenes: Dictionary = {
    "basic": preload("res://scenes/enemies/basic_enemy.tscn"),
    "fast": preload("res://scenes/enemies/fast_enemy.tscn"),
    "tank": preload("res://scenes/enemies/tank_enemy.tscn"),
    "boss": preload("res://scenes/enemies/boss_enemy.tscn"),
}

func start_wave() -> void:
    if wave_in_progress or current_wave >= wave_data.size():
        return

    wave_in_progress = true
    wave_started.emit(current_wave + 1)

    var wave: Dictionary = wave_data[current_wave]
    for group in wave.enemies:
        for i in range(group.count):
            spawn_enemy(group.type)
            if group.delay > 0:
                await get_tree().create_timer(group.delay).timeout

func spawn_enemy(type: String) -> void:
    var enemy: Node2D = enemy_scenes[type].instantiate()
    enemy.tree_exited.connect(_on_enemy_died)
    spawn_path.get_parent().add_child(enemy)
    enemies_alive += 1
    enemy_spawned.emit(enemy)

func _on_enemy_died() -> void:
    enemies_alive -= 1
    if enemies_alive <= 0 and wave_in_progress:
        wave_in_progress = false
        wave_completed.emit(current_wave + 1)
        current_wave += 1
        if current_wave >= wave_data.size():
            all_waves_completed.emit()
```

### Economy System
```gdscript
class_name TDEconomy
extends Node

signal gold_changed(amount: int)
signal lives_changed(amount: int)
signal game_over

var gold: int = 200
var lives: int = 20

func can_afford(cost: int) -> bool:
    return gold >= cost

func spend(amount: int) -> bool:
    if gold < amount:
        return false
    gold -= amount
    gold_changed.emit(gold)
    return true

func earn(amount: int) -> void:
    gold += amount
    gold_changed.emit(gold)

func lose_life(amount: int = 1) -> void:
    lives -= amount
    lives_changed.emit(lives)
    if lives <= 0:
        game_over.emit()

func get_wave_bonus(wave_number: int) -> int:
    return 50 + wave_number * 25
```

---

## Level Structure

```
TDLevel (Node2D)
├── Map (TileMap or sprite background)
├── EnemyPath (Path2D)
│   └── Waypoints
├── TowerPlacementZones (Area2D)
├── Towers (placed by player)
├── Enemies (spawned by WaveSystem)
├── Projectiles
├── WaveSystem
├── Economy
├── UI
│   ├── Gold display
│   ├── Lives display
│   ├── Wave counter
│   ├── Tower shop panel
│   ├── Tower info (upgrade/sell)
│   └── Speed controls (1x, 2x, 3x)
└── Audio
```

---

## Customization Options

**Sub-Genre**:
- Classic TD (Bloons, Kingdom Rush)
- Maze TD (player builds paths)
- Lane Defense (Plants vs Zombies)
- Action TD (Orcs Must Die)

**Perspective**:
- Top-down 2D
- Isometric
- Third-person 3D (action TD)

**Features**:
- Tower upgrades (branching paths)
- Hero unit (controllable)
- Special abilities (screen-wide)
- Endless mode
- Co-op multiplayer

---

**Remember**: Tower defense games need clear enemy pathing, satisfying tower placement, meaningful upgrade choices, and escalating challenge. Visual feedback for damage and kills is essential. Always show tower range when selecting.
