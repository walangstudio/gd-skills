---
name: dialogue-systems
description: Reusable dialogue implementations (linear, branching, conditional, typewriter effect, portraits). Reference from genre templates.
---

# Dialogue Systems

Production-ready dialogue and conversation implementations for story-driven games.

## When to Use

Referenced by genre templates that need NPC dialogue or narrative:
- **RPG Template** → Full branching dialogue with quests and choices
- **Horror Template** → Investigation dialogue, clue delivery
- **Farming Template** → NPC relationships, gifting conversations
- **Survival Template** → NPC traders, quest givers
- **Roguelike Template** → Shop NPCs, run-start briefings

---

## Dialogue Data Format

JSON-based dialogue trees for easy authoring.

### Data Structure
```json
{
  "id": "blacksmith_greeting",
  "speaker": "Blacksmith",
  "portrait": "res://portraits/blacksmith.png",
  "nodes": [
    {
      "id": 0,
      "text": "Welcome, traveler! Need a weapon forged?",
      "choices": [
        { "text": "Show me what you have.", "next": 1 },
        { "text": "I need repairs.", "next": 2 },
        { "text": "Just passing through.", "next": -1 }
      ]
    },
    {
      "id": 1,
      "text": "Here's my finest work. Take a look!",
      "action": "open_shop",
      "next": -1
    },
    {
      "id": 2,
      "text": "Hand it over. I'll have it ready by tomorrow.",
      "condition": { "has_item": "broken_sword" },
      "fail_text": "You don't seem to have anything that needs fixing.",
      "action": "start_repair_quest",
      "next": -1
    }
  ]
}
```

### Godot Resource
```gdscript
class_name DialogueData
extends Resource

@export var id: String
@export var speaker: String
@export var portrait: Texture2D
@export var nodes: Array[DialogueNode] = []

class_name DialogueNode
extends Resource

@export var id: int
@export var text: String
@export var choices: Array[DialogueChoice] = []
@export var next: int = -1  # -1 = end dialogue
@export var action: String = ""  # Optional action trigger
@export var condition: Dictionary = {}  # Optional condition check
@export var fail_text: String = ""  # Text if condition fails

class_name DialogueChoice
extends Resource

@export var text: String
@export var next: int
@export var condition: Dictionary = {}  # Optional visibility condition
```

---

## Dialogue Manager

Core dialogue controller that processes dialogue trees.

### Godot
```gdscript
class_name DialogueManager
extends Node

signal dialogue_started(speaker: String)
signal dialogue_text_shown(text: String, speaker: String)
signal dialogue_choices_shown(choices: Array)
signal dialogue_ended
signal action_triggered(action_name: String)

var current_dialogue: DialogueData
var current_node_index: int = 0
var is_active: bool = false

func start_dialogue(dialogue: DialogueData) -> void:
	current_dialogue = dialogue
	current_node_index = 0
	is_active = true
	dialogue_started.emit(dialogue.speaker)
	show_node(0)

func show_node(index: int) -> void:
	if index < 0 or index >= current_dialogue.nodes.size():
		end_dialogue()
		return

	current_node_index = index
	var node: DialogueNode = current_dialogue.nodes[index]

	# Check condition
	if not node.condition.is_empty() and not check_condition(node.condition):
		if node.fail_text != "":
			dialogue_text_shown.emit(node.fail_text, current_dialogue.speaker)
		else:
			advance(node.next)
		return

	dialogue_text_shown.emit(node.text, current_dialogue.speaker)

	# Trigger action if present
	if node.action != "":
		action_triggered.emit(node.action)

	# Show choices or auto-advance
	var valid_choices: Array = get_valid_choices(node)
	if valid_choices.is_empty():
		# No choices — click to continue
		pass
	else:
		dialogue_choices_shown.emit(valid_choices)

func select_choice(choice_index: int) -> void:
	var node: DialogueNode = current_dialogue.nodes[current_node_index]
	var valid: Array = get_valid_choices(node)
	if choice_index < valid.size():
		advance(valid[choice_index].next)

func advance(next_index: int) -> void:
	if next_index < 0:
		end_dialogue()
	else:
		show_node(next_index)

func continue_dialogue() -> void:
	var node: DialogueNode = current_dialogue.nodes[current_node_index]
	if node.choices.is_empty():
		advance(node.next)

func end_dialogue() -> void:
	is_active = false
	current_dialogue = null
	dialogue_ended.emit()

func get_valid_choices(node: DialogueNode) -> Array:
	var valid: Array = []
	for choice in node.choices:
		if choice.condition.is_empty() or check_condition(choice.condition):
			valid.append(choice)
	return valid

func check_condition(condition: Dictionary) -> bool:
	# Override or extend for game-specific conditions
	if condition.has("has_item"):
		return GameManager.inventory.has_item(condition.has_item)
	if condition.has("min_friendship"):
		return GameManager.relationships.get_level(condition.npc_id) >= condition.min_friendship
	if condition.has("quest_complete"):
		return GameManager.quests.is_complete(condition.quest_complete)
	if condition.has("flag"):
		return GameManager.flags.get(condition.flag, false)
	return true
```

