---
name: ui-menu-systems
description: Reusable UI implementations (main menu, pause menu, settings screen, HUD, game over, scene transitions). Reference from genre templates.
---

# UI & Menu Systems

Production-ready menu and UI implementations for all game types and engines.

## When to Use

Referenced by every genre template — all games need menus and HUD:
- **All Templates** → Main menu, pause menu, settings, game over
- **FPS / Survival / RPG** → HUD with health, ammo, minimap
- **Platformer** → HUD with lives, coins, score
- **Puzzle** → HUD with move counter, stars, undo button
- **Racing** → HUD with speedometer, lap, position
- **Tower Defense** → HUD with gold, lives, wave counter, tower shop

---

## Main Menu

Entry point for all games.

### Godot
```gdscript
class_name MainMenu
extends Control

@onready var play_button: Button = $VBoxContainer/PlayButton
@onready var continue_button: Button = $VBoxContainer/ContinueButton
@onready var settings_button: Button = $VBoxContainer/SettingsButton
@onready var quit_button: Button = $VBoxContainer/QuitButton
@onready var animation: AnimationPlayer = $AnimationPlayer

func _ready() -> void:
	# Show/hide continue based on save data
	continue_button.visible = SaveManager.has_save(SaveManager.get_newest_slot())

	play_button.pressed.connect(_on_play)
	continue_button.pressed.connect(_on_continue)
	settings_button.pressed.connect(_on_settings)
	quit_button.pressed.connect(_on_quit)

	# Play entrance animation
	if animation:
		animation.play("menu_enter")

func _on_play() -> void:
	SceneTransition.change_scene("res://scenes/gameplay.tscn")

func _on_continue() -> void:
	var slot: int = SaveManager.get_newest_slot()
	var data: Dictionary = SaveManager.load_game(slot)
	GameManager.load_from_save(data)
	SceneTransition.change_scene("res://scenes/gameplay.tscn")

func _on_settings() -> void:
	SceneTransition.change_scene("res://scenes/ui/settings.tscn")

func _on_quit() -> void:
	get_tree().quit()
```

### Unity C#
```csharp
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class MainMenu : MonoBehaviour
{
    [SerializeField] private Button playButton;
    [SerializeField] private Button continueButton;
    [SerializeField] private Button settingsButton;
    [SerializeField] private Button quitButton;

    private void Start()
    {
        continueButton.gameObject.SetActive(SaveManager.Instance.HasSave(0));
        playButton.onClick.AddListener(() => SceneManager.LoadScene("Gameplay"));
        continueButton.onClick.AddListener(() => {
            SaveManager.Instance.LoadGame(0);
            SceneManager.LoadScene("Gameplay");
        });
        settingsButton.onClick.AddListener(() => SceneManager.LoadScene("Settings"));
        quitButton.onClick.AddListener(() => Application.Quit());
    }
}
```

### Defold

The main menu is a `.gui` scene with a `.gui_script`. Buttons are GUI nodes; hit-test them in `on_input` with `gui.pick_node`. Scene flow goes through a collection proxy held by the top-level controller.

```lua
-- gui/main_menu.gui_script
-- nodes: "play_button", "continue_button", "settings_button", "quit_button"

local BUTTONS = {
	play_button = hash("play"),
	continue_button = hash("continue"),
	settings_button = hash("settings"),
	quit_button = hash("quit"),
}

local function has_save()
	local path = sys.get_save_file("mygame", "slot0")
	local data = sys.load(path)
	return next(data) ~= nil
end

function init(self)
	msg.post(".", "acquire_input_focus")
	-- hide Continue when there is no save
	gui.set_enabled(gui.get_node("continue_button"), has_save())
	-- entrance fade
	local root = gui.get_node("root")
	gui.set_alpha(root, 0)
	gui.animate(root, "color.w", 1.0, gui.EASING_OUTQUAD, 0.3)
end

function on_input(self, action_id, action)
	if action_id == hash("touch") and action.pressed then
		for node_name, intent in pairs(BUTTONS) do
			local node = gui.get_node(node_name)
			if gui.is_enabled(node) and gui.pick_node(node, action.x, action.y) then
				msg.post("/controller#script", "menu_select", { intent = intent })
				return true
			end
		end
	end
end

function final(self)
	msg.post(".", "release_input_focus")
end
```

