---
name: full-game-structure
description: Complete game architecture patterns for production-ready games. Use when building full games to ensure all necessary systems are included with proper menu flow, state management, and settings.
---

# Full Game Structure

Production-ready patterns for building complete games with menus, settings, leaderboards, and save systems.

## When to Activate

- Building a complete game from scratch
- Adding production systems to a prototype
- Need guidance on game state flow
- Implementing menu systems
- Creating settings screens

## Core Game Structure

### Complete Scene/Screen Flow

```
Game Start
    ↓
Splash Screen (2-3 seconds, logo)
    ↓
Main Menu
    ├── Play → Level Select → Gameplay
    ├── Continue (if save exists) → Gameplay (at last checkpoint)
    ├── Settings → Settings Menu → Main Menu
    ├── How to Play → Tutorial/Instructions → Main Menu
    ├── Credits → Credits Screen → Main Menu
    └── Quit → Exit Application

Gameplay
    ├── ESC/Pause → Pause Menu
    │   ├── Resume → Gameplay
    │   ├── Restart → Gameplay (fresh)
    │   ├── Settings → Settings Menu → Pause Menu
    │   └── Main Menu → Main Menu (lose progress warning)
    ├── Death/Failure → Game Over Screen
    │   ├── Retry → Gameplay (restart level)
    │   ├── Main Menu → Main Menu
    │   └── View Score → Leaderboard
    └── Victory/Complete → Victory Screen
        ├── Next Level → Gameplay (next level)
        ├── Main Menu → Main Menu
        └── View Score → Leaderboard
```

## 1. Game State Management

### State Machine Pattern

Every game needs a state manager to track current state:

```gdscript
# GameStateManager.gd (Godot)
extends Node

enum GameState {
    SPLASH,
    MAIN_MENU,
    GAMEPLAY,
    PAUSED,
    GAME_OVER,
    VICTORY,
    SETTINGS,
    LOADING
}

var current_state: GameState = GameState.SPLASH
var previous_state: GameState

signal state_changed(new_state: GameState, old_state: GameState)

func change_state(new_state: GameState):
    previous_state = current_state
    current_state = new_state
    state_changed.emit(new_state, previous_state)

    match new_state:
        GameState.GAMEPLAY:
            get_tree().paused = false
        GameState.PAUSED:
            get_tree().paused = true
        GameState.GAME_OVER:
            get_tree().paused = true
        GameState.VICTORY:
            get_tree().paused = true

func is_gameplay_active() -> bool:
    return current_state == GameState.GAMEPLAY

func can_pause() -> bool:
    return current_state == GameState.GAMEPLAY
```

### Unity Example

```csharp
// GameStateManager.cs (Unity)
using UnityEngine;
using System;

public enum GameState
{
    Splash,
    MainMenu,
    Gameplay,
    Paused,
    GameOver,
    Victory,
    Settings,
    Loading
}

public class GameStateManager : MonoBehaviour
{
    public static GameStateManager Instance { get; private set; }

    public GameState CurrentState { get; private set; }
    public GameState PreviousState { get; private set; }

    public event Action<GameState, GameState> OnStateChanged;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    public void ChangeState(GameState newState)
    {
        PreviousState = CurrentState;
        CurrentState = newState;
        OnStateChanged?.Invoke(newState, PreviousState);

        switch (newState)
        {
            case GameState.Gameplay:
                Time.timeScale = 1f;
                break;
            case GameState.Paused:
            case GameState.GameOver:
            case GameState.Victory:
                Time.timeScale = 0f;
                break;
        }
    }

    public bool IsGameplayActive()
    {
        return CurrentState == GameState.Gameplay;
    }

    public bool CanPause()
    {
        return CurrentState == GameState.Gameplay;
    }
}
```

## 2. Menu System Architecture

### Main Menu Structure

```
MainMenu Scene/Screen
├── Background (animated or static image)
├── Logo/Title (game name)
├── Menu Container
│   ├── Play Button
│   ├── Continue Button (disabled if no save)
│   ├── Settings Button
│   ├── How to Play Button
│   ├── Credits Button
│   └── Quit Button
├── Version Text (bottom corner)
└── Background Music
```

