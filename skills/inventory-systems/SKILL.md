---
name: inventory-systems
description: Reusable inventory implementations (grid, list, weight-based, equipment slots). Reference from genre templates.
---

# Inventory Systems

Production-ready inventory implementations for RPG, survival, and farming games.

## When to Use

Referenced by genre templates that need inventory:
- **RPG Template** → Equipment slots + grid/list inventory
- **Survival Template** → Weight-based + crafting
- **Farming Template** → Tool belt + storage

---

## Simple List Inventory

Basic inventory with stacking items.

### Godot
```gdscript
class_name ListInventory
extends Node

signal item_added(item: ItemData, slot: int)
signal item_removed(item: ItemData, slot: int)
signal inventory_changed

@export var max_slots: int = 20

var slots: Array[InventorySlot] = []

class InventorySlot:
    var item: ItemData
    var quantity: int = 0

func _ready() -> void:
    for i in max_slots:
        slots.append(InventorySlot.new())

func add_item(item: ItemData, amount: int = 1) -> int:
    # Try to stack with existing
    for i in slots.size():
        if slots[i].item == item and slots[i].quantity < item.max_stack:
            var can_add := mini(amount, item.max_stack - slots[i].quantity)
            slots[i].quantity += can_add
            amount -= can_add
            item_added.emit(item, i)
            if amount <= 0:
                inventory_changed.emit()
                return 0

    # Add to empty slots
    for i in slots.size():
        if slots[i].item == null:
            var can_add := mini(amount, item.max_stack)
            slots[i].item = item
            slots[i].quantity = can_add
            amount -= can_add
            item_added.emit(item, i)
            if amount <= 0:
                inventory_changed.emit()
                return 0

    inventory_changed.emit()
    return amount  # Return leftover

func remove_item(slot: int, amount: int = 1) -> ItemData:
    if slot >= slots.size() or slots[slot].item == null:
        return null

    var item := slots[slot].item
    slots[slot].quantity -= amount

    if slots[slot].quantity <= 0:
        slots[slot].item = null
        slots[slot].quantity = 0

    item_removed.emit(item, slot)
    inventory_changed.emit()
    return item

func has_item(item: ItemData, amount: int = 1) -> bool:
    var count := 0
    for slot in slots:
        if slot.item == item:
            count += slot.quantity
    return count >= amount

func get_item_count(item: ItemData) -> int:
    var count := 0
    for slot in slots:
        if slot.item == item:
            count += slot.quantity
    return count
```

### Item Data Resource
```gdscript
class_name ItemData
extends Resource

@export var id: String
@export var name: String
@export var description: String
@export var icon: Texture2D
@export var max_stack: int = 99
@export var weight: float = 1.0
@export var value: int = 0

enum ItemType { CONSUMABLE, EQUIPMENT, MATERIAL, KEY }
@export var item_type: ItemType
```

### Defold

Store slots as a Lua table on `self`; notify the HUD with a message. Item definitions live in a `require`'d module.

```lua
-- scripts/items.lua  -- shared item definitions
local M = {}

M.defs = {
	potion = { id = "potion", name = "Potion", max_stack = 99, weight = 0.1, item_type = "consumable" },
	sword  = { id = "sword",  name = "Sword",  max_stack = 1,  weight = 5.0, item_type = "equipment" },
}

function M.get(id)
	return M.defs[id]
end

return M

-- list_inventory.script
local items = require("scripts.items")

go.property("max_slots", 20)

local function notify(self)
	msg.post("/hud#gui", "inventory_changed", { slots = self.slots })
end

function init(self)
	self.slots = {}
	for i = 1, self.max_slots do
		self.slots[i] = { item = nil, quantity = 0 }   -- empty slot
	end
end

local function add_item(self, item_id, amount)
	local def = items.get(item_id)
	amount = amount or 1

	-- stack with existing
	for i = 1, self.max_slots do
		local slot = self.slots[i]
		if slot.item == item_id and slot.quantity < def.max_stack then
			local can_add = math.min(amount, def.max_stack - slot.quantity)
			slot.quantity = slot.quantity + can_add
			amount = amount - can_add
			if amount <= 0 then notify(self); return 0 end
		end
	end

	-- fill empty slots
	for i = 1, self.max_slots do
		local slot = self.slots[i]
		if slot.item == nil then
			local can_add = math.min(amount, def.max_stack)
			slot.item = item_id
			slot.quantity = can_add
			amount = amount - can_add
			if amount <= 0 then notify(self); return 0 end
		end
	end

	notify(self)
	return amount   -- leftover that did not fit
end

local function remove_item(self, slot_index, amount)
	local slot = self.slots[slot_index]
	if not slot or slot.item == nil then return nil end

	local removed = slot.item
	slot.quantity = slot.quantity - (amount or 1)
	if slot.quantity <= 0 then
		slot.item = nil
		slot.quantity = 0
	end

	notify(self)
	return removed
end

local function count_item(self, item_id)
	local total = 0
	for i = 1, self.max_slots do
		if self.slots[i].item == item_id then
			total = total + self.slots[i].quantity
		end
	end
	return total
end

function on_message(self, message_id, message, sender)
	if message_id == hash("add_item") then
		add_item(self, message.item_id, message.amount)
	elseif message_id == hash("remove_item") then
		remove_item(self, message.slot, message.amount)
	elseif message_id == hash("query_count") then
		msg.post(sender, "item_count", { item_id = message.item_id, count = count_item(self, message.item_id) })
	end
end
```

