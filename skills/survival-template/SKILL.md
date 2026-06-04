---
name: survival-template
description: Survival game template with crafting, hunger/thirst, base building, and day/night cycles. Use for games like Rust, Valheim, The Forest, or Subnautica.
---

# Survival Template

Production-ready survival game template with multiple sub-genres.

## When to Use

- Creating survival/crafting games
- Need hunger, thirst, temperature systems
- Want base building and resource gathering
- Building open-world survival gameplay

## Sub-Genres Supported

1. **Wilderness** (The Forest) - Gathering, shelter, hostile environment
2. **Sandbox** (Rust, Valheim) - Multiplayer, base building, PvP/PvE
3. **Underwater** (Subnautica) - Exploration, oxygen, vehicle crafting
4. **Colony** (RimWorld) - Managing multiple survivors
5. **Zombie** (Project Zomboid) - Survival against undead hordes

## Core Features

### Player Controller
**Reference**: `player-controllers` skill → First-Person or Third-Person Controller

Additional survival features:
- Gathering resources (trees, rocks, plants)
- Placing structures (building mode)
- Tool/weapon switching
- Swimming and climbing

### Enemy AI
**Reference**: `enemy-ai-patterns` skill → Patrol AI, Horde AI

Survival-specific threats:
- **Wildlife**: Passive/aggressive animals
- **Environmental**: Weather, temperature, hunger
- **Hostile NPCs**: Raiders, cannibals

### Inventory
**Reference**: `inventory-systems` skill → Weight-Based or Grid Inventory

### Combat
**Reference**: `combat-systems` skill → Melee + Ranged combat

---

## Survival-Specific Systems

### Needs System (Hunger, Thirst, Stamina)
```gdscript
class_name NeedsSystem
extends Node

signal need_changed(need_name: String, current: float, maximum: float)
signal need_critical(need_name: String)
signal need_depleted(need_name: String)

var needs: Dictionary = {}

func _ready() -> void:
    add_need("hunger", 100.0, 1.0)
    add_need("thirst", 100.0, 1.5)
    add_need("stamina", 100.0, 0.0)
    add_need("warmth", 100.0, 0.0)

func add_need(id: String, max_val: float, drain_rate: float) -> void:
    needs[id] = {
        "current": max_val,
        "max": max_val,
        "drain_rate": drain_rate,
        "critical_threshold": 20.0
    }

func _process(delta: float) -> void:
    for id in needs:
        var need: Dictionary = needs[id]
        if need.drain_rate > 0:
            modify(id, -need.drain_rate * delta)

func modify(id: String, amount: float) -> void:
    var need: Dictionary = needs[id]
    need.current = clampf(need.current + amount, 0.0, need.max)
    need_changed.emit(id, need.current, need.max)

    if need.current <= need.critical_threshold:
        need_critical.emit(id)
    if need.current <= 0:
        need_depleted.emit(id)

func get_value(id: String) -> float:
    return needs[id].current

func get_ratio(id: String) -> float:
    return needs[id].current / needs[id].max
```

### Unity C# (Needs System)
```csharp
using UnityEngine;
using UnityEngine.Events;
using System.Collections.Generic;

public class NeedsSystem : MonoBehaviour
{
    [System.Serializable]
    public class Need
    {
        public string id;
        public float current;
        public float max = 100f;
        public float drainRate = 1f;
        public float criticalThreshold = 20f;
    }

    public List<Need> needs = new()
    {
        new() { id = "hunger", drainRate = 1f },
        new() { id = "thirst", drainRate = 1.5f },
        new() { id = "stamina", drainRate = 0f }
    };

    public UnityEvent<string, float, float> OnNeedChanged;
    public UnityEvent<string> OnNeedCritical;

    private void Start() { foreach (var n in needs) n.current = n.max; }

    private void Update()
    {
        foreach (var need in needs)
        {
            if (need.drainRate <= 0) continue;
            Modify(need.id, -need.drainRate * Time.deltaTime);
        }
    }

    public void Modify(string id, float amount)
    {
        var need = needs.Find(n => n.id == id);
        if (need == null) return;
        need.current = Mathf.Clamp(need.current + amount, 0, need.max);
        OnNeedChanged?.Invoke(id, need.current, need.max);
        if (need.current <= need.criticalThreshold) OnNeedCritical?.Invoke(id);
    }
}
```

