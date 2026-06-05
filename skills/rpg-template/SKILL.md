---
name: rpg-template
description: RPG game template with stats, leveling, quests, inventory, and dialogue. Use for games like Skyrim, Final Fantasy, or Stardew Valley.
---

# RPG Template

Production-ready RPG template supporting action, turn-based, and tactics combat.

## Verified Reference Implementation

A complete, dependency-free, **headless-tested** reference for this genre ships in the gd-skills repo at `samples/web/rpg/`: the pure mechanics live in `logic.js` (run `node test.js` — 14 passing assert groups) split from rendering/input in `game.js`. Mirror that split when you generate — it keeps the core loop unit-testable, and the autonomous-validation loop can trace generated logic against this known-good reference. See each sample's `PROMPT.md` (the spec) and `NOTES.md` (verified vs visual).

## When to Use

- Creating role-playing games with character progression
- Need stats, leveling, equipment systems
- Want quests, NPCs, dialogue
- Building open-world or linear RPG

## Sub-Genres Supported

1. **Action RPG** (Skyrim, Dark Souls) - Real-time combat
2. **Turn-Based** (Final Fantasy, Pokemon) - Menu-based combat
3. **Tactics** (Fire Emblem, XCOM) - Grid-based strategy
4. **Action-Adventure** (Zelda) - Light RPG elements

## Core Features

### Player Controller
**Reference**: `player-controllers` skill → Third-Person or Top-Down Controller

### Combat System
**Reference**: `combat-systems` skill → Melee, Ranged, Magic/Ability System

### Inventory & Equipment
**Reference**: `inventory-systems` skill → List Inventory + Equipment System

---

## RPG-Specific Systems

### Character Stats
```gdscript
class_name CharacterStats
extends Resource

signal stat_changed(stat_name: String, new_value: int)
signal level_up(new_level: int)

@export var character_name: String = "Hero"
@export var level: int = 1
@export var experience: int = 0

# Base stats
@export var strength: int = 10
@export var dexterity: int = 10
@export var intelligence: int = 10
@export var vitality: int = 10

# Derived stats
var max_health: int:
    get: return vitality * 10 + level * 5
var max_mana: int:
    get: return intelligence * 5 + level * 3
var attack: int:
    get: return strength * 2 + level
var defense: int:
    get: return vitality + level
var magic_attack: int:
    get: return intelligence * 2 + level

# Experience thresholds
func exp_for_level(lvl: int) -> int:
    return int(100 * pow(lvl, 1.5))

func add_experience(amount: int) -> void:
    experience += amount
    while experience >= exp_for_level(level + 1):
        experience -= exp_for_level(level + 1)
        level_up_character()

func level_up_character() -> void:
    level += 1
    # Grant stat points or auto-increase
    strength += 1
    dexterity += 1
    intelligence += 1
    vitality += 1
    level_up.emit(level)

func get_stat(stat_name: String) -> int:
    match stat_name:
        "strength": return strength
        "dexterity": return dexterity
        "intelligence": return intelligence
        "vitality": return vitality
        "attack": return attack
        "defense": return defense
        _: return 0
```

### Unity C# (Character Stats)
```csharp
using UnityEngine;

[CreateAssetMenu(fileName = "NewCharacter", menuName = "RPG/CharacterStats")]
public class CharacterStats : ScriptableObject
{
    public string characterName = "Hero";
    public int level = 1;
    public int experience;

    public int strength = 10;
    public int dexterity = 10;
    public int intelligence = 10;
    public int vitality = 10;

    public int MaxHealth => vitality * 10 + level * 5;
    public int MaxMana => intelligence * 5 + level * 3;
    public int Attack => strength * 2 + level;
    public int Defense => vitality + level;

    public int ExpForLevel(int lvl) => Mathf.RoundToInt(100 * Mathf.Pow(lvl, 1.5f));

    public void AddExperience(int amount)
    {
        experience += amount;
        while (experience >= ExpForLevel(level + 1))
        {
            experience -= ExpForLevel(level + 1);
            LevelUp();
        }
    }

    private void LevelUp()
    {
        level++;
        strength++; dexterity++; intelligence++; vitality++;
    }
}
```

### Defold

Stats are pure data, so put the math in a `require`'d module (no game object needed) and let a thin character script own one instance. Base stats are tunable via `go.property` on the character; derived stats are computed functions. Leveling consumes experience and posts level_up.

