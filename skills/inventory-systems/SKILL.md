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
