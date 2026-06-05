---
name: roguelike-template
description: Roguelike/roguelite template with procedural generation, permadeath, item randomization, and meta-progression. Use for games like Hades, Dead Cells, Slay the Spire, or Enter the Gungeon.
---

# Roguelike Template

Production-ready roguelike/roguelite template with procedural generation and run-based progression.

## Verified Reference Implementation

A complete, dependency-free, **headless-tested** reference for this genre ships in the gd-skills repo at `samples/web/roguelike/`: the pure mechanics live in `logic.js` (run `node test.js` — 15 passing assert groups) split from rendering/input in `game.js`. Mirror that split when you generate — it keeps the core loop unit-testable, and the autonomous-validation loop can trace generated logic against this known-good reference. See each sample's `PROMPT.md` (the spec) and `NOTES.md` (verified vs visual).

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

### Defold

The run manager is a single controller script. Run stats are a plain Lua table; the seed feeds `math.randomseed` so a run is reproducible. Permadeath is just `end_run`: the run goes inactive, meta-currency is awarded by messaging the meta-progression object, and a `run_ended` broadcast lets the rest of the game reset. No singletons or inheritance — other systems message this one.

```lua
go.property("max_floors", 10)

local MSG_RUN_STARTED = hash("run_started")
local MSG_FLOOR_CHANGED = hash("floor_changed")
local MSG_RUN_ENDED = hash("run_ended")

function init(self)
	self.current_seed = 0
	self.current_floor = 0
	self.is_run_active = false
	self.run_stats = {}
end

local function advance_floor(self)
	self.current_floor = self.current_floor + 1
	if self.current_floor > self.max_floors then
		msg.post("#", "end_run", { victory = true })
		return
	end
	self.run_stats.floors_cleared = self.current_floor
	msg.post("#", MSG_FLOOR_CHANGED, { floor = self.current_floor })
end

local function start_run(self, custom_seed)
	self.current_seed = (custom_seed and custom_seed ~= 0) and custom_seed or os.time()
	math.randomseed(self.current_seed)
	self.current_floor = 0
	self.is_run_active = true
	self.run_stats = {
		kills = 0, damage_dealt = 0, damage_taken = 0,
		items_collected = 0, gold_earned = 0,
		time_start = socket.gettime(), floors_cleared = 0,
	}
	msg.post("#", MSG_RUN_STARTED, { seed = self.current_seed })
	advance_floor(self)
end

local function calculate_meta_currency(self)
	local base = self.run_stats.floors_cleared * 10
	if self.run_stats.victory then base = base * 3 end
	return base + self.run_stats.kills
end

local function end_run(self, victory)
	self.is_run_active = false
	self.run_stats.victory = victory
	self.run_stats.time_elapsed = socket.gettime() - self.run_stats.time_start
	self.run_stats.seed = self.current_seed
	local currency = calculate_meta_currency(self)
	self.run_stats.meta_currency = currency
	msg.post("/meta#controller", "add_currency", { amount = currency })
	msg.post("#", MSG_RUN_ENDED, { victory = victory, stats = self.run_stats })
end

function on_message(self, message_id, message, sender)
	if message_id == hash("start_run") then
		start_run(self, message.seed)
	elseif message_id == hash("advance_floor") then
		advance_floor(self)
	elseif message_id == hash("end_run") then
		end_run(self, message.victory)
	elseif message_id == hash("add_kill") then
		self.run_stats.kills = (self.run_stats.kills or 0) + 1
	elseif message_id == hash("add_gold") then
		self.run_stats.gold_earned = (self.run_stats.gold_earned or 0) + message.amount
	end
end
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

### Defold

Rooms are plain Lua tables on a coarse grid (no `RoomData` class — composition, not inheritance). The walk drops connected rooms from the start toward a boss; the per-floor seed makes layout deterministic. A grid position is keyed as a string so the placed set is a simple table. The result is sent as a message for the floor builder to spawn rooms via a collection factory.

```lua
go.property("min_rooms", 6)
go.property("max_rooms", 12)
go.property("grid_w", 5)
go.property("grid_h", 5)

local ROOM_TYPES = { combat = 1, treasure = 2, shop = 3, rest = 4, boss = 5, start = 6, elite = 7 }
local DIRS = { {1,0}, {-1,0}, {0,-1} }

local function key(x, y) return x .. "," .. y end

local function is_valid_pos(self, x, y)
	return x >= 1 and x <= self.grid_w and y >= 1 and y <= self.grid_h
end

