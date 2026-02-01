---
name: roguelike-template
description: Roguelike/roguelite template with procedural generation, permadeath, item randomization, and meta-progression. Use for games like Hades, Dead Cells, Slay the Spire, or Enter the Gungeon.
---

# Roguelike Template

Production-ready roguelike/roguelite template with procedural generation and run-based progression.

## When to Use

- Creating roguelike or roguelite games
- Need procedural dungeon/level generation
- Want permadeath with meta-progression between runs
- Building run-based gameplay with randomized items/abilities

## Sub-Genres Supported

1. **Action Roguelike** (Hades, Dead Cells) - Real-time combat, room clearing
2. **Deckbuilder** (Slay the Spire, Monster Train) - Card-based runs
3. **Bullet Hell** (Enter the Gungeon, Nuclear Throne) - Dodge-focused, weapon variety
4. **Traditional** (Nethack, Caves of Qud) - Turn-based, grid movement
5. **Auto-battler** (Vampire Survivors, Brotato) - Automated combat, build choices

## Core Features

### Player Controller
**Reference**: `player-controllers` skill → Top-Down Controller or Third-Person Controller

### Combat
**Reference**: `combat-systems` skill → Melee + Ranged + Magic/Ability System

### Inventory
**Reference**: `inventory-systems` skill → List Inventory (limited per-run slots)

### Audio
**Reference**: `audio-systems` skill → Per-floor music, combat intensity

### Camera
**Reference**: `camera-systems` skill → Top-Down Follow or Side-Scroll

---

## Roguelike-Specific Systems

### Run Manager
```gdscript
class_name RunManager
extends Node

signal run_started(seed: int)
signal floor_changed(floor_num: int)
signal run_ended(victory: bool, stats: Dictionary)

var current_seed: int = 0
var current_floor: int = 0
var max_floors: int = 10
var is_run_active: bool = false
var run_stats: Dictionary = {}

func start_run(custom_seed: int = 0) -> void:
	current_seed = custom_seed if custom_seed != 0 else randi()
	seed(current_seed)
	current_floor = 0
	is_run_active = true
	run_stats = {
		"kills": 0, "damage_dealt": 0, "damage_taken": 0,
		"items_collected": 0, "gold_earned": 0,
		"time_start": Time.get_ticks_msec(), "floors_cleared": 0
	}
	run_started.emit(current_seed)
	advance_floor()

func advance_floor() -> void:
	current_floor += 1
	if current_floor > max_floors:
		end_run(true)
		return
	run_stats.floors_cleared = current_floor
	floor_changed.emit(current_floor)

func end_run(victory: bool) -> void:
	is_run_active = false
	run_stats["victory"] = victory
	run_stats["time_elapsed"] = (Time.get_ticks_msec() - run_stats.time_start) / 1000.0
	run_stats["seed"] = current_seed

	# Award meta-currency
	var currency: int = calculate_meta_currency()
	run_stats["meta_currency"] = currency
	MetaProgression.add_currency(currency)

	run_ended.emit(victory, run_stats)

func calculate_meta_currency() -> int:
	var base: int = run_stats.floors_cleared * 10
	if run_stats.victory:
		base *= 3
	return base + run_stats.kills
```

### Unity C# — Run Manager
```csharp
public class RunManager : MonoBehaviour
{
    public static RunManager Instance { get; private set; }

    public event System.Action<int> RunStarted;
    public event System.Action<int> FloorChanged;
    public event System.Action<bool, RunStats> RunEnded;

    [System.Serializable]
    public class RunStats
    {
        public int kills, damageDealt, damageTaken, itemsCollected, goldEarned, floorsCleared;
        public float timeElapsed;
        public bool victory;
        public int seed, metaCurrency;
    }

    [SerializeField] private int maxFloors = 10;

    public int CurrentFloor { get; private set; }
    public bool IsRunActive { get; private set; }
    private RunStats stats;
    private int currentSeed;
    private float startTime;

    private void Awake() { Instance = this; }

    public void StartRun(int customSeed = 0)
    {
        currentSeed = customSeed != 0 ? customSeed : Random.Range(int.MinValue, int.MaxValue);
        Random.InitState(currentSeed);
        CurrentFloor = 0;
        IsRunActive = true;
        stats = new RunStats();
        startTime = Time.time;
        RunStarted?.Invoke(currentSeed);
        AdvanceFloor();
    }

    public void AdvanceFloor()
    {
        CurrentFloor++;
        if (CurrentFloor > maxFloors) { EndRun(true); return; }
        stats.floorsCleared = CurrentFloor;
        FloorChanged?.Invoke(CurrentFloor);
    }

    public void EndRun(bool victory)
    {
        IsRunActive = false;
        stats.victory = victory;
        stats.timeElapsed = Time.time - startTime;
        stats.seed = currentSeed;
        stats.metaCurrency = stats.floorsCleared * 10 * (victory ? 3 : 1) + stats.kills;
        RunEnded?.Invoke(victory, stats);
    }

    public void AddKill() => stats.kills++;
    public void AddGold(int amount) => stats.goldEarned += amount;
}
```