```lua
-- main/controller.script — owns the collection proxies, drives scene flow
function on_message(self, message_id, message, sender)
	if message_id == hash("menu_select") then
		if message.intent == hash("play") or message.intent == hash("continue") then
			msg.post("#menu_proxy", "unload")
			msg.post("#gameplay_proxy", "load")
		elseif message.intent == hash("settings") then
			msg.post("#menu_proxy", "disable")
			msg.post("#settings_proxy", "load")
		elseif message.intent == hash("quit") then
			msg.post("@system:", "exit", { code = 0 })
		end
	elseif message_id == hash("proxy_loaded") then
		msg.post(sender, "init")
		msg.post(sender, "enable")
	end
end
```

---

## Pause Menu

Overlay that pauses the game.

### Godot
```gdscript
class_name PauseMenu
extends Control

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	visible = false

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		toggle_pause()

func toggle_pause() -> void:
	var is_paused: bool = not get_tree().paused
	get_tree().paused = is_paused
	visible = is_paused

	if is_paused:
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	else:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED  # For FPS games

func _on_resume_pressed() -> void:
	toggle_pause()

func _on_restart_pressed() -> void:
	get_tree().paused = false
	get_tree().reload_current_scene()

func _on_settings_pressed() -> void:
	# Open settings as overlay or sub-scene
	$SettingsPanel.visible = true

func _on_main_menu_pressed() -> void:
	get_tree().paused = false
	SceneTransition.change_scene("res://scenes/ui/main_menu.tscn")
```

### Unity C#
```csharp
using UnityEngine;
using UnityEngine.SceneManagement;

public class PauseMenu : MonoBehaviour
{
    [SerializeField] private GameObject pausePanel;
    private bool isPaused;

    private void Update()
    {
        if (Input.GetKeyDown(KeyCode.Escape))
            TogglePause();
    }

    public void TogglePause()
    {
        isPaused = !isPaused;
        pausePanel.SetActive(isPaused);
        Time.timeScale = isPaused ? 0f : 1f;
        Cursor.lockState = isPaused ? CursorLockMode.None : CursorLockMode.Locked;
    }

    public void Resume() => TogglePause();
    public void Restart() { Time.timeScale = 1f; SceneManager.LoadScene(SceneManager.GetActiveScene().name); }
    public void MainMenu() { Time.timeScale = 1f; SceneManager.LoadScene("MainMenu"); }
}
```

### Defold

Defold has no global time-scale, so "pause" means: stop the gameplay collection updating and show the pause GUI. The cleanest approach is a separate pause `.gui` component that gets enabled, plus telling the gameplay collection to freeze via a message. The controller owns the proxy so it can disable gameplay updates with `set_time_step`.

```lua
-- gui/pause_menu.gui_script
-- nodes: "panel", "resume_button", "restart_button", "settings_button", "menu_button"

function init(self)
	self.paused = false
	gui.set_enabled(gui.get_node("panel"), false)
	msg.post(".", "acquire_input_focus")
end

local function set_paused(self, paused)
	self.paused = paused
	gui.set_enabled(gui.get_node("panel"), paused)
	-- freeze / resume the gameplay collection's update loop
	msg.post("/controller#script", "set_gameplay_paused", { paused = paused })
end

function on_input(self, action_id, action)
	if action_id == hash("pause") and action.pressed then
		set_paused(self, not self.paused)
		return true
	end
	if not self.paused or not action.pressed then return end
	if action_id == hash("touch") then
		if gui.pick_node(gui.get_node("resume_button"), action.x, action.y) then
			set_paused(self, false)
		elseif gui.pick_node(gui.get_node("restart_button"), action.x, action.y) then
			set_paused(self, false)
			msg.post("/controller#script", "restart_level")
		elseif gui.pick_node(gui.get_node("settings_button"), action.x, action.y) then
			gui.set_enabled(gui.get_node("settings_panel"), true)
		elseif gui.pick_node(gui.get_node("menu_button"), action.x, action.y) then
			set_paused(self, false)
			msg.post("/controller#script", "goto_main_menu")
		end
		return true
	end
end
```