### Defold (Needs System)
```lua
-- needs.script — drains hunger/thirst/stamina with dt, reports to the HUD
go.property("hunger", 100)
go.property("thirst", 100)
go.property("stamina", 100)

local NEED_MAX = 100
local CRITICAL = 20
local DRAIN = { hunger = 1.0, thirst = 1.5, stamina = 0.0 }

local MSG_NEED_CHANGED = hash("need_changed")
local MSG_NEED_CRITICAL = hash("need_critical")
local MSG_NEED_DEPLETED = hash("need_depleted")

local function value_of(self, id)
	return self.needs[id]
end

local function modify(self, id, amount)
	local v = math.max(0, math.min(NEED_MAX, self.needs[id] + amount))
	self.needs[id] = v
	msg.post("/hud#gui", MSG_NEED_CHANGED, { id = id, current = v, max = NEED_MAX })
	if v <= 0 then
		msg.post("#controller", MSG_NEED_DEPLETED, { id = id })
	elseif v <= CRITICAL then
		msg.post("#controller", MSG_NEED_CRITICAL, { id = id })
	end
end

function init(self)
	self.needs = { hunger = self.hunger, thirst = self.thirst, stamina = self.stamina }
end

function update(self, dt)
	for id, rate in pairs(DRAIN) do
		if rate > 0 then
			modify(self, id, -rate * dt)
		end
	end
end

function on_message(self, message_id, message, sender)
	if message_id == hash("restore_need") then
		modify(self, message.id, message.amount)   -- eat/drink/rest restores
	elseif message_id == hash("get_need") then
		msg.post(sender, "need_value", { id = message.id, value = value_of(self, message.id) })
	end
end
```

### Crafting System
```gdscript
class_name CraftingSystem
extends Node

signal item_crafted(item_id: String)
signal craft_failed(reason: String)

var recipes: Dictionary = {}

func register_recipe(item_id: String, ingredients: Dictionary, craft_time: float = 1.0, station: String = "") -> void:
    recipes[item_id] = {
        "ingredients": ingredients,  # {"wood": 5, "stone": 3}
        "craft_time": craft_time,
        "station": station  # "" = hand-craft, "workbench", "forge"
    }

func can_craft(item_id: String, inventory: Node, current_station: String = "") -> bool:
    if item_id not in recipes:
        return false
    var recipe: Dictionary = recipes[item_id]

    # Check station requirement
    if recipe.station != "" and recipe.station != current_station:
        return false

    # Check ingredients
    for ingredient in recipe.ingredients:
        if inventory.get_item_count(ingredient) < recipe.ingredients[ingredient]:
            return false
    return true

func craft(item_id: String, inventory: Node, current_station: String = "") -> bool:
    if not can_craft(item_id, inventory, current_station):
        craft_failed.emit("Missing ingredients or wrong station")
        return false

    var recipe: Dictionary = recipes[item_id]

    # Consume ingredients
    for ingredient in recipe.ingredients:
        inventory.remove_item(ingredient, recipe.ingredients[ingredient])

    # Add crafted item
    inventory.add_item(item_id, 1)
    item_crafted.emit(item_id)
    return true

func get_available_recipes(inventory: Node, current_station: String = "") -> Array[String]:
    var available: Array[String] = []
    for item_id in recipes:
        if can_craft(item_id, inventory, current_station):
            available.append(item_id)
    return available
```