### Unity C#
```csharp
using UnityEngine;
using UnityEngine.Events;
using System.Collections.Generic;

[System.Serializable]
public class DialogueNode
{
    public int id;
    public string text;
    public List<DialogueChoice> choices = new();
    public int next = -1;
    public string action;
}

[System.Serializable]
public class DialogueChoice
{
    public string text;
    public int next;
}

[System.Serializable]
public class DialogueData
{
    public string speaker;
    public Sprite portrait;
    public List<DialogueNode> nodes = new();
}

public class DialogueManager : MonoBehaviour
{
    public static DialogueManager Instance { get; private set; }

    public UnityEvent<string, string> OnTextShown;  // text, speaker
    public UnityEvent<List<DialogueChoice>> OnChoicesShown;
    public UnityEvent OnDialogueEnded;

    private DialogueData current;
    private int currentIndex;

    private void Awake() { Instance = this; }

    public void StartDialogue(DialogueData dialogue)
    {
        current = dialogue;
        ShowNode(0);
    }

    private void ShowNode(int index)
    {
        if (index < 0 || index >= current.nodes.Count) { EndDialogue(); return; }
        currentIndex = index;
        var node = current.nodes[index];
        OnTextShown?.Invoke(node.text, current.speaker);
        if (node.choices.Count > 0) OnChoicesShown?.Invoke(node.choices);
    }

    public void SelectChoice(int index)
    {
        var node = current.nodes[currentIndex];
        if (index < node.choices.Count) ShowNode(node.choices[index].next);
    }

    public void Continue()
    {
        var node = current.nodes[currentIndex];
        if (node.choices.Count == 0) ShowNode(node.next);
    }

    private void EndDialogue() { current = null; OnDialogueEnded?.Invoke(); }
}
```

---

## Dialogue UI

Visual presentation with typewriter effect, portraits, and choice buttons.

### Godot
```gdscript
class_name DialogueUI
extends CanvasLayer

@export var characters_per_second: float = 30.0

@onready var panel: PanelContainer = $DialoguePanel
@onready var portrait: TextureRect = $DialoguePanel/Portrait
@onready var name_label: Label = $DialoguePanel/NameLabel
@onready var text_label: RichTextLabel = $DialoguePanel/TextLabel
@onready var choices_container: VBoxContainer = $DialoguePanel/Choices
@onready var continue_indicator: Control = $DialoguePanel/ContinueIndicator

var full_text: String = ""
var displayed_chars: int = 0
var char_timer: float = 0.0
var is_typing: bool = false

func _ready() -> void:
	panel.visible = false
	DialogueManager.dialogue_started.connect(_on_dialogue_started)
	DialogueManager.dialogue_text_shown.connect(_on_text_shown)
	DialogueManager.dialogue_choices_shown.connect(_on_choices_shown)
	DialogueManager.dialogue_ended.connect(_on_dialogue_ended)

func _process(delta: float) -> void:
	if not is_typing:
		return

	char_timer += delta
	var chars_to_show: int = int(char_timer * characters_per_second)
	if chars_to_show > displayed_chars:
		displayed_chars = chars_to_show
		text_label.visible_characters = displayed_chars
		if displayed_chars >= full_text.length():
			is_typing = false
			continue_indicator.visible = true

func _input(event: InputEvent) -> void:
	if not panel.visible:
		return

	if event.is_action_pressed("interact") or event.is_action_pressed("ui_accept"):
		if is_typing:
			# Skip to end
			is_typing = false
			text_label.visible_characters = -1
			continue_indicator.visible = true
		else:
			DialogueManager.continue_dialogue()

func _on_dialogue_started(speaker: String) -> void:
	panel.visible = true

func _on_text_shown(text: String, speaker: String) -> void:
	name_label.text = speaker
	full_text = text
	text_label.text = text
	text_label.visible_characters = 0
	displayed_chars = 0
	char_timer = 0.0
	is_typing = true
	continue_indicator.visible = false

	# Update portrait if available
	if DialogueManager.current_dialogue and DialogueManager.current_dialogue.portrait:
		portrait.texture = DialogueManager.current_dialogue.portrait
		portrait.visible = true
	else:
		portrait.visible = false

	# Clear old choices
	for child in choices_container.get_children():
		child.queue_free()

func _on_choices_shown(choices: Array) -> void:
	for i in choices.size():
		var btn := Button.new()
		btn.text = choices[i].text
		btn.pressed.connect(DialogueManager.select_choice.bind(i))
		choices_container.add_child(btn)
	continue_indicator.visible = false

func _on_dialogue_ended() -> void:
	panel.visible = false
```

---

## Scene Structure

```
DialogueUI (CanvasLayer)
└── DialoguePanel (PanelContainer)
    ├── Portrait (TextureRect, 128x128)
    ├── NameLabel (Label, bold)
    ├── TextLabel (RichTextLabel, word wrap)
    ├── Choices (VBoxContainer)
    │   └── [Dynamic Button children]
    └── ContinueIndicator (TextureRect, animated arrow)
```

---

## Configuration by Genre

| Genre | Dialogue Style | Key Features |
|-------|---------------|--------------|
| RPG | Full branching | Choices, conditions, quests, shop triggers |
| Horror | Investigation | Clue delivery, evidence checks, tension |
| Farming | Relationship | Gift reactions, heart events, seasonal |
| Survival | Transactional | Trade, quest offers, short exchanges |
| Roguelike | Brief | Shop interactions, lore snippets |

---

**Reference this skill** from genre templates for dialogue implementations.