```lua
-- in main/controller.script — freeze gameplay by zeroing its time step
function on_message(self, message_id, message, sender)
	if message_id == hash("set_gameplay_paused") then
		msg.post("#gameplay_proxy", "set_time_step",
			{ factor = message.paused and 0 or 1, mode = 0 })
	end
end
```

---

## Settings Screen

Tabbed settings UI with apply/revert.

### Godot
```gdscript
class_name SettingsScreen
extends Control

@onready var master_slider: HSlider = $Audio/MasterSlider
@onready var music_slider: HSlider = $Audio/MusicSlider
@onready var sfx_slider: HSlider = $Audio/SFXSlider
@onready var fullscreen_check: CheckButton = $Video/FullscreenCheck
@onready var vsync_check: CheckButton = $Video/VSyncCheck
@onready var resolution_dropdown: OptionButton = $Video/ResolutionDropdown

var resolutions: Array[Vector2i] = [
	Vector2i(1280, 720), Vector2i(1920, 1080), Vector2i(2560, 1440)
]

func _ready() -> void:
	# Load current settings
	master_slider.value = SettingsManager.get_setting("audio", "master_volume", 1.0)
	music_slider.value = SettingsManager.get_setting("audio", "music_volume", 0.8)
	sfx_slider.value = SettingsManager.get_setting("audio", "sfx_volume", 1.0)
	fullscreen_check.button_pressed = SettingsManager.get_setting("video", "fullscreen", false)
	vsync_check.button_pressed = SettingsManager.get_setting("video", "vsync", true)

	# Connect signals
	master_slider.value_changed.connect(func(v): SettingsManager.set_setting("audio", "master_volume", v))
	music_slider.value_changed.connect(func(v): SettingsManager.set_setting("audio", "music_volume", v))
	sfx_slider.value_changed.connect(func(v): SettingsManager.set_setting("audio", "sfx_volume", v))
	fullscreen_check.toggled.connect(func(v): SettingsManager.set_setting("video", "fullscreen", v))
	vsync_check.toggled.connect(func(v): SettingsManager.set_setting("video", "vsync", v))

	# Populate resolutions
	for res in resolutions:
		resolution_dropdown.add_item("%dx%d" % [res.x, res.y])

func _on_apply_pressed() -> void:
	SettingsManager.apply_audio_settings()
	SettingsManager.apply_video_settings()

func _on_back_pressed() -> void:
	SceneTransition.change_scene("res://scenes/ui/main_menu.tscn")
```

### Defold

Settings live in a `require`'d module that wraps `sys.save`/`sys.load`; the GUI reads current values in `init` and writes back as the player drags sliders. A slider is two nodes (a track and a fill/knob); dragging maps the touch x to a 0..1 value.

```lua
-- scripts/settings.lua — shared persistent settings
local M = {}
local PATH = sys.get_save_file("mygame", "settings")
local DEFAULTS = { master = 1.0, music = 0.8, sfx = 1.0, fullscreen = false }

function M.load()
	local data = sys.load(PATH)
	if next(data) == nil then return DEFAULTS end
	return data
end

function M.save(data) sys.save(PATH, data) end
return M
```