```lua
-- scripts/stats.lua  (shared module, returns a table)
local M = {}

function M.new(base)
	return {
		level = base.level or 1,
		experience = 0,
		strength = base.strength or 10,
		dexterity = base.dexterity or 10,
		intelligence = base.intelligence or 10,
		vitality = base.vitality or 10,
	}
end

function M.max_health(s) return s.vitality * 10 + s.level * 5 end
function M.max_mana(s)   return s.intelligence * 5 + s.level * 3 end
function M.attack(s)     return s.strength * 2 + s.level end
function M.defense(s)    return s.vitality + s.level end

function M.exp_for_level(lvl) return math.floor(100 * (lvl ^ 1.5)) end

-- returns how many levels were gained so the caller can react
function M.add_experience(s, amount)
	s.experience = s.experience + amount
	local gained = 0
	while s.experience >= M.exp_for_level(s.level + 1) do
		s.experience = s.experience - M.exp_for_level(s.level + 1)
		s.level = s.level + 1
		s.strength = s.strength + 1
		s.dexterity = s.dexterity + 1
		s.intelligence = s.intelligence + 1
		s.vitality = s.vitality + 1
		gained = gained + 1
	end
	return gained
end

return M
```

```lua
-- character.script
local stats = require("scripts.stats")

go.property("level", 1)
go.property("strength", 10)
go.property("dexterity", 10)
go.property("intelligence", 10)
go.property("vitality", 10)

function init(self)
	self.stats = stats.new({
		level = self.level, strength = self.strength, dexterity = self.dexterity,
		intelligence = self.intelligence, vitality = self.vitality,
	})
	self.health = stats.max_health(self.stats)
end

function on_message(self, message_id, message, sender)
	if message_id == hash("gain_experience") then
		local levels = stats.add_experience(self.stats, message.amount)
		if levels > 0 then
			self.health = stats.max_health(self.stats)
			msg.post("/hud#gui", "level_up", { level = self.stats.level })
		end
	end
end
```

### Quest System
```gdscript
class_name QuestSystem
extends Node

signal quest_started(quest: Quest)
signal quest_updated(quest: Quest)
signal quest_completed(quest: Quest)

var active_quests: Array[Quest] = []
var completed_quests: Array[String] = []  # Quest IDs

func start_quest(quest: Quest) -> bool:
    if quest.id in completed_quests:
        return false
    if has_quest(quest.id):
        return false

    active_quests.append(quest)
    quest.start()
    quest_started.emit(quest)
    return true

func has_quest(quest_id: String) -> bool:
    for q in active_quests:
        if q.id == quest_id:
            return true
    return false

func update_objective(quest_id: String, objective_id: String, progress: int = 1) -> void:
    for quest in active_quests:
        if quest.id == quest_id:
            quest.update_objective(objective_id, progress)
            quest_updated.emit(quest)

            if quest.is_complete():
                complete_quest(quest)
            return

func complete_quest(quest: Quest) -> void:
    active_quests.erase(quest)
    completed_quests.append(quest.id)
    quest.give_rewards()
    quest_completed.emit(quest)

class Quest:
    var id: String
    var title: String
    var description: String
    var objectives: Array[Objective] = []
    var rewards: Dictionary = {}  # "exp": 100, "gold": 50

    func start() -> void:
        for obj in objectives:
            obj.current = 0

    func update_objective(obj_id: String, progress: int) -> void:
        for obj in objectives:
            if obj.id == obj_id:
                obj.current = mini(obj.current + progress, obj.required)

    func is_complete() -> bool:
        for obj in objectives:
            if obj.current < obj.required:
                return false
        return true

    func give_rewards() -> void:
        if rewards.has("exp"):
            GameManager.player_stats.add_experience(rewards.exp)
        if rewards.has("gold"):
            GameManager.add_gold(rewards.gold)

class Objective:
    var id: String
    var description: String
    var required: int = 1
    var current: int = 0
```

### Defold

The quest log is a controller script plus a plain-data module. Quests are tables of objectives with required/current counts. Gameplay posts quest_progress (for example, on an enemy_killed broadcast); the controller advances the matching objective, and when all are met it grants rewards by posting gain_experience and add_gold, then posts quest_completed.

```lua
-- scripts/quests.lua  (shared module)
local M = {}

function M.is_complete(quest)
	for _, obj in ipairs(quest.objectives) do
		if obj.current < obj.required then return false end
	end
	return true
end

function M.advance(quest, objective_id, amount)
	for _, obj in ipairs(quest.objectives) do
		if obj.id == objective_id then
			obj.current = math.min(obj.current + amount, obj.required)
		end
	end
end

return M
```

