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

### Defold

A dialogue tree is just a Lua table returned from a `require`'d module. No editor resource needed; nodes are keyed by id, choices and conditions are nested tables, and `next = -1` ends the conversation.

```lua
-- dialogue/blacksmith.lua
return {
	id = "blacksmith_greeting",
	speaker = "Blacksmith",
	portrait = "/portraits#blacksmith",   -- url to a sprite/gui texture
	nodes = {
		[0] = {
			text = "Welcome, traveler! Need a weapon forged?",
			choices = {
				{ text = "Show me what you have.", next = 1 },
				{ text = "I need repairs.", next = 2 },
				{ text = "Just passing through.", next = -1 },
			},
		},
		[1] = {
			text = "Here's my finest work. Take a look!",
			action = "open_shop",
			next = -1,
		},
		[2] = {
			text = "Hand it over. I'll have it ready by tomorrow.",
			condition = { has_item = "broken_sword" },
			fail_text = "You don't seem to have anything that needs fixing.",
			action = "start_repair_quest",
			next = -1,
		},
	},
}
```

```lua
-- in any script: local tree = require("dialogue.blacksmith")
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

### Defold

The manager is a script component (e.g. `/dialogue#manager`). It walks the tree table, checks conditions against shared game state, and tells the UI what to show by posting messages — never by reaching into the GUI. The UI posts back `select_choice` / `continue` to advance.

```lua
-- objects/dialogue_manager.script   (/dialogue#manager)
local game_state = require("scripts.game_state")

local function check_condition(cond)
	if cond.has_item then return game_state.inventory_has(cond.has_item) end
	if cond.quest_complete then return game_state.quest_complete(cond.quest_complete) end
	if cond.flag then return game_state.flags[cond.flag] == true end
	return true
end

local function valid_choices(node)
	local valid = {}
	for _, choice in ipairs(node.choices or {}) do
		if not choice.condition or check_condition(choice.condition) then
			table.insert(valid, choice)
		end
	end
	return valid
end

local function show_node(self, index)
	if not self.tree or index < 0 or self.tree.nodes[index] == nil then
		msg.post("/dialogue#ui", "dialogue_ended")
		self.active = false
		self.tree = nil
		return
	end
	self.index = index
	local node = self.tree.nodes[index]

	if node.condition and not check_condition(node.condition) then
		if node.fail_text then
			msg.post("/dialogue#ui", "show_text",
				{ text = node.fail_text, speaker = self.tree.speaker })
		else
			show_node(self, node.next or -1)
		end
		return
	end

	msg.post("/dialogue#ui", "show_text",
		{ text = node.text, speaker = self.tree.speaker, portrait = self.tree.portrait })

	if node.action then
		msg.post("/game#controller", "dialogue_action", { action = node.action })
	end

	self.choices = valid_choices(node)
	if #self.choices > 0 then
		local labels = {}
		for i, c in ipairs(self.choices) do labels[i] = c.text end
		msg.post("/dialogue#ui", "show_choices", { choices = labels })
	end
end

function init(self)
	self.active = false
	self.index = 0
	self.choices = {}
end

function on_message(self, message_id, message, sender)
	if message_id == hash("start_dialogue") then
		self.tree = require(message.module)   -- e.g. "dialogue.blacksmith"
		self.active = true
		msg.post("/dialogue#ui", "dialogue_started", { speaker = self.tree.speaker })
		show_node(self, 0)

	elseif message_id == hash("select_choice") then
		local choice = self.choices[message.index]
		if choice then show_node(self, choice.next) end

	elseif message_id == hash("continue") then
		local node = self.tree and self.tree.nodes[self.index]
		if node and #(node.choices or {}) == 0 then
			show_node(self, node.next or -1)
		end
	end
end
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

### Defold

The UI is a `.gui_script`. The typewriter effect reveals characters over time in `update`: track a `char_timer`, compute how many characters should be visible, and feed that count to `gui.set_text` (slicing the full string). A tap reveals the rest instantly, or advances if already done. Choices are clickable GUI nodes hit-tested in `on_input`.

```lua
-- gui/dialogue.gui_script
-- nodes: "panel", "portrait", "name_label", "text_label",
--        "continue_indicator", and "choice_1".."choice_4"

go.property("chars_per_second", 30.0)

local MAX_CHOICES = 4

function init(self)
	msg.post(".", "acquire_input_focus")
	gui.set_enabled(gui.get_node("panel"), false)
	self.full_text = ""
	self.shown = 0
	self.timer = 0
	self.typing = false
	self.choice_count = 0
end

function update(self, dt)
	if not self.typing then return end
	self.timer = self.timer + dt
	local want = math.floor(self.timer * self.chars_per_second)
	if want > self.shown then
		self.shown = math.min(want, #self.full_text)
		gui.set_text(gui.get_node("text_label"), self.full_text:sub(1, self.shown))
		if self.shown >= #self.full_text then
			self.typing = false
			gui.set_enabled(gui.get_node("continue_indicator"), true)
		end
	end
end

local function hide_choices(self)
	for i = 1, MAX_CHOICES do
		gui.set_enabled(gui.get_node("choice_" .. i), false)
	end
	self.choice_count = 0
end

function on_message(self, message_id, message, sender)
	if message_id == hash("dialogue_started") then
		gui.set_enabled(gui.get_node("panel"), true)

	elseif message_id == hash("show_text") then
		gui.set_text(gui.get_node("name_label"), message.speaker)
		self.full_text = message.text
		self.shown = 0
		self.timer = 0
		self.typing = true
		gui.set_text(gui.get_node("text_label"), "")
		gui.set_enabled(gui.get_node("continue_indicator"), false)
		gui.set_enabled(gui.get_node("portrait"), message.portrait ~= nil)
		hide_choices(self)

	elseif message_id == hash("show_choices") then
		self.choice_count = #message.choices
		for i = 1, MAX_CHOICES do
			local node = gui.get_node("choice_" .. i)
			local c = message.choices[i]
			gui.set_enabled(node, c ~= nil)
			if c then gui.set_text(node, c) end
		end
		gui.set_enabled(gui.get_node("continue_indicator"), false)

	elseif message_id == hash("dialogue_ended") then
		gui.set_enabled(gui.get_node("panel"), false)
		hide_choices(self)
	end
end

function on_input(self, action_id, action)
	if not gui.is_enabled(gui.get_node("panel")) then return end
	if action_id ~= hash("touch") or not action.pressed then return end

	-- a visible choice was tapped?
	for i = 1, self.choice_count do
		if gui.pick_node(gui.get_node("choice_" .. i), action.x, action.y) then
			msg.post("/dialogue#manager", "select_choice", { index = i })
			return true
		end
	end

	if self.typing then
		-- skip the typewriter to the end
		self.typing = false
		self.shown = #self.full_text
		gui.set_text(gui.get_node("text_label"), self.full_text)
		gui.set_enabled(gui.get_node("continue_indicator"), true)
	elseif self.choice_count == 0 then
		msg.post("/dialogue#manager", "continue")
	end
	return true
end
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