```lua
-- gui/settings.gui_script
local settings = require("scripts.settings")

local function refresh_sliders(self)
	for _, key in ipairs({ "master", "music", "sfx" }) do
		local fill = gui.get_node(key .. "_fill")
		gui.set_scale(fill, vmath.vector3(self.values[key], 1, 1))
	end
end

function init(self)
	msg.post(".", "acquire_input_focus")
	self.values = settings.load()
	self.dragging = nil
	refresh_sliders(self)
end

function on_input(self, action_id, action)
	if action_id ~= hash("touch") then return end
	if action.pressed then
		for _, key in ipairs({ "master", "music", "sfx" }) do
			if gui.pick_node(gui.get_node(key .. "_track"), action.x, action.y) then
				self.dragging = key
			end
		end
		if gui.pick_node(gui.get_node("back_button"), action.x, action.y) then
			settings.save(self.values)
			msg.post("/controller#script", "settings_closed")
		end
	elseif action.released then
		self.dragging = nil
	end

	if self.dragging then
		local track = gui.get_node(self.dragging .. "_track")
		local pos = gui.get_position(track)
		local width = gui.get_size(track).x
		local v = (action.x - (pos.x - width * 0.5)) / width
		self.values[self.dragging] = math.max(0, math.min(1, v))
		refresh_sliders(self)
		msg.post("/audio#script", "set_volume",
			{ channel = self.dragging, value = self.values[self.dragging] })
	end
end
```

---

## HUD (Heads-Up Display)

Genre-configurable in-game overlay.

### Godot
```gdscript
class_name GameHUD
extends CanvasLayer

@onready var health_bar: ProgressBar = $HealthBar
@onready var score_label: Label = $ScoreLabel
@onready var ammo_label: Label = $AmmoLabel
@onready var lives_container: HBoxContainer = $LivesContainer

# Call from GameManager or Player signals
func update_health(current: int, maximum: int) -> void:
	health_bar.max_value = maximum
	health_bar.value = current
	# Flash red when hit
	var tween := create_tween()
	tween.tween_property(health_bar, "modulate", Color.RED, 0.1)
	tween.tween_property(health_bar, "modulate", Color.WHITE, 0.2)

func update_score(score: int) -> void:
	score_label.text = "Score: %d" % score
	# Pop animation
	var tween := create_tween()
	tween.tween_property(score_label, "scale", Vector2(1.2, 1.2), 0.1)
	tween.tween_property(score_label, "scale", Vector2.ONE, 0.1)

func update_ammo(current: int, reserve: int) -> void:
	ammo_label.text = "%d / %d" % [current, reserve]
	if current <= 3:
		ammo_label.modulate = Color.RED
	else:
		ammo_label.modulate = Color.WHITE

func update_lives(count: int) -> void:
	for i in lives_container.get_child_count():
		lives_container.get_child(i).visible = i < count
```

### Defold

The HUD is its own `.gui` component (e.g. at `/hud#gui`). Gameplay never reaches into it — it posts update messages. The gui_script reacts in `on_message` and animates nodes with `gui.animate`.

```lua
-- gui/hud.gui_script
-- nodes: "health_bar" (fill), "score_label", "ammo_label", and "life_1".."life_5"

local LOW_AMMO = 3
local MAX_LIVES = 5

function init(self)
	self.health_bar = gui.get_node("health_bar")
	self.score_label = gui.get_node("score_label")
	self.ammo_label = gui.get_node("ammo_label")
end

function on_message(self, message_id, message, sender)
	if message_id == hash("update_health") then
		local pct = message.current / message.maximum
		gui.set_scale(self.health_bar, vmath.vector3(pct, 1, 1))
		-- flash red on hit
		gui.set_color(self.health_bar, vmath.vector4(1, 0, 0, 1))
		gui.animate(self.health_bar, "color", vmath.vector4(1, 1, 1, 1),
			gui.EASING_OUTQUAD, 0.3)

	elseif message_id == hash("update_score") then
		gui.set_text(self.score_label, "Score: " .. message.score)
		-- pop the label
		gui.set_scale(self.score_label, vmath.vector3(1.2, 1.2, 1))
		gui.animate(self.score_label, "scale", vmath.vector3(1, 1, 1),
			gui.EASING_OUTBACK, 0.15)

	elseif message_id == hash("update_ammo") then
		gui.set_text(self.ammo_label, message.current .. " / " .. message.reserve)
		local low = message.current <= LOW_AMMO
		gui.set_color(self.ammo_label,
			low and vmath.vector4(1, 0, 0, 1) or vmath.vector4(1, 1, 1, 1))

	elseif message_id == hash("update_lives") then
		for i = 1, MAX_LIVES do
			gui.set_enabled(gui.get_node("life_" .. i), i <= message.count)
		end
	end
end

-- drive from gameplay:
-- msg.post("/hud#gui", "update_health", { current = hp, maximum = max_hp })
-- msg.post("/hud#gui", "update_score", { score = self.score })
```