### Pause Menu Structure

```
Pause Menu (Overlay on Gameplay)
├── Darkened Background (overlay)
├── Pause Panel
│   ├── "PAUSED" Title
│   ├── Resume Button
│   ├── Restart Button
│   ├── Settings Button
│   └── Main Menu Button (with confirmation)
└── Pause Sound Effect
```

### Settings Menu Structure

```
Settings Menu
├── Tab Navigation
│   ├── Graphics Tab
│   ├── Audio Tab
│   ├── Gameplay Tab
│   └── Controls Tab
├── Apply Button
├── Revert Button
└── Back/Close Button
```

## 3. Settings System Implementation

### Graphics Settings

**Options to include**:
```json
{
  "resolution": {
    "options": ["1920x1080", "2560x1440", "3840x2160"],
    "default": "1920x1080"
  },
  "displayMode": {
    "options": ["Fullscreen", "Windowed", "Borderless"],
    "default": "Fullscreen"
  },
  "qualityPreset": {
    "options": ["Low", "Medium", "High", "Ultra"],
    "default": "High"
  },
  "shadows": {
    "options": ["Off", "Low", "Medium", "High", "Ultra"],
    "default": "High"
  },
  "antiAliasing": {
    "options": ["Off", "FXAA", "MSAA 2x", "MSAA 4x", "MSAA 8x"],
    "default": "MSAA 2x"
  },
  "textureQuality": {
    "options": ["Low", "Medium", "High", "Ultra"],
    "default": "High"
  },
  "vsync": {
    "type": "boolean",
    "default": true
  },
  "fpsLimit": {
    "options": [30, 60, 120, 144, -1],
    "labels": ["30", "60", "120", "144", "Unlimited"],
    "default": 60
  }
}
```

### Audio Settings

**Options to include**:
```json
{
  "masterVolume": {
    "type": "slider",
    "min": 0,
    "max": 100,
    "default": 100
  },
  "musicVolume": {
    "type": "slider",
    "min": 0,
    "max": 100,
    "default": 80
  },
  "sfxVolume": {
    "type": "slider",
    "min": 0,
    "max": 100,
    "default": 100
  },
  "voiceChatVolume": {
    "type": "slider",
    "min": 0,
    "max": 100,
    "default": 100,
    "condition": "multiplayer"
  },
  "muteAll": {
    "type": "boolean",
    "default": false
  }
}
```

### Gameplay Settings

```json
{
  "difficulty": {
    "options": ["Easy", "Normal", "Hard", "Custom"],
    "default": "Normal"
  },
  "subtitles": {
    "type": "boolean",
    "default": false
  },
  "screenShake": {
    "type": "boolean",
    "default": true
  },
  "cameraShakeIntensity": {
    "type": "slider",
    "min": 0,
    "max": 100,
    "default": 50,
    "condition": "screenShake == true"
  },
  "tutorialHints": {
    "type": "boolean",
    "default": true
  },
  "aimAssist": {
    "type": "boolean",
    "default": false,
    "condition": "genre == fps or tps"
  }
}
```

### Controls Settings

```json
{
  "keyBindings": {
    "type": "rebindable",
    "actions": {
      "move_forward": "W",
      "move_back": "S",
      "move_left": "A",
      "move_right": "D",
      "jump": "Space",
      "crouch": "Ctrl",
      "sprint": "Shift",
      "interact": "E",
      "pause": "Escape"
    }
  },
  "mouseSensitivityX": {
    "type": "slider",
    "min": 0.1,
    "max": 5.0,
    "default": 1.0
  },
  "mouseSensitivityY": {
    "type": "slider",
    "min": 0.1,
    "max": 5.0,
    "default": 1.0
  },
  "invertYAxis": {
    "type": "boolean",
    "default": false
  },
  "controllerVibration": {
    "type": "boolean",
    "default": true
  },
  "vibrationIntensity": {
    "type": "slider",
    "min": 0,
    "max": 100,
    "default": 100,
    "condition": "controllerVibration == true"
  }
}
```