```lua
-- quest_log.script
local quests = require("scripts.quests")

function init(self)
	self.active = {}        -- id -> quest table
	self.completed = {}     -- id -> true
end

local function give_rewards(self, quest)
	if quest.rewards.exp then
		msg.post("/player#character", "gain_experience", { amount = quest.rewards.exp })
	end
	if quest.rewards.gold then
		msg.post("/player#inventory", "add_gold", { amount = quest.rewards.gold })
	end
end

function on_message(self, message_id, message, sender)
	if message_id == hash("start_quest") then
		local q = message.quest
		if not self.completed[q.id] and not self.active[q.id] then
			for _, obj in ipairs(q.objectives) do obj.current = 0 end
			self.active[q.id] = q
			msg.post("/hud#gui", "quest_started", { id = q.id, title = q.title })
		end
	elseif message_id == hash("quest_progress") then
		for id, q in pairs(self.active) do
			quests.advance(q, message.objective, message.amount or 1)
			if quests.is_complete(q) then
				self.active[id] = nil
				self.completed[id] = true
				give_rewards(self, q)
				msg.post("/hud#gui", "quest_completed", { id = id })
			end
		end
	end
end
```

### Dialogue System
```gdscript
class_name DialogueSystem
extends CanvasLayer

signal dialogue_started(npc_name: String)
signal dialogue_ended
signal choice_made(choice_index: int)

@onready var panel: Panel = $DialoguePanel
@onready var name_label: Label = $DialoguePanel/NameLabel
@onready var text_label: RichTextLabel = $DialoguePanel/TextLabel
@onready var choices_container: VBoxContainer = $DialoguePanel/ChoicesContainer

var current_dialogue: DialogueData
var current_node: int = 0

func start_dialogue(dialogue: DialogueData) -> void:
    current_dialogue = dialogue
    current_node = 0
    panel.visible = true
    dialogue_started.emit(dialogue.npc_name)
    show_node(0)

func show_node(index: int) -> void:
    var node: DialogueNode = current_dialogue.nodes[index]
    name_label.text = current_dialogue.npc_name
    text_label.text = node.text

    # Clear old choices
    for child in choices_container.get_children():
        child.queue_free()

    # Add choices or continue button
    if node.choices.is_empty():
        var btn := Button.new()
        btn.text = "Continue"
        btn.pressed.connect(func(): advance(node.next))
        choices_container.add_child(btn)
    else:
        for i in node.choices.size():
            var choice: DialogueChoice = node.choices[i]
            var btn := Button.new()
            btn.text = choice.text
            btn.pressed.connect(func(): select_choice(i, choice.next))
            choices_container.add_child(btn)

func select_choice(index: int, next: int) -> void:
    choice_made.emit(index)
    advance(next)

func advance(next: int) -> void:
    if next < 0 or next >= current_dialogue.nodes.size():
        end_dialogue()
    else:
        show_node(next)

func end_dialogue() -> void:
    panel.visible = false
    dialogue_ended.emit()

class DialogueData:
    var npc_name: String
    var nodes: Array[DialogueNode] = []

class DialogueNode:
    var text: String
    var choices: Array[DialogueChoice] = []
    var next: int = -1  # -1 = end

class DialogueChoice:
    var text: String
    var next: int
    var conditions: Dictionary = {}  # Optional requirements
```

### Defold

Dialogue is a GUI scene driven by a `.gui_script`. An NPC posts start_dialogue with a dialogue table (npc_name + nodes, each node a text plus optional choices). The script shows the current node, builds choice buttons (or a continue button), and walks the node graph on input until a node's next is below zero, then posts dialogue_ended.