---

## Game Over / Victory Screens

### Godot
```gdscript
class_name GameOverScreen
extends Control

@onready var title_label: Label = $TitleLabel
@onready var score_label: Label = $ScoreLabel
@onready var stats_container: VBoxContainer = $StatsContainer

func show_game_over(final_score: int, stats: Dictionary = {}) -> void:
	title_label.text = "GAME OVER"
	score_label.text = "Score: %d" % final_score
	populate_stats(stats)
	visible = true

func show_victory(final_score: int, stats: Dictionary = {}) -> void:
	title_label.text = "VICTORY!"
	score_label.text = "Score: %d" % final_score
	populate_stats(stats)
	visible = true

func populate_stats(stats: Dictionary) -> void:
	for child in stats_container.get_children():
		child.queue_free()
	for key in stats:
		var label := Label.new()
		label.text = "%s: %s" % [key, str(stats[key])]
		stats_container.add_child(label)

func _on_retry_pressed() -> void:
	get_tree().reload_current_scene()

func _on_main_menu_pressed() -> void:
	SceneTransition.change_scene("res://scenes/ui/main_menu.tscn")

func _on_next_level_pressed() -> void:
	GameManager.next_level()
```

### Defold

A game-over `.gui` component, enabled when gameplay posts `show_game_over`. The same component handles victory by switching the title text and a flag. Stats arrive in the message table and are written into pre-placed label nodes (or cloned from a template node).

```lua
-- gui/game_over.gui_script
-- nodes: "root", "title_label", "score_label", "retry_button", "menu_button",
--        and a "stat_template" node to clone per stat line.

function init(self)
	gui.set_enabled(gui.get_node("root"), false)
	msg.post(".", "acquire_input_focus")
	self.stat_nodes = {}
end

local function populate_stats(self, stats)
	for _, n in ipairs(self.stat_nodes) do gui.delete_node(n) end
	self.stat_nodes = {}
	local template = gui.get_node("stat_template")
	local y = 0
	for key, value in pairs(stats or {}) do
		local node = gui.clone(template)
		gui.set_enabled(node, true)
		gui.set_text(node, key .. ": " .. tostring(value))
		local p = gui.get_position(node)
		p.y = p.y - y
		gui.set_position(node, p)
		table.insert(self.stat_nodes, node)
		y = y + 32
	end
end

function on_message(self, message_id, message, sender)
	if message_id == hash("show_game_over") or message_id == hash("show_victory") then
		local won = message_id == hash("show_victory")
		gui.set_text(gui.get_node("title_label"), won and "VICTORY!" or "GAME OVER")
		gui.set_text(gui.get_node("score_label"), "Score: " .. message.score)
		populate_stats(self, message.stats)
		gui.set_enabled(gui.get_node("root"), true)
	end
end

function on_input(self, action_id, action)
	if action_id ~= hash("touch") or not action.pressed then return end
	if gui.pick_node(gui.get_node("retry_button"), action.x, action.y) then
		msg.post("/controller#script", "restart_level")
	elseif gui.pick_node(gui.get_node("menu_button"), action.x, action.y) then
		msg.post("/controller#script", "goto_main_menu")
	end
end
```

---

## Scene Transition Manager

Smooth transitions between scenes with fade/dissolve effects.

### Godot
```gdscript
class_name SceneTransition
extends CanvasLayer

# Autoload singleton

@onready var color_rect: ColorRect = $ColorRect
@onready var animation: AnimationPlayer = $AnimationPlayer

var target_scene: String = ""

func change_scene(path: String, transition: String = "fade") -> void:
	target_scene = path
	match transition:
		"fade":
			animation.play("fade_out")
			await animation.animation_finished
			get_tree().change_scene_to_file(target_scene)
			animation.play("fade_in")
		"instant":
			get_tree().change_scene_to_file(path)

# AnimationPlayer keyframes:
# fade_out: ColorRect modulate.a from 0 -> 1 over 0.3s
# fade_in:  ColorRect modulate.a from 1 -> 0 over 0.3s
```