## 4. Save/Load System

### Save Data Structure

```json
{
  "version": "1.0.0",
  "player": {
    "name": "PLAYER",
    "level": 5,
    "experience": 1250,
    "health": 100,
    "position": {"x": 150.5, "y": 200.0, "z": 50.0}
  },
  "progress": {
    "currentLevel": 5,
    "unlockedLevels": [1, 2, 3, 4, 5],
    "completedLevels": [1, 2, 3, 4],
    "totalPlaytime": 3600,
    "achievements": ["first_blood", "speed_runner"]
  },
  "inventory": {
    "items": [
      {"id": "health_potion", "count": 3},
      {"id": "key_red", "count": 1}
    ],
    "equipped": {
      "weapon": "sword_iron",
      "armor": "armor_leather"
    }
  },
  "settings": {
    "graphics": {...},
    "audio": {...},
    "gameplay": {...},
    "controls": {...}
  },
  "statistics": {
    "enemiesKilled": 150,
    "deaths": 12,
    "secretsFound": 5,
    "totalCoins": 500
  },
  "timestamp": "2026-01-25T10:30:00Z"
}
```

### Implementation Pattern

```gdscript
# SaveLoadSystem.gd (Godot)
extends Node

const SAVE_PATH = "user://savegame.json"
const SETTINGS_PATH = "user://settings.json"

func save_game(data: Dictionary) -> bool:
    data["version"] = "1.0.0"
    data["timestamp"] = Time.get_datetime_string_from_system()

    var file = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
    if file == null:
        push_error("Failed to save game: " + str(FileAccess.get_open_error()))
        return false

    file.store_string(JSON.stringify(data, "\t"))
    file.close()
    return true

func load_game() -> Dictionary:
    if not save_exists():
        return {}

    var file = FileAccess.open(SAVE_PATH, FileAccess.READ)
    if file == null:
        push_error("Failed to load game: " + str(FileAccess.get_open_error()))
        return {}

    var json = JSON.new()
    var error = json.parse(file.get_as_text())
    file.close()

    if error != OK:
        push_error("Failed to parse save file: " + json.get_error_message())
        return {}

    return json.data

func save_exists() -> bool:
    return FileAccess.file_exists(SAVE_PATH)

func delete_save() -> bool:
    if save_exists():
        DirAccess.remove_absolute(SAVE_PATH)
        return true
    return false

func create_autosave():
    var data = gather_game_data()
    data["autosave"] = true
    save_game(data)

func gather_game_data() -> Dictionary:
    # Gather data from various game systems
    return {
        "player": get_player_data(),
        "progress": get_progress_data(),
        "inventory": get_inventory_data(),
        "settings": get_settings_data(),
        "statistics": get_statistics_data()
    }

func get_player_data() -> Dictionary:
    # Implement based on your game
    return {}
```

## 5. Leaderboard System

### Local Leaderboard

```gdscript
# LeaderboardSystem.gd (Godot)
extends Node

const LEADERBOARD_PATH = "user://leaderboard.json"
const MAX_ENTRIES = 10

var entries: Array[Dictionary] = []

func add_entry(player_name: String, score: int, data: Dictionary = {}):
    var entry = {
        "name": player_name,
        "score": score,
        "level": data.get("level", 0),
        "time": data.get("time", 0.0),
        "date": Time.get_datetime_string_from_system()
    }

    entries.append(entry)
    entries.sort_custom(func(a, b): return a["score"] > b["score"])

    if entries.size() > MAX_ENTRIES:
        entries.resize(MAX_ENTRIES)

    save_leaderboard()

func get_entries(count: int = MAX_ENTRIES) -> Array[Dictionary]:
    return entries.slice(0, mini(count, entries.size()))

func is_high_score(score: int) -> bool:
    if entries.size() < MAX_ENTRIES:
        return true
    return score > entries[-1]["score"]

func get_rank(score: int) -> int:
    for i in entries.size():
        if score > entries[i]["score"]:
            return i + 1
    return entries.size() + 1

func save_leaderboard():
    var file = FileAccess.open(LEADERBOARD_PATH, FileAccess.WRITE)
    file.store_string(JSON.stringify({"entries": entries}, "\t"))
    file.close()

func load_leaderboard():
    if FileAccess.file_exists(LEADERBOARD_PATH):
        var file = FileAccess.open(LEADERBOARD_PATH, FileAccess.READ)
        var json = JSON.new()
        json.parse(file.get_as_text())
        entries = json.data["entries"]
        file.close()
```