### Unity C# (Crafting)
```csharp
using UnityEngine;
using UnityEngine.Events;
using System.Collections.Generic;

[System.Serializable]
public class CraftingRecipe
{
    public string itemId;
    public List<Ingredient> ingredients;
    public float craftTime = 1f;
    public string requiredStation = "";
}

[System.Serializable]
public class Ingredient { public string itemId; public int amount; }

public class CraftingSystem : MonoBehaviour
{
    public List<CraftingRecipe> recipes = new();
    public UnityEvent<string> OnItemCrafted;

    public bool CanCraft(string itemId, Inventory inventory, string station = "")
    {
        var recipe = recipes.Find(r => r.itemId == itemId);
        if (recipe == null) return false;
        if (recipe.requiredStation != "" && recipe.requiredStation != station) return false;
        foreach (var ing in recipe.ingredients)
            if (inventory.GetCount(ing.itemId) < ing.amount) return false;
        return true;
    }

    public bool Craft(string itemId, Inventory inventory, string station = "")
    {
        if (!CanCraft(itemId, inventory, station)) return false;
        var recipe = recipes.Find(r => r.itemId == itemId);
        foreach (var ing in recipe.ingredients)
            inventory.Remove(ing.itemId, ing.amount);
        inventory.Add(itemId, 1);
        OnItemCrafted?.Invoke(itemId);
        return true;
    }
}
```

### Defold (Crafting System)
```lua
-- crafting.script — data-driven recipes, consumes from an inventory script via messages
-- recipes are a plain Lua table: item -> { ingredients = {...}, station = "" }
local RECIPES = {
	axe       = { ingredients = { wood = 3, stone = 2 }, craft_time = 1.0, station = "" },
	iron_bar  = { ingredients = { iron_ore = 2 },        craft_time = 2.0, station = "forge" },
	workbench = { ingredients = { wood = 15 },           craft_time = 1.5, station = "" },
}

local MSG_ITEM_CRAFTED = hash("item_crafted")
local MSG_CRAFT_FAILED = hash("craft_failed")

local function can_craft(recipe, counts, station)
	if recipe.station ~= "" and recipe.station ~= station then
		return false
	end
	for item, need in pairs(recipe.ingredients) do
		if (counts[item] or 0) < need then
			return false
		end
	end
	return true
end

function init(self)
	self.station = ""
	self.counts = {}            -- mirror of inventory, refreshed via "inventory_counts"
end

function on_message(self, message_id, message, sender)
	if message_id == hash("set_station") then
		self.station = message.station or ""
	elseif message_id == hash("inventory_counts") then
		self.counts = message.counts          -- inventory script replies with its table
	elseif message_id == hash("craft") then
		local recipe = RECIPES[message.item]
		if not recipe or not can_craft(recipe, self.counts, self.station) then
			msg.post(sender, MSG_CRAFT_FAILED, { item = message.item })
			return
		end
		for item, need in pairs(recipe.ingredients) do
			msg.post("#inventory", "remove_item", { item = item, amount = need })
		end
		msg.post("#inventory", "add_item", { item = message.item, amount = 1 })
		msg.post(sender, MSG_ITEM_CRAFTED, { item = message.item })
	end
end
```