### Procedural Dungeon Generator
```gdscript
class_name DungeonGenerator
extends Node

signal dungeon_generated(rooms: Array[RoomData])

@export var min_rooms: int = 6
@export var max_rooms: int = 12
@export var room_size: Vector2i = Vector2i(11, 11)
@export var grid_size: Vector2i = Vector2i(5, 5)

var rng := RandomNumberGenerator.new()

class RoomData:
	var grid_pos: Vector2i
	var type: RoomType
	var connections: Array[Vector2i] = []
	var enemies: Array[String] = []
	var loot: Array[String] = []
	var cleared: bool = false

enum RoomType { COMBAT, TREASURE, SHOP, REST, BOSS, START, ELITE }

func generate(floor_num: int, floor_seed: int) -> Array[RoomData]:
	rng.seed = floor_seed + floor_num
	var rooms: Array[RoomData] = []
	var placed: Dictionary = {}  # grid_pos -> RoomData

	# Place start room
	var start_pos := Vector2i(grid_size.x / 2, grid_size.y - 1)
	var start_room := create_room(start_pos, RoomType.START)
	rooms.append(start_room)
	placed[start_pos] = start_room

	# Generate path to boss
	var room_count: int = rng.randi_range(min_rooms, max_rooms)
	var current_pos: Vector2i = start_pos
	var attempts: int = 0

	while rooms.size() < room_count and attempts < 100:
		attempts += 1
		var direction: Vector2i = get_random_direction()
		var next_pos: Vector2i = current_pos + direction

		if not is_valid_pos(next_pos) or placed.has(next_pos):
			continue

		var room_type: RoomType = pick_room_type(rooms.size(), room_count, floor_num)
		var room := create_room(next_pos, room_type)

		# Connect rooms
		room.connections.append(current_pos)
		placed[current_pos].connections.append(next_pos)

		rooms.append(room)
		placed[next_pos] = room
		current_pos = next_pos

	# Place boss room at furthest point
	var boss_room := create_room(current_pos + Vector2i(0, -1), RoomType.BOSS)
	if is_valid_pos(boss_room.grid_pos):
		boss_room.connections.append(current_pos)
		placed[current_pos].connections.append(boss_room.grid_pos)
		rooms.append(boss_room)

	populate_rooms(rooms, floor_num)
	dungeon_generated.emit(rooms)
	return rooms

func create_room(pos: Vector2i, type: RoomType) -> RoomData:
	var room := RoomData.new()
	room.grid_pos = pos
	room.type = type
	return room

func pick_room_type(current: int, total: int, floor_num: int) -> RoomType:
	var roll: float = rng.randf()
	if current == total - 2:
		return RoomType.REST  # Rest before boss
	if roll < 0.5:
		return RoomType.COMBAT
	elif roll < 0.65:
		return RoomType.TREASURE
	elif roll < 0.75:
		return RoomType.SHOP
	elif roll < 0.85 and floor_num > 2:
		return RoomType.ELITE
	else:
		return RoomType.COMBAT

func populate_rooms(rooms: Array[RoomData], floor_num: int) -> void:
	for room in rooms:
		match room.type:
			RoomType.COMBAT:
				room.enemies = get_enemy_set(floor_num, false)
				room.loot = get_loot(floor_num, "combat")
			RoomType.ELITE:
				room.enemies = get_enemy_set(floor_num, true)
				room.loot = get_loot(floor_num, "elite")
			RoomType.TREASURE:
				room.loot = get_loot(floor_num, "treasure")
			RoomType.BOSS:
				room.enemies = [get_boss(floor_num)]
				room.loot = get_loot(floor_num, "boss")

func get_enemy_set(floor_num: int, elite: bool) -> Array[String]:
	var count: int = rng.randi_range(2, 4) + floor_num / 3
	if elite:
		count = 1
	var enemies: Array[String] = []
	var pool: Array[String] = ["slime", "skeleton", "bat", "goblin"]
	if floor_num > 3:
		pool.append_array(["mage", "knight", "golem"])
	if elite:
		pool = ["elite_knight", "elite_mage", "mini_boss"]
	for i in count:
		enemies.append(pool[rng.randi() % pool.size()])
	return enemies

func get_boss(floor_num: int) -> String:
	var bosses: Array[String] = ["slime_king", "skeleton_lord", "dragon", "lich"]
	return bosses[mini(floor_num / 3, bosses.size() - 1)]

func get_loot(floor_num: int, source: String) -> Array[String]:
	return []  # Filled by ItemRandomizer

func get_random_direction() -> Vector2i:
	var dirs: Array[Vector2i] = [Vector2i(1, 0), Vector2i(-1, 0), Vector2i(0, -1)]
	return dirs[rng.randi() % dirs.size()]

func is_valid_pos(pos: Vector2i) -> bool:
	return pos.x >= 0 and pos.x < grid_size.x and pos.y >= 0 and pos.y < grid_size.y
```