## 6. Audio Manager Pattern

### Structure

```
AudioManager (Singleton/Autoload)
├── MusicPlayer (AudioStreamPlayer)
├── SFX Pool (Array of AudioStreamPlayers)
├── Current Music Track
├── Volume Settings
└── Methods
    ├── play_music(name, fade_duration)
    ├── stop_music(fade_duration)
    ├── play_sfx(name, volume)
    ├── play_sfx_3d(name, position, volume)
    ├── set_master_volume(volume)
    ├── set_music_volume(volume)
    └── set_sfx_volume(volume)
```

## 7. HUD/UI Systems

### Gameplay HUD Elements

**Common HUD Elements**:
- Health/HP bar or hearts
- Stamina/energy bar
- Ammo counter (FPS/shooter games)
- Score display
- Timer (if time-limited)
- Minimap (open world/strategy)
- Objective tracker
- Crosshair (FPS games)
- Ability cooldowns (action games)
- Inventory quick slots

### HUD Layout Examples

**FPS HUD**:
```
┌─────────────────────────────────┐
│  HP: [████████████] 100/100    │ Top-left: Health
│  Armor: [██████] 60/100        │
│                                 │
│           [+]                   │ Center: Crosshair
│                                 │
│                     Ammo: 30/90│ Bottom-right: Ammo
│                     [▮▮▮▮▯▯▯▯] │ Bottom-right: Grenades
└─────────────────────────────────┘
```

**Platformer HUD**:
```
┌─────────────────────────────────┐
│ ❤️❤️❤️  Score: 1250  ⭐×5       │ Top: Lives, Score, Coins
│                                 │
│                                 │
│                                 │
│ Level 3-2          Time: 2:34  │ Bottom: Level, Timer
└─────────────────────────────────┘
```

## 8. Complete Game Checklist

### Pre-Production
- [ ] Game state manager implemented
- [ ] Scene/screen flow mapped out
- [ ] Save/load system designed
- [ ] Settings categories defined

### Menu Systems
- [ ] Splash screen (logo animation)
- [ ] Main menu (Play, Settings, Credits, Quit)
- [ ] Pause menu (Resume, Restart, Settings, Main Menu)
- [ ] Settings menu (Graphics, Audio, Gameplay, Controls)
- [ ] Game Over screen (Retry, Main Menu, View Score)
- [ ] Victory screen (Next Level, Main Menu, View Score)
- [ ] Leaderboard screen (Top 10, Player rank)

### Core Systems
- [ ] Audio manager (music, SFX, volume control)
- [ ] Save system (player progress, settings)
- [ ] Load system (restore progress)
- [ ] Input manager (keyboard, mouse, controller)
- [ ] Settings persistence
- [ ] Leaderboard tracking

### Gameplay Integration
- [ ] HUD displays relevant information
- [ ] Pause works correctly (freezes game)
- [ ] Resume works correctly (unpauses game)
- [ ] Death triggers game over screen
- [ ] Victory triggers victory screen
- [ ] Score updates in real-time
- [ ] Settings apply immediately
- [ ] Audio plays correctly

### Polish
- [ ] Menu button hover effects
- [ ] Menu button click sound
- [ ] Smooth transitions between screens
- [ ] Background music loops seamlessly
- [ ] Volume controls work in real-time
- [ ] All UI scales properly on different resolutions
- [ ] Keyboard navigation works (Tab, Enter, ESC)
- [ ] Controller navigation works (D-pad, buttons)

---

**Remember**: A complete game needs complete systems. Users expect menus, settings, saves, and polish. This skill ensures every game feels professional and production-ready.
