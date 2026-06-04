---
name: farming-template
description: Farming/life sim template with crop systems, animal care, NPC relationships, seasons, and town activities. Use for games like Stardew Valley, Harvest Moon, or Animal Crossing.
---

# Farming Template

Production-ready farming/life simulation template with crop, animal, relationship, and seasonal systems.

## When to Use

- Creating farming or life simulation games
- Need crop planting, growing, harvesting mechanics
- Want NPC relationships, gifting, festivals
- Building seasonal gameplay with town activities

## Sub-Genres Supported

1. **Classic Farm** (Stardew Valley) - Crops, animals, mining, relationships
2. **Life Sim** (Animal Crossing) - Town building, collecting, decorating
3. **Fantasy Farm** (Rune Factory) - Farming + dungeon combat
4. **Cozy Survival** (My Time at Portia) - Crafting, building, community

## Core Features

### Player Controller
**Reference**: `player-controllers` skill → Top-Down Controller

Additional farming features:
- Tool usage (hoe, watering can, axe, pickaxe)
- Item placement on grid
- NPC interaction and gifting

### Inventory
**Reference**: `inventory-systems` skill → List Inventory or Grid Inventory

### Combat (if applicable)
**Reference**: `combat-systems` skill → Melee combat (for mine/dungeon)

---

## Farming-Specific Systems

### Crop System
```gdscript
class_name CropSystem
extends Node

signal crop_planted(pos: Vector2i, crop_id: String)
signal crop_grew(pos: Vector2i, stage: int)
signal crop_harvested(pos: Vector2i, crop_id: String, yield_amount: int)
signal crop_died(pos: Vector2i)

var crops: Dictionary = {}  # Vector2i -> CropData

var crop_database: Dictionary = {
    "turnip": {"stages": 3, "days_per_stage": 1, "seasons": ["spring"], "sell_price": 60, "yield": [1, 3]},
    "potato": {"stages": 4, "days_per_stage": 2, "seasons": ["spring"], "sell_price": 80, "yield": [1, 2]},
    "tomato": {"stages": 4, "days_per_stage": 2, "seasons": ["summer"], "sell_price": 100, "yield": [1, 4], "regrows": true},
    "pumpkin": {"stages": 5, "days_per_stage": 2, "seasons": ["fall"], "sell_price": 200, "yield": [1, 1]},
}

func plant(pos: Vector2i, crop_id: String, current_season: String) -> bool:
    if crops.has(pos) or crop_id not in crop_database:
        return false
    var data: Dictionary = crop_database[crop_id]
    if current_season not in data.seasons:
        return false

    crops[pos] = {
        "id": crop_id, "stage": 0, "days_in_stage": 0,
        "watered": false, "fertilized": false
    }
    crop_planted.emit(pos, crop_id)
    return true

func advance_day(current_season: String) -> void:
    var to_remove: Array[Vector2i] = []
    for pos in crops:
        var crop: Dictionary = crops[pos]
        var data: Dictionary = crop_database[crop.id]

        # Check season validity
        if current_season not in data.seasons:
            to_remove.append(pos)
            crop_died.emit(pos)
            continue

        # Grow if watered
        if crop.watered:
            crop.days_in_stage += 1
            var growth_rate: int = data.days_per_stage
            if crop.fertilized:
                growth_rate = maxi(growth_rate - 1, 1)

            if crop.days_in_stage >= growth_rate:
                crop.stage += 1
                crop.days_in_stage = 0
                crop_grew.emit(pos, crop.stage)

        crop.watered = false  # Reset daily

    for pos in to_remove:
        crops.erase(pos)

func water(pos: Vector2i) -> void:
    if crops.has(pos):
        crops[pos].watered = true

func harvest(pos: Vector2i) -> Dictionary:
    if not crops.has(pos):
        return {}
    var crop: Dictionary = crops[pos]
    var data: Dictionary = crop_database[crop.id]

    if crop.stage < data.stages:
        return {}  # Not ready

    var amount: int = randi_range(data.yield[0], data.yield[1])
    var result := {"id": crop.id, "amount": amount, "sell_price": data.sell_price}
    crop_harvested.emit(pos, crop.id, amount)

    if data.get("regrows", false):
        crop.stage = data.stages - 1  # Go back one stage
        crop.days_in_stage = 0
    else:
        crops.erase(pos)

    return result
```