### Base Building System
```gdscript
class_name BuildingSystem
extends Node3D

signal structure_placed(structure: Node3D)
signal structure_destroyed(structure: Node3D)

enum BuildMode { NONE, PLACING, DEMOLISHING }

@export var build_range: float = 10.0
@export var grid_size: float = 1.0
@export var snap_to_grid: bool = true

var mode: BuildMode = BuildMode.NONE
var ghost_structure: Node3D  # Preview of placement
var structures: Array[Node3D] = []

var structure_database: Dictionary = {
    "wall": {"scene": "res://scenes/structures/wall.tscn", "cost": {"wood": 10}},
    "floor": {"scene": "res://scenes/structures/floor.tscn", "cost": {"wood": 8}},
    "door": {"scene": "res://scenes/structures/door.tscn", "cost": {"wood": 6, "iron": 2}},
    "campfire": {"scene": "res://scenes/structures/campfire.tscn", "cost": {"wood": 5, "stone": 3}},
    "workbench": {"scene": "res://scenes/structures/workbench.tscn", "cost": {"wood": 15}},
}

func enter_build_mode(structure_id: String) -> void:
    mode = BuildMode.PLACING
    var data: Dictionary = structure_database[structure_id]
    ghost_structure = load(data.scene).instantiate()
    ghost_structure.set_meta("structure_id", structure_id)
    add_child(ghost_structure)
    # Make transparent for preview
    set_ghost_material(ghost_structure)

func update_ghost_position(camera: Camera3D) -> void:
    if ghost_structure == null:
        return
    var ray_result := get_world_3d().direct_space_state.intersect_ray(
        PhysicsRayQueryParameters3D.create(
            camera.global_position,
            camera.global_position - camera.global_basis.z * build_range
        )
    )
    if ray_result:
        var pos: Vector3 = ray_result.position
        if snap_to_grid:
            pos = pos.snapped(Vector3.ONE * grid_size)
        ghost_structure.global_position = pos

func confirm_placement(inventory: Node) -> bool:
    if ghost_structure == null:
        return false
    var structure_id: String = ghost_structure.get_meta("structure_id")
    var cost: Dictionary = structure_database[structure_id].cost

    # Check resources
    for resource in cost:
        if inventory.get_item_count(resource) < cost[resource]:
            return false

    # Consume resources and place
    for resource in cost:
        inventory.remove_item(resource, cost[resource])

    ghost_structure.set_script(null)  # Remove ghost behavior
    clear_ghost_material(ghost_structure)
    structures.append(ghost_structure)
    structure_placed.emit(ghost_structure)
    ghost_structure = null
    mode = BuildMode.NONE
    return true

func set_ghost_material(node: Node3D) -> void:
    pass  # Apply transparent material

func clear_ghost_material(node: Node3D) -> void:
    pass  # Restore original material
```

### Defold (Base Building System)
```lua
-- builder.script — snaps a ghost to a grid, spawns the real structure via a factory
go.property("grid_size", 1.0)
go.property("snap_to_grid", true)

-- structure data is a Lua table; each factory url builds one structure type
local STRUCTURES = {
	wall      = { factory = "#wall_factory",     cost = { wood = 10 } },
	floor     = { factory = "#floor_factory",    cost = { wood = 8 } },
	campfire  = { factory = "#campfire_factory",  cost = { wood = 5, stone = 3 } },
	workbench = { factory = "#workbench_factory", cost = { wood = 15 } },
}

local MODE_NONE = hash("none")
local MODE_PLACING = hash("placing")
local MSG_STRUCTURE_PLACED = hash("structure_placed")

local function snap(self, pos)
	if not self.snap_to_grid then return pos end
	local g = self.grid_size
	return vmath.vector3(math.floor(pos.x / g + 0.5) * g, pos.y, math.floor(pos.z / g + 0.5) * g)
end

local function affordable(cost, counts)
	for res, amount in pairs(cost) do
		if (counts[res] or 0) < amount then return false end
	end
	return true
end

function init(self)
	self.mode = MODE_NONE
	self.current = nil          -- structure id being placed
	self.ghost_pos = vmath.vector3()
	self.counts = {}
end

function on_message(self, message_id, message, sender)
	if message_id == hash("enter_build_mode") then
		self.mode = MODE_PLACING
		self.current = message.structure
	elseif message_id == hash("inventory_counts") then
		self.counts = message.counts
	elseif message_id == hash("update_ghost") then
		self.ghost_pos = snap(self, message.position)
	elseif message_id == hash("confirm_placement") and self.mode == MODE_PLACING then
		local data = STRUCTURES[self.current]
		if not data or not affordable(data.cost, self.counts) then return end
		for res, amount in pairs(data.cost) do
			msg.post("#inventory", "remove_item", { item = res, amount = amount })
		end
		local id = factory.create(data.factory, self.ghost_pos)
		self.mode = MODE_NONE
		self.current = nil
		msg.post(sender, MSG_STRUCTURE_PLACED, { id = id })
	end
end
```

