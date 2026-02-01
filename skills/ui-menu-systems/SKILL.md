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