---

## Grid Inventory (Resident Evil style)

Items occupy multiple grid cells.

### Godot
```gdscript
class_name GridInventory
extends Node

signal item_placed(item: GridItem, position: Vector2i)
signal item_removed(item: GridItem)

@export var grid_size: Vector2i = Vector2i(10, 6)

var grid: Array = []  # 2D array of item references
var items: Array[GridItem] = []

class GridItem:
    var data: ItemData
    var position: Vector2i
    var size: Vector2i  # e.g., 2x1 for rifle
    var rotated: bool = false

func _ready() -> void:
    # Initialize empty grid
    for x in grid_size.x:
        grid.append([])
        for y in grid_size.y:
            grid[x].append(null)

func can_place(item: GridItem, pos: Vector2i) -> bool:
    var size := item.size if not item.rotated else Vector2i(item.size.y, item.size.x)

    # Check bounds
    if pos.x < 0 or pos.y < 0:
        return false
    if pos.x + size.x > grid_size.x or pos.y + size.y > grid_size.y:
        return false

    # Check overlap
    for x in range(pos.x, pos.x + size.x):
        for y in range(pos.y, pos.y + size.y):
            if grid[x][y] != null:
                return false

    return true

func place_item(item: GridItem, pos: Vector2i) -> bool:
    if not can_place(item, pos):
        return false

    var size := item.size if not item.rotated else Vector2i(item.size.y, item.size.x)
    item.position = pos

    for x in range(pos.x, pos.x + size.x):
        for y in range(pos.y, pos.y + size.y):
            grid[x][y] = item

    items.append(item)
    item_placed.emit(item, pos)
    return true

func remove_item(item: GridItem) -> void:
    var size := item.size if not item.rotated else Vector2i(item.size.y, item.size.x)

    for x in range(item.position.x, item.position.x + size.x):
        for y in range(item.position.y, item.position.y + size.y):
            grid[x][y] = null

    items.erase(item)
    item_removed.emit(item)

func find_space(item: GridItem) -> Vector2i:
    # Find first available space
    for y in grid_size.y:
        for x in grid_size.x:
            if can_place(item, Vector2i(x, y)):
                return Vector2i(x, y)
    return Vector2i(-1, -1)  # No space
```

### Defold

The grid is a 2D Lua table (`self.grid[x][y]`) holding item ids; each item carries its size and position in a table.

```lua
go.property("grid_w", 10)
go.property("grid_h", 6)

function init(self)
	self.grid = {}
	for x = 1, self.grid_w do
		self.grid[x] = {}
		for y = 1, self.grid_h do
			self.grid[x][y] = nil
		end
	end
	self.items = {}
end

local function item_size(item)
	if item.rotated then
		return item.size_h, item.size_w
	end
	return item.size_w, item.size_h
end

local function can_place(self, item, px, py)
	local w, h = item_size(item)
	if px < 1 or py < 1 then return false end
	if px + w - 1 > self.grid_w or py + h - 1 > self.grid_h then return false end
	for x = px, px + w - 1 do
		for y = py, py + h - 1 do
			if self.grid[x][y] ~= nil then return false end
		end
	end
	return true
end

local function place_item(self, item, px, py)
	if not can_place(self, item, px, py) then return false end
	local w, h = item_size(item)
	item.x, item.y = px, py
	for x = px, px + w - 1 do
		for y = py, py + h - 1 do
			self.grid[x][y] = item
		end
	end
	table.insert(self.items, item)
	msg.post("/hud#gui", "inventory_changed", { grid = self.grid })
	return true
end

local function find_space(self, item)
	for y = 1, self.grid_h do
		for x = 1, self.grid_w do
			if can_place(self, item, x, y) then
				return x, y
			end
		end
	end
	return nil   -- no space
end

function on_message(self, message_id, message, sender)
	if message_id == hash("place_item") then
		local x, y = message.x, message.y
		if not x then x, y = find_space(self, message.item) end
		if x then place_item(self, message.item, x, y) end
	end
end
```

---

## Weight-Based Inventory (Survival)