### Day/Night Cycle
```gdscript
class_name DayNightCycle
extends Node

signal time_changed(hour: float)
signal day_started
signal night_started
signal new_day(day_number: int)

@export var day_length_minutes: float = 20.0  # Real-time minutes per game day
@export var start_hour: float = 8.0
@export var dawn_hour: float = 6.0
@export var dusk_hour: float = 18.0

var current_time: float  # 0-24 hours
var day_count: int = 1
var sun_light: DirectionalLight3D
var environment: WorldEnvironment

func _ready() -> void:
    current_time = start_hour

func _process(delta: float) -> void:
    var hours_per_second: float = 24.0 / (day_length_minutes * 60.0)
    var prev_time := current_time
    current_time += hours_per_second * delta

    if current_time >= 24.0:
        current_time -= 24.0
        day_count += 1
        new_day.emit(day_count)

    # Detect dawn/dusk transitions
    if prev_time < dawn_hour and current_time >= dawn_hour:
        day_started.emit()
    elif prev_time < dusk_hour and current_time >= dusk_hour:
        night_started.emit()

    time_changed.emit(current_time)
    update_lighting()

func update_lighting() -> void:
    if sun_light == null:
        return
    # Rotate sun based on time
    var angle: float = (current_time / 24.0) * 360.0 - 90.0
    sun_light.rotation_degrees.x = angle

    # Adjust intensity: bright midday, dim at dawn/dusk, off at night
    var t: float = current_time
    if t >= dawn_hour and t <= dusk_hour:
        var mid: float = (dawn_hour + dusk_hour) / 2.0
        sun_light.light_energy = 1.0 - absf(t - mid) / (mid - dawn_hour) * 0.5
    else:
        sun_light.light_energy = 0.0

func is_daytime() -> bool:
    return current_time >= dawn_hour and current_time < dusk_hour

func get_formatted_time() -> String:
    var h: int = int(current_time)
    var m: int = int((current_time - h) * 60)
    return "%02d:%02d" % [h, m]
```

### Defold (Day/Night Cycle)
```lua
-- daynight.script — advances a 0..24 clock with dt and rotates the sun light
go.property("day_length_minutes", 20.0)
go.property("start_hour", 8.0)
go.property("dawn_hour", 6.0)
go.property("dusk_hour", 18.0)

local MSG_DAY_STARTED = hash("day_started")
local MSG_NIGHT_STARTED = hash("night_started")
local MSG_NEW_DAY = hash("new_day")

local function sun_energy(self, t)
	if t >= self.dawn_hour and t <= self.dusk_hour then
		local mid = (self.dawn_hour + self.dusk_hour) / 2.0
		return 1.0 - math.abs(t - mid) / (mid - self.dawn_hour) * 0.5
	end
	return 0.0
end

function init(self)
	self.time = self.start_hour
	self.day = 1
end

function update(self, dt)
	local hours_per_second = 24.0 / (self.day_length_minutes * 60.0)
	local prev = self.time
	self.time = self.time + hours_per_second * dt

	if self.time >= 24.0 then
		self.time = self.time - 24.0
		self.day = self.day + 1
		msg.post("#controller", MSG_NEW_DAY, { day = self.day })
	end

	if prev < self.dawn_hour and self.time >= self.dawn_hour then
		msg.post("#controller", MSG_DAY_STARTED)
	elseif prev < self.dusk_hour and self.time >= self.dusk_hour then
		msg.post("#controller", MSG_NIGHT_STARTED)
	end

	-- rotate the sun game object and drive a light constant
	local angle = (self.time / 24.0) * 360.0 - 90.0
	go.set_rotation(vmath.quat_rotation_z(math.rad(angle)), "/sun")
	msg.post("#hud", "set_time", { hour = self.time, energy = sun_energy(self, self.time) })
end
```