```lua
-- dialogue.gui_script
function init(self)
	self.name_node = gui.get_node("name")
	self.text_node = gui.get_node("text")
	self.choice_template = gui.get_node("choice")   -- hidden prototype node
	self.choices = {}
end

local function clear_choices(self)
	for _, node in ipairs(self.choices) do gui.delete_node(node) end
	self.choices = {}
end

local function show_node(self, index)
	self.index = index
	local node = self.dialogue.nodes[index]
	gui.set_text(self.name_node, self.dialogue.npc_name)
	gui.set_text(self.text_node, node.text)
	clear_choices(self)
	if node.choices and #node.choices > 0 then
		for i, choice in ipairs(node.choices) do
			local clone = gui.clone(self.choice_template)
			gui.set_text(clone, choice.text)
			gui.set_position(clone, vmath.vector3(0, -40 * i, 0))
			gui.set_enabled(clone, true)
			self.choices[i] = clone
			self.choice_next = self.choice_next or {}
			self.choice_next[i] = choice.next
		end
	else
		self.continue_next = node.next
	end
end

function on_message(self, message_id, message, sender)
	if message_id == hash("start_dialogue") then
		self.dialogue = message.dialogue
		gui.set_enabled(gui.get_node("panel"), true)
		show_node(self, 1)
	end
end

local function advance(self, next)
	if not next or next < 1 or next > #self.dialogue.nodes then
		gui.set_enabled(gui.get_node("panel"), false)
		msg.post("/game#controller", "dialogue_ended")
	else
		show_node(self, next)
	end
end

function on_input(self, action_id, action)
	if action_id ~= hash("touch") or not action.pressed then return end
	for i, node in ipairs(self.choices) do
		if gui.pick_node(node, action.x, action.y) then
			advance(self, self.choice_next[i])
			return
		end
	end
	if self.continue_next then advance(self, self.continue_next) end
end
```

### NPC System
```gdscript
class_name NPC
extends CharacterBody3D

@export var npc_name: String = "NPC"
@export var dialogue: DialogueData
@export var shop_inventory: Array[ItemData] = []
@export var quests_available: Array[Quest] = []

var can_interact: bool = false

func _input(event: InputEvent) -> void:
    if event.is_action_pressed("interact") and can_interact:
        interact()

func interact() -> void:
    if not quests_available.is_empty():
        offer_quest()
    elif not shop_inventory.is_empty():
        open_shop()
    elif dialogue:
        start_dialogue()

func offer_quest() -> void:
    var quest := quests_available[0]
    QuestSystem.start_quest(quest)
    quests_available.erase(quest)

func open_shop() -> void:
    ShopUI.open(shop_inventory)

func start_dialogue() -> void:
    DialogueSystem.start_dialogue(dialogue)

func _on_interaction_area_body_entered(body: Node3D) -> void:
    if body.is_in_group("player"):
        can_interact = true
        # Show interaction prompt

func _on_interaction_area_body_exited(body: Node3D) -> void:
    if body.is_in_group("player"):
        can_interact = false
```

### Defold

An NPC is a game object with a trigger collision object that gates interaction. While the player is in range and presses interact, it acts in priority order: offer a quest, open the shop (links to the inventory system), or start dialogue. It posts to the relevant controller rather than calling into it.

```lua
-- npc.script
go.property("npc_name", hash("villager"))

function init(self)
	self.in_range = false
	msg.post(".", "acquire_input_focus")
	-- quests_available, shop_inventory, dialogue come from a data module keyed by npc_name
	local data = require("scripts.npc_data")
	self.config = data[self.npc_name] or {}
	self.quests = self.config.quests or {}
end

function on_input(self, action_id, action)
	if action_id == hash("interact") and action.pressed and self.in_range then
		if #self.quests > 0 then
			local quest = table.remove(self.quests, 1)
			msg.post("/player#quest_log", "start_quest", { quest = quest })
		elseif self.config.shop_inventory then
			msg.post("/hud#shop", "open_shop", { inventory = self.config.shop_inventory })
		elseif self.config.dialogue then
			msg.post("/hud#dialogue", "start_dialogue", { dialogue = self.config.dialogue })
		end
	end
end

function on_message(self, message_id, message, sender)
	if message_id == hash("trigger_response") and message.other_group == hash("player") then
		self.in_range = message.enter
		msg.post("/hud#gui", "interact_prompt", { visible = message.enter })
	end
end

function final(self)
	msg.post(".", "release_input_focus")
end
```

---

## Turn-Based Combat (Optional)