### Item/Ability Randomization
```gdscript
class_name ItemRandomizer
extends Node

signal item_offered(items: Array[ItemData])
signal item_acquired(item: ItemData)

enum Rarity { COMMON, UNCOMMON, RARE, LEGENDARY }

var rng := RandomNumberGenerator.new()
var item_pool: Array[ItemData] = []
var acquired_items: Array[String] = []

var rarity_weights: Dictionary = {
	Rarity.COMMON: 50,
	Rarity.UNCOMMON: 30,
	Rarity.RARE: 15,
	Rarity.LEGENDARY: 5
}

class ItemData:
	var id: String
	var name: String
	var description: String
	var rarity: Rarity
	var icon: Texture2D
	var effects: Dictionary = {}  # "damage_bonus": 10, "speed_mult": 1.2
	var tags: Array[String] = []  # For synergy tracking

func register_item(item: ItemData) -> void:
	item_pool.append(item)

func get_random_items(count: int, rarity_boost: float = 0.0) -> Array[ItemData]:
	var available: Array[ItemData] = item_pool.filter(
		func(item): return item.id not in acquired_items
	)
	if available.is_empty():
		return []

	var selected: Array[ItemData] = []
	for i in count:
		var item: ItemData = weighted_pick(available, rarity_boost)
		if item:
			selected.append(item)
			available.erase(item)
	return selected

func weighted_pick(pool: Array[ItemData], rarity_boost: float) -> ItemData:
	var total_weight: float = 0.0
	var weights: Array[float] = []
	for item in pool:
		var w: float = rarity_weights.get(item.rarity, 10)
		if item.rarity == Rarity.RARE or item.rarity == Rarity.LEGENDARY:
			w += rarity_boost
		# Synergy bonus: items matching existing tags get weight boost
		for tag in item.tags:
			if has_tag(tag):
				w *= 1.5
		weights.append(w)
		total_weight += w

	var roll: float = rng.randf() * total_weight
	var cumulative: float = 0.0
	for i in pool.size():
		cumulative += weights[i]
		if roll <= cumulative:
			return pool[i]
	return pool.back()

func acquire_item(item: ItemData) -> void:
	acquired_items.append(item.id)
	item_acquired.emit(item)

func has_tag(tag: String) -> bool:
	for item_id in acquired_items:
		for item in item_pool:
			if item.id == item_id and tag in item.tags:
				return true
	return false
```