### Defold

Scene swaps go through collection proxies. A full-screen fade GUI (a single black box node) overlays everything: fade to black with `gui.animate`, then load/enable the next proxy in the completion callback, then fade back in. The controller drives the proxy load/unload; the fade GUI just animates and reports when the screen is fully covered.

```lua
-- gui/transition.gui_script — full-screen "box" node, starts transparent
function init(self)
	self.box = gui.get_node("box")
	gui.set_alpha(self.box, 0)
end

function on_message(self, message_id, message, sender)
	if message_id == hash("fade_out") then
		-- cover the screen, then tell the controller it is safe to swap scenes
		gui.animate(self.box, "color.w", 1.0, gui.EASING_INQUAD, 0.3, 0,
			function()
				msg.post(sender, "covered", { next_scene = message.next_scene })
			end)
	elseif message_id == hash("fade_in") then
		gui.animate(self.box, "color.w", 0.0, gui.EASING_OUTQUAD, 0.3)
	end
end
```

```lua
-- main/controller.script — swap proxies under cover of the fade
function on_message(self, message_id, message, sender)
	if message_id == hash("change_scene") then
		self.next_proxy = message.proxy            -- e.g. "#gameplay_proxy"
		msg.post("/transition#gui", "fade_out", { next_scene = self.current_proxy })
	elseif message_id == hash("covered") then
		msg.post(self.current_proxy, "unload")
		msg.post(self.next_proxy, "load")
	elseif message_id == hash("proxy_loaded") then
		msg.post(sender, "init")
		msg.post(sender, "enable")
		self.current_proxy = self.next_proxy
		msg.post("/transition#gui", "fade_in")
	end
end
```

---

## Scene Structure

```
UI Scenes
├── MainMenu (Control)
│   ├── Background (TextureRect or animated)
│   ├── Logo (TextureRect)
│   ├── VBoxContainer (buttons)
│   │   ├── PlayButton
│   │   ├── ContinueButton
│   │   ├── SettingsButton
│   │   └── QuitButton
│   └── AnimationPlayer
├── PauseMenu (Control, process_mode=ALWAYS)
│   ├── DarkenOverlay (ColorRect)
│   ├── Panel
│   │   ├── ResumeButton
│   │   ├── RestartButton
│   │   ├── SettingsButton
│   │   └── MainMenuButton
│   └── AnimationPlayer
├── Settings (Control)
│   ├── TabContainer
│   │   ├── Audio (sliders)
│   │   ├── Video (resolution, fullscreen)
│   │   └── Controls (keybindings)
│   ├── ApplyButton
│   └── BackButton
├── GameOver (Control)
│   ├── Title, Score, Stats
│   ├── RetryButton
│   └── MainMenuButton
└── SceneTransition (CanvasLayer, autoload)
    ├── ColorRect (full screen)
    └── AnimationPlayer
```

---

## Configuration by Genre

| Genre | Main Menu | Pause | HUD Elements | Game Over |
|-------|-----------|-------|-------------|-----------|
| Platformer | Play, Continue, Settings | Resume, Restart, Menu | Lives, coins, score, time | Score, retry |
| FPS | Play, Multiplayer, Settings | Resume, Settings, Menu | Health, ammo, crosshair, minimap | K/D, score |
| Horror | New Game, Continue, Settings | Resume, Settings, Menu | Flashlight battery, sanity, equipment | Investigation results |
| RPG | New, Load, Settings | Resume, Save, Inventory, Menu | HP, MP, XP bar, quest tracker | - (death respawn) |
| Survival | New, Load, Settings | Resume, Crafting, Map, Menu | Hunger, thirst, health, toolbar | Stats, retry |
| Racing | Race, Garage, Settings | Restart, Menu | Speed, lap, position, minimap | Results, times |

---

**Reference this skill** from genre templates for UI and menu implementations.
