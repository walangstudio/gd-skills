---
name: rpg-template
description: RPG game template with stats, leveling, quests, inventory, and dialogue. Use for games like Skyrim, Final Fantasy, or Stardew Valley.
---

# RPG Template

Production-ready RPG template supporting action, turn-based, and tactics combat.

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

---

## Customization Options

**Perspective**: 2D top-down, 2.5D isometric, 3D third-person
**Combat**: Action (real-time), Turn-based, Tactics (grid)
**World**: Linear, Semi-open, Open-world
**Party**: Solo hero, Party of 4, Army
**Tone**: Fantasy, Sci-fi, Modern, Post-apocalyptic

---

**Remember**: RPGs need progression (leveling, gear), choice (dialogue, builds), and reward loops (quests, loot). Balance grinding with story pacing.
