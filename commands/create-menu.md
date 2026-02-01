---
description: Create a complete menu system with main menu, pause menu, game over screen, and transitions. Works with any genre and engine.
---

# Create Menu Command

## What This Command Does

Creates a full menu system with:
- ✅ Main menu (Play, Settings, Quit)
- ✅ Pause menu (Resume, Restart, Settings, Quit)
- ✅ Game over screen (Retry, Menu)
- ✅ Victory screen (Next level, Menu)
- ✅ Loading screen with progress bar
- ✅ Smooth transitions (fade, slide)

## How It Works

1. **Ask customization questions**:
   - Which menus needed (Main, Pause, Game Over, Victory, Loading)
   - Visual style (Minimal, Stylized, Animated)
   - Transition type (Fade, Slide, Dissolve)
   - Engine (Godot, Unity, Unreal)

2. **Generate menu scenes** with proper structure

3. **Wire up navigation** between menus

## Menu Screens

### Main Menu
```
Title / Logo
├── Play / Start
├── Continue (if save exists)
├── Settings
├── Credits
└── Quit
```

### Pause Menu
```
PAUSED
├── Resume
├── Restart Level
├── Settings
└── Quit to Menu
```

### Settings
```
Settings
├── Audio
│   ├── Master Volume [slider]
│   ├── Music Volume [slider]
│   └── SFX Volume [slider]
├── Video
│   ├── Resolution [dropdown]
│   ├── Fullscreen [toggle]
│   └── VSync [toggle]
├── Controls
│   └── Rebind buttons
├── Apply / Back
```

## Boilerplate Code

### Godot — Main Menu
```gdscript
class_name MainMenu
extends Control

func _ready() -> void:
    $VBoxContainer/PlayButton.pressed.connect(func():
        get_tree().change_scene_to_file("res://scenes/gameplay.tscn"))
    $VBoxContainer/SettingsButton.pressed.connect(func():
        $SettingsPanel.visible = true)
    $VBoxContainer/QuitButton.pressed.connect(func():
        get_tree().quit())
```

### Godot — Pause Menu
```gdscript
class_name PauseMenu
extends Control

func _ready() -> void:
    process_mode = Node.PROCESS_MODE_ALWAYS
    visible = false

func _input(event: InputEvent) -> void:
    if event.is_action_pressed("pause"):
        var paused := not get_tree().paused
        get_tree().paused = paused
        visible = paused

func _on_resume_pressed() -> void:
    get_tree().paused = false
    visible = false

func _on_restart_pressed() -> void:
    get_tree().paused = false
    get_tree().reload_current_scene()

func _on_quit_pressed() -> void:
    get_tree().paused = false
    get_tree().change_scene_to_file("res://scenes/ui/main_menu.tscn")
```

### Godot — Scene Transition
```gdscript
# Autoload singleton
class_name SceneTransition
extends CanvasLayer

@onready var anim: AnimationPlayer = $AnimationPlayer

func change_scene(path: String) -> void:
    anim.play("fade_out")
    await anim.animation_finished
    get_tree().change_scene_to_file(path)
    anim.play("fade_in")
```

## Scene Structure

```
MainMenu (Control)
├── TextureRect (background)
├── TextureRect (logo)
├── VBoxContainer
│   ├── PlayButton
│   ├── ContinueButton
│   ├── SettingsButton
│   └── QuitButton
├── SettingsPanel (hidden)
└── AnimationPlayer

PauseMenu (Control, process_mode=ALWAYS)
├── ColorRect (dim overlay)
├── Panel
│   ├── ResumeButton
│   ├── RestartButton
│   └── QuitButton
└── AnimationPlayer
```

## Files Created

```
src/
├── ui/
│   ├── MainMenu.gd           # Main menu logic
│   ├── PauseMenu.gd          # Pause overlay
│   ├── GameOverScreen.gd     # Retry / quit
│   └── SettingsScreen.gd     # Audio + video settings
├── autoload/
│   └── SceneTransition.gd    # Fade transitions
└── scenes/
    ├── main_menu.tscn
    ├── pause_menu.tscn
    ├── game_over.tscn
    └── scene_transition.tscn
```

---

**Create your menu system!** Run `/create-menu` to get started.