local function create_room(x, y, type)
	return { x = x, y = y, type = type, connections = {}, enemies = {}, loot = {}, cleared = false }
end

local function pick_room_type(current, total, floor_num)
	if current == total - 2 then return ROOM_TYPES.rest end
	local roll = math.random()
	if roll < 0.5 then return ROOM_TYPES.combat
	elseif roll < 0.65 then return ROOM_TYPES.treasure
	elseif roll < 0.75 then return ROOM_TYPES.shop
	elseif roll < 0.85 and floor_num > 2 then return ROOM_TYPES.elite
	else return ROOM_TYPES.combat end
end

local function get_enemy_set(floor_num, elite)
	local count = elite and 1 or (math.random(2, 4) + math.floor(floor_num / 3))
	local pool = { "slime", "skeleton", "bat", "goblin" }
	if floor_num > 3 then
		pool[#pool + 1] = "mage"; pool[#pool + 1] = "knight"; pool[#pool + 1] = "golem"
	end
	if elite then pool = { "elite_knight", "elite_mage", "mini_boss" } end
	local enemies = {}
	for _ = 1, count do enemies[#enemies + 1] = pool[math.random(#pool)] end
	return enemies
end

local function get_boss(floor_num)
	local bosses = { "slime_king", "skeleton_lord", "dragon", "lich" }
	return bosses[math.min(math.floor(floor_num / 3) + 1, #bosses)]
end

local function populate_rooms(rooms, floor_num)
	for _, room in ipairs(rooms) do
		if room.type == ROOM_TYPES.combat then
			room.enemies = get_enemy_set(floor_num, false)
		elseif room.type == ROOM_TYPES.elite then
			room.enemies = get_enemy_set(floor_num, true)
		elseif room.type == ROOM_TYPES.boss then
			room.enemies = { get_boss(floor_num) }
		end
	end
end

local function generate(self, floor_num, floor_seed)
	math.randomseed(floor_seed + floor_num)
	local rooms = {}
	local placed = {}

	local sx, sy = math.floor(self.grid_w / 2) + 1, self.grid_h
	local start_room = create_room(sx, sy, ROOM_TYPES.start)
	rooms[#rooms + 1] = start_room
	placed[key(sx, sy)] = start_room

	local room_count = math.random(self.min_rooms, self.max_rooms)
	local cx, cy = sx, sy
	local attempts = 0
	while #rooms < room_count and attempts < 100 do
		attempts = attempts + 1
		local d = DIRS[math.random(#DIRS)]
		local nx, ny = cx + d[1], cy + d[2]
		if is_valid_pos(self, nx, ny) and not placed[key(nx, ny)] then
			local room = create_room(nx, ny, pick_room_type(#rooms, room_count, floor_num))
			table.insert(room.connections, key(cx, cy))
			table.insert(placed[key(cx, cy)].connections, key(nx, ny))
			rooms[#rooms + 1] = room
			placed[key(nx, ny)] = room
			cx, cy = nx, ny
		end
	end

	local bx, by = cx, cy - 1
	if is_valid_pos(self, bx, by) then
		local boss = create_room(bx, by, ROOM_TYPES.boss)
		table.insert(boss.connections, key(cx, cy))
		table.insert(placed[key(cx, cy)].connections, key(bx, by))
		rooms[#rooms + 1] = boss
	end

	populate_rooms(rooms, floor_num)
	return rooms
end

function on_message(self, message_id, message, sender)
	if message_id == hash("generate") then
		local rooms = generate(self, message.floor, message.seed)
		msg.post(sender, "dungeon_generated", { rooms = rooms })
	end
end
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

### Defold

The item pool is a plain Lua list of item tables; each item is data with a rarity, effects, and tags. Weighted selection favors rarer items by a configurable boost and multiplies weight for items that share a tag with already-acquired items (synergy). No class hierarchy — items are just tables registered into the pool.

```lua
local RARITY = { common = 1, uncommon = 2, rare = 3, legendary = 4 }
local RARITY_WEIGHTS = { [1] = 50, [2] = 30, [3] = 15, [4] = 5 }

function init(self)
	self.item_pool = {}        -- list of item tables
	self.acquired = {}         -- id -> true
end

local function register_item(self, item)
	self.item_pool[#self.item_pool + 1] = item
end

local function has_tag(self, tag)
	for _, item in ipairs(self.item_pool) do
		if self.acquired[item.id] then
			for _, t in ipairs(item.tags or {}) do
				if t == tag then return true end
			end
		end
	end
	return false
end

local function weighted_pick(self, pool, rarity_boost)
	local weights = {}
	local total = 0
	for i, item in ipairs(pool) do
		local w = RARITY_WEIGHTS[item.rarity] or 10
		if item.rarity == RARITY.rare or item.rarity == RARITY.legendary then
			w = w + rarity_boost
		end
		for _, tag in ipairs(item.tags or {}) do
			if has_tag(self, tag) then w = w * 1.5 end
		end
		weights[i] = w
		total = total + w
	end
	local roll = math.random() * total
	local cumulative = 0
	for i, item in ipairs(pool) do
		cumulative = cumulative + weights[i]
		if roll <= cumulative then return item, i end
	end
	return pool[#pool], #pool
end

local function get_random_items(self, count, rarity_boost)
	local available = {}
	for _, item in ipairs(self.item_pool) do
		if not self.acquired[item.id] then available[#available + 1] = item end
	end
	local selected = {}
	for _ = 1, count do
		if #available == 0 then break end
		local item, idx = weighted_pick(self, available, rarity_boost or 0)
		selected[#selected + 1] = item
		table.remove(available, idx)
	end
	return selected
end

local function acquire_item(self, item)
	self.acquired[item.id] = true
	msg.post("#", "item_acquired", { id = item.id })
end

function on_message(self, message_id, message, sender)
	if message_id == hash("register_item") then
		register_item(self, message.item)
	elseif message_id == hash("offer_items") then
		local items = get_random_items(self, message.count, message.rarity_boost)
		msg.post(sender, "item_offered", { items = items })
	elseif message_id == hash("acquire_item") then
		acquire_item(self, message.item)
	end
end
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

### Defold

Meta-currency, purchased upgrade levels, and unlocks survive across runs via `sys.save`/`sys.load`. The upgrade tree is a plain Lua table keyed by id. Currency awarded at the end of a run arrives as `add_currency` from the run manager; bonuses are queried by effect so the run manager can apply them at run start.

```lua
local function save_path()
	return sys.get_save_file("roguelike", "meta")
end

local UPGRADE_TREE = {
	max_health = { name = "Vitality", max_level = 5, costs = {50,100,200,400,800}, effect = "health_bonus", values = {10,20,35,50,75} },
	damage = { name = "Strength", max_level = 5, costs = {50,100,200,400,800}, effect = "damage_bonus", values = {5,10,15,25,40} },
	starting_gold = { name = "Inheritance", max_level = 3, costs = {100,250,500}, effect = "gold_bonus", values = {25,50,100} },
	extra_choice = { name = "Luck", max_level = 2, costs = {200,500}, effect = "item_choices", values = {1,2} },
	dash_upgrade = { name = "Agility", max_level = 1, costs = {300}, effect = "dash_count", values = {1} },
}

local function load_progress(self)
	local data = sys.load(save_path())
	self.meta_currency = data.currency or 0
	self.upgrades = data.upgrades or {}
	self.unlocked_items = data.unlocked or {}
end

local function save_progress(self)
	sys.save(save_path(), {
		currency = self.meta_currency,
		upgrades = self.upgrades,
		unlocked = self.unlocked_items,
	})
end

function init(self)
	load_progress(self)
end

local function add_currency(self, amount)
	self.meta_currency = self.meta_currency + amount
	msg.post("#", "currency_changed", { amount = self.meta_currency })
	save_progress(self)
end

local function purchase_upgrade(self, upgrade_id)
	local data = UPGRADE_TREE[upgrade_id]
	local level = self.upgrades[upgrade_id] or 0
	if level >= data.max_level then return false end
	local cost = data.costs[level + 1]
	if self.meta_currency < cost then return false end
	self.meta_currency = self.meta_currency - cost
	self.upgrades[upgrade_id] = level + 1
	msg.post("#", "upgrade_purchased", { id = upgrade_id, level = level + 1 })
	save_progress(self)
	return true
end

local function get_bonus(self, effect)
	local total = 0
	for id, data in pairs(UPGRADE_TREE) do
		if data.effect == effect then
			local level = self.upgrades[id] or 0
			if level > 0 then total = total + data.values[level] end
		end
	end
	return total
end

function on_message(self, message_id, message, sender)
	if message_id == hash("add_currency") then
		add_currency(self, message.amount)
	elseif message_id == hash("purchase_upgrade") then
		local ok = purchase_upgrade(self, message.id)
		msg.post(sender, "purchase_result", { id = message.id, ok = ok })
	elseif message_id == hash("query_bonus") then
		msg.post(sender, "bonus", { effect = message.effect, value = get_bonus(self, message.effect) })
	end
end
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
