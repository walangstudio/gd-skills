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

### Defold

The tower is one script component. Tunables are `go.property`; per-level damage/range tables are plain Lua. It finds targets among enemies that registered in range (via a collision object's `collision_response`, kept in a set) and picks one by mode, then spawns a bullet through a factory. The bullet is told its target and damage by message; the tower never reads the enemy's `self`.

```lua
go.property("damage", 10)
go.property("fire_rate", 1.0)        -- shots per second
go.property("attack_range", 150)
go.property("cost", 100)
go.property("target_mode", hash("first"))   -- first|last|strongest|closest

local UPGRADE_COSTS = { 150, 250 }
local DAMAGE_PER_LEVEL = { 10, 18, 30 }
local RANGE_PER_LEVEL = { 150, 170, 200 }
local MAX_LEVEL = 3

local function dist(a, b)
	return vmath.length(a - b)
end

function init(self)
	self.level = 1
	self.fire_timer = 0
	self.in_range = {}     -- enemy_id -> { progress = n, health = n, pos = v3 }
end

local function find_target(self)
	local best, best_score
	local mode = self.target_mode
	local my_pos = go.get_position()
	for id, e in pairs(self.in_range) do
		local score
		if mode == hash("first") then score = e.progress
		elseif mode == hash("last") then score = -e.progress
		elseif mode == hash("strongest") then score = e.health
		else score = -dist(my_pos, e.pos) end
		if not best_score or score > best_score then
			best_score, best = score, id
		end
	end
	return best
end

local function shoot(self, target_id)
	local proj = factory.create("#projectilefactory", go.get_world_position())
	msg.post(proj, "setup", { target = target_id, damage = self.damage })
end

function update(self, dt)
	self.fire_timer = self.fire_timer + dt
	if self.fire_timer >= 1.0 / self.fire_rate then
		local target = find_target(self)
		if target then
			shoot(self, target)
			self.fire_timer = 0
		end
	end
end

local function upgrade(self)
	if self.level >= MAX_LEVEL then return false end
	self.level = self.level + 1
	self.damage = DAMAGE_PER_LEVEL[self.level]
	self.attack_range = RANGE_PER_LEVEL[self.level]
	msg.post("#", "upgraded", { level = self.level })
	return true
end

local function get_upgrade_cost(self)
	if self.level >= MAX_LEVEL then return -1 end
	return UPGRADE_COSTS[self.level]
end

local function get_sell_value(self)
	local spent = self.cost
	for i = 1, self.level - 1 do spent = spent + UPGRADE_COSTS[i] end
	return math.floor(spent * 0.7)
end

function on_message(self, message_id, message, sender)
	if message_id == hash("enemy_in_range") then
		self.in_range[message.id] = { progress = message.progress, health = message.health, pos = message.pos }
	elseif message_id == hash("enemy_out_of_range") then
		self.in_range[message.id] = nil
	elseif message_id == hash("enemy_state") then
		local e = self.in_range[message.id]
		if e then e.progress, e.health, e.pos = message.progress, message.health, message.pos end
	elseif message_id == hash("upgrade") then
		if upgrade(self) then
			msg.post(sender, "upgrade_ok", { cost = get_upgrade_cost(self) })
		end
	elseif message_id == hash("query_sell_value") then
		msg.post(sender, "sell_value", { value = get_sell_value(self) })
	end
end
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

### Defold

Wave data is a plain Lua table. Spawning is timer-driven in `update` (delay accumulated with `dt`) rather than a coroutine, so it stays frame-rate independent. Enemies come from a pooled factory and are handed the shared waypoint path; each enemy walks the waypoints itself in its own `update`. When an enemy dies it messages the spawner, which advances the wave.

```lua
local WAYPOINTS = {
	vmath.vector3(0, 100, 0), vmath.vector3(200, 100, 0),
	vmath.vector3(200, 300, 0), vmath.vector3(500, 300, 0),
}

local WAVE_DATA = {
	{ { type = "basic", count = 10, delay = 0.5 } },
	{ { type = "basic", count = 15, delay = 0.4 }, { type = "fast", count = 5, delay = 0.3 } },
	{ { type = "basic", count = 10, delay = 0.4 }, { type = "tank", count = 3, delay = 1.0 } },
	{ { type = "fast", count = 20, delay = 0.2 } },
	{ { type = "boss", count = 1, delay = 0.0 } },
}

local FACTORIES = {
	basic = "#basicfactory", fast = "#fastfactory",
	tank = "#tankfactory", boss = "#bossfactory",
}

function init(self)
	self.current_wave = 0
	self.enemies_alive = 0
	self.wave_in_progress = false
	self.spawn_queue = {}     -- flat list of { type, delay } left to spawn
	self.spawn_timer = 0
end

local function spawn_enemy(self, type)
	local id = factory.create(FACTORIES[type], WAYPOINTS[1])
	msg.post(id, "set_path", { waypoints = WAYPOINTS, owner = msg.url() })
	self.enemies_alive = self.enemies_alive + 1
	msg.post("#", "enemy_spawned", { id = id })
end

local function start_wave(self)
	if self.wave_in_progress or self.current_wave >= #WAVE_DATA then return end
	self.wave_in_progress = true
	self.spawn_queue = {}
	for _, group in ipairs(WAVE_DATA[self.current_wave + 1]) do
		for _ = 1, group.count do
			table.insert(self.spawn_queue, { type = group.type, delay = group.delay })
		end
	end
	self.spawn_timer = 0
	msg.post("#", "wave_started", { wave = self.current_wave + 1 })
end

function update(self, dt)
	if #self.spawn_queue == 0 then return end
	self.spawn_timer = self.spawn_timer - dt
	if self.spawn_timer <= 0 then
		local next_enemy = table.remove(self.spawn_queue, 1)
		spawn_enemy(self, next_enemy.type)
		self.spawn_timer = next_enemy.delay
	end
end

function on_message(self, message_id, message, sender)
	if message_id == hash("start_wave") then
		start_wave(self)
	elseif message_id == hash("enemy_died") then
		self.enemies_alive = self.enemies_alive - 1
		if self.enemies_alive <= 0 and self.wave_in_progress and #self.spawn_queue == 0 then
			self.wave_in_progress = false
			msg.post("#", "wave_completed", { wave = self.current_wave + 1 })
			self.current_wave = self.current_wave + 1
			if self.current_wave >= #WAVE_DATA then
				msg.post("#", "all_waves_completed")
			end
		end
	end
end
```

The enemy script walks the shared waypoints, exposing progress so towers can target by furthest-along:

```lua
go.property("speed", 60)

function init(self)
	self.waypoints = nil
	self.index = 1
	self.progress = 0       -- 0..#waypoints, used by tower targeting
end

function update(self, dt)
	if not self.waypoints then return end
	local target = self.waypoints[self.index]
	if not target then return end
	local pos = go.get_position()
	local to = target - pos
	local d = vmath.length(to)
	local step = self.speed * dt
	if d <= step then
		go.set_position(target)
		self.index = self.index + 1
		self.progress = self.index
		if self.index > #self.waypoints then
			msg.post(self.owner, "reached_end", { id = go.get_id() })
		end
	else
		go.set_position(pos + (to / d) * step)
		self.progress = self.index
	end
end

function on_message(self, message_id, message, sender)
	if message_id == hash("set_path") then
		self.waypoints = message.waypoints
		self.owner = message.owner
		self.index = 1
	end
end
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

### Defold

A single economy controller holds gold and lives. Towers and the wave system message it to spend, earn, or report a leak; it replies or broadcasts state changes so the HUD updates without polling. Starting values are `go.property` so they are tunable per level.

```lua
go.property("gold", 200)
go.property("lives", 20)

local MSG_GOLD = hash("gold_changed")
local MSG_LIVES = hash("lives_changed")
local MSG_GAME_OVER = hash("game_over")

local function wave_bonus(wave_number)
	return 50 + wave_number * 25
end

function on_message(self, message_id, message, sender)
	if message_id == hash("can_afford") then
		msg.post(sender, "afford_result", { ok = self.gold >= message.cost, cost = message.cost })
	elseif message_id == hash("spend") then
		if self.gold >= message.amount then
			self.gold = self.gold - message.amount
			msg.post("#", MSG_GOLD, { amount = self.gold })
			msg.post(sender, "spend_ok", { amount = message.amount })
		else
			msg.post(sender, "spend_failed", { amount = message.amount })
		end
	elseif message_id == hash("earn") then
		self.gold = self.gold + message.amount
		msg.post("#", MSG_GOLD, { amount = self.gold })
	elseif message_id == hash("wave_cleared") then
		self.gold = self.gold + wave_bonus(message.wave)
		msg.post("#", MSG_GOLD, { amount = self.gold })
	elseif message_id == hash("lose_life") then
		self.lives = self.lives - (message.amount or 1)
		msg.post("#", MSG_LIVES, { amount = self.lives })
		if self.lives <= 0 then
			msg.post("#", MSG_GAME_OVER)
		end
	end
end
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