Limited by total weight capacity.

### Godot
```gdscript
class_name WeightInventory
extends Node

signal weight_changed(current: float, maximum: float)
signal encumbered(is_encumbered: bool)

@export var max_weight: float = 100.0
@export var encumbrance_threshold: float = 0.8  # 80%

var items: Dictionary = {}  # item_id -> quantity
var current_weight: float = 0.0

func add_item(item: ItemData, amount: int = 1) -> int:
    var total_weight := item.weight * amount

    if current_weight + total_weight > max_weight:
        # Add what we can
        var can_add := int((max_weight - current_weight) / item.weight)
        if can_add <= 0:
            return amount
        amount = can_add
        total_weight = item.weight * amount

    if items.has(item.id):
        items[item.id] += amount
    else:
        items[item.id] = amount

    current_weight += total_weight
    weight_changed.emit(current_weight, max_weight)
    check_encumbrance()

    return 0

func remove_item(item_id: String, amount: int = 1) -> bool:
    if not items.has(item_id) or items[item_id] < amount:
        return false

    var item := load_item(item_id)  # Your item loading logic
    items[item_id] -= amount
    current_weight -= item.weight * amount

    if items[item_id] <= 0:
        items.erase(item_id)

    weight_changed.emit(current_weight, max_weight)
    check_encumbrance()
    return true

func check_encumbrance() -> void:
    var is_encumbered := current_weight / max_weight >= encumbrance_threshold
    encumbered.emit(is_encumbered)

func get_weight_percent() -> float:
    return current_weight / max_weight
```

### Defold

Track totals in a `item_id -> quantity` table and keep a running weight; broadcast encumbrance changes.

```lua
local items = require("scripts.items")

go.property("max_weight", 100.0)
go.property("encumbrance_threshold", 0.8)   -- 80%

function init(self)
	self.counts = {}            -- item_id -> quantity
	self.current_weight = 0.0
	self.encumbered = false
end

local function check_encumbrance(self)
	local enc = (self.current_weight / self.max_weight) >= self.encumbrance_threshold
	if enc ~= self.encumbered then
		self.encumbered = enc
		msg.post("/hud#gui", "encumbered", { value = enc })
	end
end

local function add_item(self, item_id, amount)
	local def = items.get(item_id)
	amount = amount or 1
	local total = def.weight * amount

	if self.current_weight + total > self.max_weight then
		local can_add = math.floor((self.max_weight - self.current_weight) / def.weight)
		if can_add <= 0 then return amount end
		amount = can_add
		total = def.weight * amount
	end

	self.counts[item_id] = (self.counts[item_id] or 0) + amount
	self.current_weight = self.current_weight + total

	msg.post("/hud#gui", "weight_changed", { current = self.current_weight, max = self.max_weight })
	check_encumbrance(self)
	return 0
end

local function remove_item(self, item_id, amount)
	amount = amount or 1
	local have = self.counts[item_id]
	if not have or have < amount then return false end

	local def = items.get(item_id)
	self.counts[item_id] = have - amount
	self.current_weight = self.current_weight - def.weight * amount
	if self.counts[item_id] <= 0 then self.counts[item_id] = nil end

	msg.post("/hud#gui", "weight_changed", { current = self.current_weight, max = self.max_weight })
	check_encumbrance(self)
	return true
end

function on_message(self, message_id, message, sender)
	if message_id == hash("add_item") then
		add_item(self, message.item_id, message.amount)
	elseif message_id == hash("remove_item") then
		remove_item(self, message.item_id, message.amount)
	end
end
```

---

## Equipment System

Slots for worn gear with stat bonuses.

### Godot
```gdscript
class_name EquipmentSystem
extends Node

signal equipment_changed(slot: EquipSlot, item: ItemData)

enum EquipSlot { HEAD, CHEST, LEGS, FEET, MAIN_HAND, OFF_HAND, ACCESSORY_1, ACCESSORY_2 }

var equipped: Dictionary = {}  # EquipSlot -> ItemData

func equip(slot: EquipSlot, item: ItemData) -> ItemData:
    var previous: ItemData = equipped.get(slot)

    equipped[slot] = item
    equipment_changed.emit(slot, item)
    recalculate_stats()

    return previous  # Return unequipped item

func unequip(slot: EquipSlot) -> ItemData:
    if not equipped.has(slot):
        return null

    var item: ItemData = equipped[slot]
    equipped.erase(slot)
    equipment_changed.emit(slot, null)
    recalculate_stats()

    return item

func get_equipped(slot: EquipSlot) -> ItemData:
    return equipped.get(slot)

func get_total_stat(stat_name: String) -> int:
    var total := 0
    for slot in equipped:
        var item: ItemData = equipped[slot]
        if item and item.has_method("get_stat"):
            total += item.get_stat(stat_name)
    return total

func recalculate_stats() -> void:
    # Emit signals for stat changes
    pass
```