### Meta-Progression
```gdscript
class_name MetaProgression
extends Node

signal currency_changed(amount: int)
signal upgrade_purchased(upgrade_id: String, level: int)
signal item_unlocked(item_id: String)

const SAVE_PATH: String = "user://meta_progress.save"

var meta_currency: int = 0
var upgrades: Dictionary = {}  # id -> current_level
var unlocked_items: Array[String] = []

var upgrade_tree: Dictionary = {
	"max_health": {"name": "Vitality", "max_level": 5, "costs": [50, 100, 200, 400, 800], "effect": "health_bonus", "values": [10, 20, 35, 50, 75]},
	"damage": {"name": "Strength", "max_level": 5, "costs": [50, 100, 200, 400, 800], "effect": "damage_bonus", "values": [5, 10, 15, 25, 40]},
	"starting_gold": {"name": "Inheritance", "max_level": 3, "costs": [100, 250, 500], "effect": "gold_bonus", "values": [25, 50, 100]},
	"extra_choice": {"name": "Luck", "max_level": 2, "costs": [200, 500], "effect": "item_choices", "values": [1, 2]},
	"dash_upgrade": {"name": "Agility", "max_level": 1, "costs": [300], "effect": "dash_count", "values": [1]},
}

func _ready() -> void:
	load_progress()

func add_currency(amount: int) -> void:
	meta_currency += amount
	currency_changed.emit(meta_currency)
	save_progress()

func purchase_upgrade(upgrade_id: String) -> bool:
	var data: Dictionary = upgrade_tree[upgrade_id]
	var level: int = upgrades.get(upgrade_id, 0)
	if level >= data.max_level:
		return false

	var cost: int = data.costs[level]
	if meta_currency < cost:
		return false

	meta_currency -= cost
	upgrades[upgrade_id] = level + 1
	upgrade_purchased.emit(upgrade_id, level + 1)
	save_progress()
	return true

func get_bonus(effect: String) -> float:
	var total: float = 0.0
	for id in upgrade_tree:
		var data: Dictionary = upgrade_tree[id]
		if data.effect == effect:
			var level: int = upgrades.get(id, 0)
			if level > 0:
				total += data.values[level - 1]
	return total

func save_progress() -> void:
	var data := {"currency": meta_currency, "upgrades": upgrades, "unlocked": unlocked_items}
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data))

func load_progress() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file:
		var json := JSON.new()
		if json.parse(file.get_as_text()) == OK:
			meta_currency = json.data.get("currency", 0)
			upgrades = json.data.get("upgrades", {})
			unlocked_items = json.data.get("unlocked", [])
```

---

## Level Structure

```
RoguelikeGame (Node2D or Node3D)
├── RunManager
├── MetaProgression
├── ItemRandomizer
├── DungeonGenerator
├── CurrentFloor
│   ├── Rooms (generated)
│   │   ├── CombatRoom (enemies + reward)
│   │   ├── TreasureRoom (item choices)
│   │   ├── ShopRoom (buy items with gold)
│   │   ├── RestRoom (heal or upgrade)
│   │   ├── EliteRoom (hard fight + rare loot)
│   │   └── BossRoom (floor boss)
│   ├── Minimap
│   └── Transitions
├── Player
│   ├── Stats (modified by meta-progression)
│   ├── Inventory (run-only)
│   └── Abilities (collected this run)
└── UI
    ├── HUD (HP, gold, floor, items)
    ├── ItemChoiceScreen (pick 1 of 3)
    ├── ShopUI
    ├── RunSummary (end of run stats)
    └── MetaUpgradeScreen (between runs)
```

---

## Customization Options

**Sub-Genre**:
- Action (Hades, Dead Cells)
- Deckbuilder (Slay the Spire)
- Bullet Hell (Enter the Gungeon)
- Traditional (turn-based grid)
- Auto-battler (Vampire Survivors)

**Perspective**:
- Top-down 2D
- Side-scrolling 2D
- Third-person 3D

**Run Length**:
- Short (5 floors, 15-20 min)
- Medium (10 floors, 30-45 min)
- Long (20 floors, 60+ min)

**Meta-Progression**:
- Light (permanent stat boosts only)
- Medium (unlockable items + stats)
- Heavy (new characters, starting loadouts, story progression)

**Difficulty Scaling**:
- Linear (steady increase per floor)
- Exponential (harder later floors)
- Adaptive (scales with player performance)

---

**Remember**: Roguelikes need meaningful randomization (every run feels different), impactful choices (items/abilities synergize), satisfying progression (meta-unlocks keep players coming back), and fair difficulty (deaths should feel learnable, not cheap).