```gdscript
class_name TurnBasedBattle
extends Node

enum Phase { PLAYER_TURN, ENEMY_TURN, VICTORY, DEFEAT }

signal turn_changed(phase: Phase)
signal battle_ended(victory: bool)

var party: Array[BattleUnit] = []
var enemies: Array[BattleUnit] = []
var current_phase: Phase = Phase.PLAYER_TURN
var current_unit_index: int = 0

func start_battle(enemy_group: Array[BattleUnit]) -> void:
    enemies = enemy_group
    current_phase = Phase.PLAYER_TURN
    turn_changed.emit(current_phase)

func player_action(action: BattleAction) -> void:
    var actor := party[current_unit_index]
    execute_action(actor, action)

    current_unit_index += 1
    if current_unit_index >= party.size():
        end_player_turn()

func end_player_turn() -> void:
    # Check for victory
    if all_enemies_defeated():
        victory()
        return

    current_phase = Phase.ENEMY_TURN
    current_unit_index = 0
    turn_changed.emit(current_phase)
    process_enemy_turns()

func process_enemy_turns() -> void:
    for enemy in enemies:
        if enemy.is_alive():
            var action := enemy.choose_action(party)
            execute_action(enemy, action)
            await get_tree().create_timer(0.5).timeout

    # Check for defeat
    if all_party_defeated():
        defeat()
        return

    current_phase = Phase.PLAYER_TURN
    current_unit_index = 0
    turn_changed.emit(current_phase)

func execute_action(actor: BattleUnit, action: BattleAction) -> void:
    match action.type:
        "attack":
            var damage := actor.stats.attack - action.target.stats.defense
            action.target.take_damage(maxi(damage, 1))
        "skill":
            action.skill.execute(actor, action.target)
        "item":
            action.item.use(action.target)

class BattleUnit:
    var stats: CharacterStats
    var current_hp: int
    func is_alive() -> bool: return current_hp > 0
    func take_damage(amount: int) -> void: current_hp -= amount

class BattleAction:
    var type: String  # "attack", "skill", "item", "defend", "flee"
    var target: BattleUnit
    var skill: Skill
    var item: ItemData
```

### Defold

A battle is one controller script that walks phases: player turn, enemy turn, victory, defeat. Units are plain tables (stats + current_hp). The script collects a player action per party member, then runs the enemy turn with a `timer.delay` between actions for pacing, checking for a wipe on either side. It posts turn_changed and battle_ended to the HUD.

```lua
-- battle.script
local PLAYER_TURN = hash("player_turn")
local ENEMY_TURN = hash("enemy_turn")

local function alive(unit) return unit.current_hp > 0 end

local function any_alive(units)
	for _, u in ipairs(units) do if alive(u) then return true end end
	return false
end

local function execute(action)
	if action.type == "attack" then
		local dmg = math.max(1, action.actor.stats.attack - action.target.stats.defense)
		action.target.current_hp = action.target.current_hp - dmg
	elseif action.type == "skill" then
		action.skill.apply(action.actor, action.target)
	elseif action.type == "item" then
		action.item.apply(action.target)
	end
end

local function set_phase(self, phase)
	self.phase = phase
	msg.post("/hud#gui", "turn_changed", { phase = phase })
end

local function finish(self, victory)
	msg.post("/hud#gui", "battle_ended", { victory = victory })
end

local function enemy_turn(self)
	set_phase(self, ENEMY_TURN)
	local i = 0
	local function step()
		i = i + 1
		local enemy = self.enemies[i]
		if not enemy then
			if not any_alive(self.party) then return finish(self, false) end
			self.unit_index = 1
			return set_phase(self, PLAYER_TURN)
		end
		if alive(enemy) then
			execute(enemy.choose_action(self.party))
		end
		timer.delay(0.5, false, step)
	end
	step()
end

function init(self)
	self.party = {}
	self.enemies = {}
	self.unit_index = 1
end

function on_message(self, message_id, message, sender)
	if message_id == hash("start_battle") then
		self.party = message.party
		self.enemies = message.enemies
		self.unit_index = 1
		set_phase(self, PLAYER_TURN)
	elseif message_id == hash("player_action") then
		if self.phase ~= PLAYER_TURN then return end
		message.action.actor = self.party[self.unit_index]
		execute(message.action)
		if not any_alive(self.enemies) then return finish(self, true) end
		self.unit_index = self.unit_index + 1
		if self.unit_index > #self.party then enemy_turn(self) end
	end
end
```

---

## Customization Options

**Perspective**: 2D top-down, 2.5D isometric, 3D third-person
**Combat**: Action (real-time), Turn-based, Tactics (grid)
**World**: Linear, Semi-open, Open-world
**Party**: Solo hero, Party of 4, Army
**Tone**: Fantasy, Sci-fi, Modern, Post-apocalyptic

---

**Remember**: RPGs need progression (leveling, gear), choice (dialogue, builds), and reward loops (quests, loot). Balance grinding with story pacing.