### Temperature System
```gdscript
class_name TemperatureSystem
extends Node

signal temperature_changed(body_temp: float, env_temp: float)
signal hypothermia
signal overheating

@export var comfortable_range: Vector2 = Vector2(18.0, 30.0)  # Min, Max celsius
@export var body_temp_change_rate: float = 0.5

var body_temperature: float = 36.5
var environment_temperature: float = 22.0
var heat_sources: Array[Dictionary] = []  # [{position, radius, warmth}]

func _process(delta: float) -> void:
    var target_temp := calculate_effective_temp()

    # Body temp moves toward effective environment temp
    if body_temperature < target_temp:
        body_temperature += body_temp_change_rate * delta
    elif body_temperature > target_temp:
        body_temperature -= body_temp_change_rate * delta

    temperature_changed.emit(body_temperature, environment_temperature)

    if body_temperature < 34.0:
        hypothermia.emit()
    elif body_temperature > 40.0:
        overheating.emit()

func calculate_effective_temp() -> float:
    var temp := environment_temperature
    # Add heat from nearby sources (campfires, etc.)
    for source in heat_sources:
        var player_pos: Vector3 = get_parent().global_position
        var dist: float = player_pos.distance_to(source.position)
        if dist < source.radius:
            var falloff: float = 1.0 - (dist / source.radius)
            temp += source.warmth * falloff
    return temp

func register_heat_source(pos: Vector3, radius: float, warmth: float) -> int:
    heat_sources.append({"position": pos, "radius": radius, "warmth": warmth})
    return heat_sources.size() - 1
```

### Defold (Temperature System)
```lua
-- temperature.script — body temp eases toward the effective env temp every frame
go.property("body_temperature", 36.5)
go.property("environment_temperature", 22.0)
go.property("change_rate", 0.5)

local HYPOTHERMIA = 34.0
local OVERHEAT = 40.0

local MSG_HYPOTHERMIA = hash("hypothermia")
local MSG_OVERHEATING = hash("overheating")

-- heat sources are a plain list of { position, radius, warmth }
local function effective_temp(self)
	local temp = self.environment_temperature
	local here = go.get_position()
	for _, src in ipairs(self.heat_sources) do
		local dist = vmath.length(here - src.position)
		if dist < src.radius then
			temp = temp + src.warmth * (1.0 - dist / src.radius)
		end
	end
	return temp
end

function init(self)
	self.heat_sources = {}
end

function update(self, dt)
	local target = effective_temp(self)
	if self.body_temperature < target then
		self.body_temperature = self.body_temperature + self.change_rate * dt
	elseif self.body_temperature > target then
		self.body_temperature = self.body_temperature - self.change_rate * dt
	end

	if self.body_temperature < HYPOTHERMIA then
		msg.post("#controller", MSG_HYPOTHERMIA)
	elseif self.body_temperature > OVERHEAT then
		msg.post("#controller", MSG_OVERHEATING)
	end
end

function on_message(self, message_id, message, sender)
	if message_id == hash("register_heat_source") then
		table.insert(self.heat_sources, {
			position = message.position, radius = message.radius, warmth = message.warmth,
		})
	end
end
```

---

## Level Structure

```
SurvivalWorld (Node3D)
├── WorldEnvironment
├── DayNightCycle
├── TemperatureSystem
├── NavigationRegion3D
│   └── Terrain
├── Player
│   ├── NeedsSystem
│   ├── CraftingSystem
│   └── BuildingSystem
├── Resources (respawnable)
│   ├── Trees
│   ├── Rocks
│   └── Plants
├── Wildlife
│   ├── PassiveAnimals
│   └── Predators
├── Structures (player-built)
├── Points of Interest
│   ├── Caves
│   ├── Ruins
│   └── Shipwrecks
└── Audio
    ├── Ambient (wind, birds, night sounds)
    └── Music (dynamic based on danger)
```

---

## Customization Options

**Sub-Genre**:
- Wilderness (The Forest)
- Sandbox PvP (Rust)
- Exploration (Subnautica)
- Colony Management (RimWorld)

**Perspective**:
- First-person
- Third-person
- Top-down (colony sim)

**Difficulty**:
- Peaceful (no hostile enemies)
- Normal (balanced threats)
- Hardcore (permadeath, harsh environment)

**Multiplayer**:
- Solo
- Co-op (2-8 players)
- PvPvE (server-based)

**Environment**:
- Forest/Wilderness
- Island
- Underwater
- Arctic
- Desert
- Alien planet

---

**Remember**: Survival games need a strong gameplay loop: Gather → Craft → Build → Explore → Survive. Each day should feel like progress. Balance desperation with empowerment as the player advances.