### Unity C# — Crop System
```csharp
public class CropSystem : MonoBehaviour
{
    public event System.Action<Vector2Int, string> CropPlanted;
    public event System.Action<Vector2Int, string, int> CropHarvested;

    [System.Serializable]
    public class CropData
    {
        public string id;
        public int stages = 3;
        public int daysPerStage = 1;
        public string[] seasons;
        public int sellPrice = 60;
        public int minYield = 1, maxYield = 3;
        public bool regrows;
    }

    [SerializeField] private CropData[] cropDatabase;

    private class PlantedCrop
    {
        public string id;
        public int stage;
        public int daysInStage;
        public bool watered;
    }

    private readonly Dictionary<Vector2Int, PlantedCrop> crops = new();

    public bool Plant(Vector2Int pos, string cropId, string currentSeason)
    {
        if (crops.ContainsKey(pos)) return false;
        var data = System.Array.Find(cropDatabase, c => c.id == cropId);
        if (data == null || System.Array.IndexOf(data.seasons, currentSeason) < 0) return false;

        crops[pos] = new PlantedCrop { id = cropId, stage = 0, daysInStage = 0 };
        CropPlanted?.Invoke(pos, cropId);
        return true;
    }

    public void Water(Vector2Int pos) { if (crops.TryGetValue(pos, out var c)) c.watered = true; }

    public (string id, int amount, int price) Harvest(Vector2Int pos)
    {
        if (!crops.TryGetValue(pos, out var crop)) return default;
        var data = System.Array.Find(cropDatabase, c => c.id == crop.id);
        if (crop.stage < data.stages) return default;

        int amount = Random.Range(data.minYield, data.maxYield + 1);
        CropHarvested?.Invoke(pos, crop.id, amount);

        if (data.regrows) { crop.stage = data.stages - 1; crop.daysInStage = 0; }
        else crops.Remove(pos);

        return (crop.id, amount, data.sellPrice);
    }

    public void AdvanceDay(string currentSeason)
    {
        var toRemove = new List<Vector2Int>();
        foreach (var (pos, crop) in crops)
        {
            var data = System.Array.Find(cropDatabase, c => c.id == crop.id);
            if (System.Array.IndexOf(data.seasons, currentSeason) < 0) { toRemove.Add(pos); continue; }
            if (crop.watered) { crop.daysInStage++; if (crop.daysInStage >= data.daysPerStage) { crop.stage++; crop.daysInStage = 0; } }
            crop.watered = false;
        }
        toRemove.ForEach(p => crops.Remove(p));
    }
}
```

### Defold (Crop System)
```lua
-- crops.script — tracks planted crops on a grid, advances stages each game day
-- crop stats live in a plain Lua table; tiles keyed by a "x,y" string
local CROP_DB = {
	turnip = { stages = 3, days_per_stage = 1, seasons = { spring = true }, sell_price = 60, min_yield = 1, max_yield = 3 },
	potato = { stages = 4, days_per_stage = 2, seasons = { spring = true }, sell_price = 80, min_yield = 1, max_yield = 2 },
	tomato = { stages = 4, days_per_stage = 2, seasons = { summer = true }, sell_price = 100, min_yield = 1, max_yield = 4, regrows = true },
}

local MSG_CROP_PLANTED = hash("crop_planted")
local MSG_CROP_GREW = hash("crop_grew")
local MSG_CROP_HARVESTED = hash("crop_harvested")
local MSG_CROP_DIED = hash("crop_died")

local function key(x, y)
	return x .. "," .. y
end

local function plant(self, x, y, crop_id, season)
	local data = CROP_DB[crop_id]
	local k = key(x, y)
	if self.crops[k] or not data or not data.seasons[season] then
		return false
	end
	self.crops[k] = { id = crop_id, stage = 0, days_in_stage = 0, watered = false, fertilized = false }
	msg.post("#controller", MSG_CROP_PLANTED, { x = x, y = y, id = crop_id })
	return true
end

local function water(self, x, y)
	local crop = self.crops[key(x, y)]
	if crop then crop.watered = true end
end

local function harvest(self, x, y)
	local k = key(x, y)
	local crop = self.crops[k]
	if not crop then return nil end
	local data = CROP_DB[crop.id]
	if crop.stage < data.stages then return nil end

	local amount = math.random(data.min_yield, data.max_yield)
	msg.post("#controller", MSG_CROP_HARVESTED, { x = x, y = y, id = crop.id, amount = amount })
	msg.post("#inventory", "add_item", { item = crop.id, amount = amount })

	if data.regrows then
		crop.stage = data.stages - 1
		crop.days_in_stage = 0
	else
		self.crops[k] = nil
	end
	return { id = crop.id, amount = amount, sell_price = data.sell_price }
end

local function advance_day(self, season)
	local dead = {}
	for k, crop in pairs(self.crops) do
		local data = CROP_DB[crop.id]
		if not data.seasons[season] then
			dead[#dead + 1] = k
		elseif crop.watered then
			crop.days_in_stage = crop.days_in_stage + 1
			local rate = crop.fertilized and math.max(1, data.days_per_stage - 1) or data.days_per_stage
			if crop.days_in_stage >= rate and crop.stage < data.stages then
				crop.stage = crop.stage + 1
				crop.days_in_stage = 0
				msg.post("#controller", MSG_CROP_GREW, { key = k, stage = crop.stage })
			end
		end
		crop.watered = false
	end
	for _, k in ipairs(dead) do
		self.crops[k] = nil
		msg.post("#controller", MSG_CROP_DIED, { key = k })
	end
end

function init(self)
	self.crops = {}
end

function on_message(self, message_id, message, sender)
	if message_id == hash("plant") then
		plant(self, message.x, message.y, message.crop_id, message.season)
	elseif message_id == hash("water") then
		water(self, message.x, message.y)
	elseif message_id == hash("harvest") then
		harvest(self, message.x, message.y)
	elseif message_id == hash("advance_day") then
		advance_day(self, message.season)
	end
end
```