### Equipment Item Data
```gdscript
class_name EquipmentData
extends ItemData

@export var equip_slot: EquipmentSystem.EquipSlot
@export var stats: Dictionary = {}  # "attack": 10, "defense": 5

func get_stat(stat_name: String) -> int:
    return stats.get(stat_name, 0)
```

### Defold

Equipment slots are a table keyed by slot name; each equip returns the previously worn item and triggers a stat recalc.

```lua
local SLOTS = { "head", "chest", "legs", "feet", "main_hand", "off_hand", "accessory_1", "accessory_2" }

function init(self)
	self.equipped = {}          -- slot -> item table { id, stats = { attack = 10, ... } }
end

local function recalculate_stats(self)
	local totals = {}
	for _, item in pairs(self.equipped) do
		for stat, value in pairs(item.stats or {}) do
			totals[stat] = (totals[stat] or 0) + value
		end
	end
	msg.post("/hud#gui", "stats_changed", { stats = totals })
end

local function equip(self, slot, item)
	local previous = self.equipped[slot]
	self.equipped[slot] = item
	msg.post("/hud#gui", "equipment_changed", { slot = slot, item = item })
	recalculate_stats(self)
	return previous              -- caller puts this back in the inventory
end

local function unequip(self, slot)
	local item = self.equipped[slot]
	if not item then return nil end
	self.equipped[slot] = nil
	msg.post("/hud#gui", "equipment_changed", { slot = slot, item = nil })
	recalculate_stats(self)
	return item
end

function on_message(self, message_id, message, sender)
	if message_id == hash("equip") then
		equip(self, message.slot, message.item)
	elseif message_id == hash("unequip") then
		unequip(self, message.slot)
	end
end
```

---

## Quick Slots / Hotbar

Numbered slots for quick access.

### Godot
```gdscript
class_name QuickSlots
extends Node

signal slot_changed(slot: int, item: ItemData)
signal slot_used(slot: int)

@export var num_slots: int = 8

var slots: Array[ItemData] = []
var active_slot: int = 0

func _ready() -> void:
    slots.resize(num_slots)

func _input(event: InputEvent) -> void:
    # Number keys 1-8
    for i in num_slots:
        if event.is_action_pressed("hotbar_%d" % (i + 1)):
            select_slot(i)
            return

    # Scroll wheel
    if event.is_action_pressed("next_slot"):
        select_slot((active_slot + 1) % num_slots)
    elif event.is_action_pressed("prev_slot"):
        select_slot((active_slot - 1 + num_slots) % num_slots)

func assign_item(slot: int, item: ItemData) -> void:
    if slot >= 0 and slot < num_slots:
        slots[slot] = item
        slot_changed.emit(slot, item)

func select_slot(slot: int) -> void:
    active_slot = slot
    slot_used.emit(slot)

func use_active_slot() -> void:
    var item := slots[active_slot]
    if item and item.has_method("use"):
        item.use()
```

### Defold

A fixed-size table of item ids plus an active index. Map hotbar keys in `game.input_binding` and acquire input focus.

```lua
go.property("num_slots", 8)

function init(self)
	msg.post(".", "acquire_input_focus")
	self.slots = {}             -- index -> item_id
	self.active = 1
end

local function select_slot(self, index)
	self.active = index
	msg.post("/hud#gui", "hotbar_selected", { slot = index, item = self.slots[index] })
end

function on_input(self, action_id, action)
	if not action.pressed then return end
	for i = 1, self.num_slots do
		if action_id == hash("hotbar_" .. i) then
			select_slot(self, i)
			return
		end
	end
	if action_id == hash("next_slot") then
		select_slot(self, (self.active % self.num_slots) + 1)
	elseif action_id == hash("prev_slot") then
		select_slot(self, ((self.active - 2 + self.num_slots) % self.num_slots) + 1)
	end
end

function on_message(self, message_id, message, sender)
	if message_id == hash("assign_item") then
		self.slots[message.slot] = message.item_id
		msg.post("/hud#gui", "hotbar_changed", { slot = message.slot, item = message.item_id })
	elseif message_id == hash("use_active") then
		local item_id = self.slots[self.active]
		if item_id then
			msg.post("/player#script", "use_item", { item_id = item_id })
		end
	end
end

function final(self)
	msg.post(".", "release_input_focus")
end
```

---

## Configuration by Genre

| Genre | System | Features |
|-------|--------|----------|
| RPG | Equipment + List | Stats, durability |
| Survival | Weight-based | Crafting, decay |
| Farming | Quick slots | Tool switching |
| Horror | Grid | Limited space |

---

**Reference this skill** from genre templates for inventory implementations.