### Season/Calendar System
```gdscript
class_name CalendarSystem
extends Node

signal day_changed(day: int)
signal season_changed(season: String)
signal year_changed(year: int)
signal festival_today(festival_name: String)

enum Season { SPRING, SUMMER, FALL, WINTER }

@export var days_per_season: int = 28

var current_day: int = 1
var current_season: Season = Season.SPRING
var current_year: int = 1

var season_names: Array[String] = ["spring", "summer", "fall", "winter"]

var festivals: Dictionary = {
    "spring_13": "Egg Festival",
    "summer_11": "Luau",
    "fall_16": "Harvest Festival",
    "winter_25": "Feast of the Winter Star",
}

func advance_day() -> void:
    current_day += 1

    if current_day > days_per_season:
        current_day = 1
        current_season = (current_season + 1) as Season
        if current_season > Season.WINTER:
            current_season = Season.SPRING
            current_year += 1
            year_changed.emit(current_year)
        season_changed.emit(get_season_name())

    day_changed.emit(current_day)

    # Check for festivals
    var key: String = "%s_%d" % [get_season_name(), current_day]
    if festivals.has(key):
        festival_today.emit(festivals[key])

func get_season_name() -> String:
    return season_names[current_season]

func get_date_string() -> String:
    return "%s %d, Year %d" % [get_season_name().capitalize(), current_day, current_year]
```

### Defold (Season/Calendar System)
```lua
-- calendar.script — rolls day -> season -> year and fires festival messages
go.property("days_per_season", 28)

local SEASONS = { "spring", "summer", "fall", "winter" }
local FESTIVALS = {
	spring_13 = "Egg Festival",
	summer_11 = "Luau",
	fall_16 = "Harvest Festival",
	winter_25 = "Feast of the Winter Star",
}

local MSG_DAY_CHANGED = hash("day_changed")
local MSG_SEASON_CHANGED = hash("season_changed")
local MSG_YEAR_CHANGED = hash("year_changed")
local MSG_FESTIVAL = hash("festival_today")

local function season_name(self)
	return SEASONS[self.season]
end

function init(self)
	self.day = 1
	self.season = 1   -- index into SEASONS
	self.year = 1
end

function on_message(self, message_id, message, sender)
	if message_id ~= hash("advance_day") then return end

	self.day = self.day + 1
	if self.day > self.days_per_season then
		self.day = 1
		self.season = self.season + 1
		if self.season > #SEASONS then
			self.season = 1
			self.year = self.year + 1
			msg.post("#controller", MSG_YEAR_CHANGED, { year = self.year })
		end
		msg.post("#controller", MSG_SEASON_CHANGED, { season = season_name(self) })
	end

	msg.post("#controller", MSG_DAY_CHANGED, { day = self.day })
	-- crops advance with the new day
	msg.post("/farm#crops", "advance_day", { season = season_name(self) })

	local festival = FESTIVALS[season_name(self) .. "_" .. self.day]
	if festival then
		msg.post("#controller", MSG_FESTIVAL, { name = festival })
	end
end
```

### NPC Relationship System
```gdscript
class_name RelationshipSystem
extends Node

signal friendship_changed(npc_id: String, points: int, level: int)
signal new_heart_level(npc_id: String, level: int)

var friendships: Dictionary = {}  # npc_id -> {points, max_points}

const POINTS_PER_HEART: int = 250
const MAX_HEARTS: int = 10

var gift_preferences: Dictionary = {
    "mayor": {"loved": ["wine", "truffle"], "liked": ["cheese"], "disliked": ["clay"]},
    "blacksmith": {"loved": ["gold_bar", "diamond"], "liked": ["iron_bar"], "disliked": ["flower"]},
}

func init_npc(npc_id: String) -> void:
    friendships[npc_id] = {"points": 0, "max_points": MAX_HEARTS * POINTS_PER_HEART}

func give_gift(npc_id: String, item_id: String) -> String:
    if npc_id not in friendships:
        return "unknown"

    var prefs: Dictionary = gift_preferences.get(npc_id, {})
    var reaction: String
    var points: int

    if item_id in prefs.get("loved", []):
        reaction = "loved"
        points = 80
    elif item_id in prefs.get("liked", []):
        reaction = "liked"
        points = 45
    elif item_id in prefs.get("disliked", []):
        reaction = "disliked"
        points = -20
    else:
        reaction = "neutral"
        points = 20

    add_friendship(npc_id, points)
    return reaction

func add_friendship(npc_id: String, amount: int) -> void:
    var data: Dictionary = friendships[npc_id]
    var old_level: int = get_heart_level(npc_id)
    data.points = clampi(data.points + amount, 0, data.max_points)
    var new_level: int = get_heart_level(npc_id)

    friendship_changed.emit(npc_id, data.points, new_level)
    if new_level > old_level:
        new_heart_level.emit(npc_id, new_level)

func get_heart_level(npc_id: String) -> int:
    return friendships[npc_id].points / POINTS_PER_HEART

func talk_to(npc_id: String) -> void:
    add_friendship(npc_id, 20)  # Daily talk bonus
```

### Defold (NPC Relationship System)
```lua
-- relationships.script — gift reactions and heart levels, all data-driven
local POINTS_PER_HEART = 250
local MAX_HEARTS = 10
local MAX_POINTS = POINTS_PER_HEART * MAX_HEARTS

-- gift preferences as a plain Lua table; sets for O(1) lookup
local GIFT_PREFS = {
	mayor = { loved = { wine = true, truffle = true }, liked = { cheese = true }, disliked = { clay = true } },
	blacksmith = { loved = { gold_bar = true, diamond = true }, liked = { iron_bar = true }, disliked = { flower = true } },
}

local MSG_FRIENDSHIP_CHANGED = hash("friendship_changed")
local MSG_NEW_HEART_LEVEL = hash("new_heart_level")

local function heart_level(points)
	return math.floor(points / POINTS_PER_HEART)
end

local function add_friendship(self, npc_id, amount)
	local data = self.friendships[npc_id]
	if not data then return end
	local old_level = heart_level(data.points)
	data.points = math.max(0, math.min(MAX_POINTS, data.points + amount))
	local new_level = heart_level(data.points)
	msg.post("#hud", MSG_FRIENDSHIP_CHANGED, { npc = npc_id, points = data.points, level = new_level })
	if new_level > old_level then
		msg.post("#hud", MSG_NEW_HEART_LEVEL, { npc = npc_id, level = new_level })
	end
end

local function reaction_points(npc_id, item_id)
	local prefs = GIFT_PREFS[npc_id]
	if prefs then
		if prefs.loved and prefs.loved[item_id] then return "loved", 80 end
		if prefs.liked and prefs.liked[item_id] then return "liked", 45 end
		if prefs.disliked and prefs.disliked[item_id] then return "disliked", -20 end
	end
	return "neutral", 20
end

function init(self)
	self.friendships = {}
end

function on_message(self, message_id, message, sender)
	if message_id == hash("init_npc") then
		self.friendships[message.npc] = { points = 0 }
	elseif message_id == hash("give_gift") then
		local reaction, points = reaction_points(message.npc, message.item)
		add_friendship(self, message.npc, points)
		msg.post(sender, "gift_reaction", { npc = message.npc, reaction = reaction })
	elseif message_id == hash("talk_to") then
		add_friendship(self, message.npc, 20)   -- daily talk bonus
	end
end
```

---

## Level Structure

```
FarmWorld (Node2D or Node3D)
├── Calendar/TimeSystem
├── Farm
│   ├── TileMap (soil, grass, paths)
│   ├── CropPlots (grid positions)
│   ├── Buildings (barn, coop, house)
│   └── Animals
├── Town
│   ├── NPCs (with schedules)
│   ├── Shops
│   ├── Community Center
│   └── Festival Grounds
├── Nature Areas
│   ├── Forest
│   ├── Beach
│   ├── Mine (dungeons)
│   └── Lake (fishing)
├── Player
│   ├── Inventory
│   ├── Tools
│   └── Relationships
└── UI
    ├── HUD (time, money, energy)
    ├── Inventory Screen
    └── Calendar/Map
```

---

## Customization Options

**Sub-Genre**:
- Classic Farm (Stardew Valley)
- Life Sim (Animal Crossing)
- Fantasy Farm (Rune Factory)
- Cozy Survival (My Time at Portia)

**Perspective**:
- Top-down 2D (pixel art)
- Isometric 2.5D
- Third-person 3D

**Features**:
- Farming + Animals
- Mining/Dungeon combat
- Fishing
- NPC Romance
- Town building/restoration

---

**Remember**: Farming games thrive on satisfying loops (plant → water → harvest → sell → upgrade), meaningful NPC relationships, and seasonal variety. Make each day feel purposeful with multiple activities competing for the player's limited energy/time.
