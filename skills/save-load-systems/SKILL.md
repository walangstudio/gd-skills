---
name: save-load-systems
description: Reusable save/load implementations (JSON, binary, settings persistence, autosave, slot management). Reference from genre templates.
---

# Save/Load Systems

Production-ready save and load implementations for all game types and engines.

## When to Use

Referenced by genre templates that need persistence:
- **RPG Template** → Full save (player stats, inventory, quests, world state)
- **Survival Template** → World + player + structures + needs
- **Platformer Template** → Level progress + high scores
- **Horror Template** → Settings + checkpoint + investigation state
- **Farming Template** → Farm state + calendar + relationships
- **Racing Template** → Times + unlocked tracks + vehicle customization
- **Puzzle Template** → Level completion + star ratings + best moves
- **Roguelike Template** → Meta-progression + unlocks (runs are not saved)
- **Tower Defense Template** → Level progress + best scores

---

## JSON Save System (Simple)

Human-readable saves using JSON. Best for most games.

### Godot
```gdscript
class_name SaveManager
extends Node

signal save_completed(slot: int)
signal load_completed(slot: int)
signal save_failed(reason: String)

const SAVE_DIR: String = "user://saves/"
const SAVE_VERSION: int = 1

func _ready() -> void:
	DirAccess.make_dir_recursive_absolute(SAVE_DIR)

func save_game(slot: int, data: Dictionary) -> bool:
	data["_save_version"] = SAVE_VERSION
	data["_timestamp"] = Time.get_datetime_string_from_system()
	data["_playtime"] = data.get("_playtime", 0.0)

	var path: String = SAVE_DIR + "save_%d.json" % slot
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		save_failed.emit("Cannot write to %s" % path)
		return false

	file.store_string(JSON.stringify(data, "\t"))
	save_completed.emit(slot)
	return true

func load_game(slot: int) -> Dictionary:
	var path: String = SAVE_DIR + "save_%d.json" % slot
	if not FileAccess.file_exists(path):
		return {}

	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return {}

	var json := JSON.new()
	if json.parse(file.get_as_text()) != OK:
		return {}

	var data: Dictionary = json.data
	# Version migration
	if data.get("_save_version", 0) < SAVE_VERSION:
		data = migrate_save(data)

	load_completed.emit(slot)
	return data

func has_save(slot: int) -> bool:
	return FileAccess.file_exists(SAVE_DIR + "save_%d.json" % slot)

func delete_save(slot: int) -> void:
	var path: String = SAVE_DIR + "save_%d.json" % slot
	if FileAccess.file_exists(path):
		DirAccess.remove_absolute(path)

func get_save_metadata(slot: int) -> Dictionary:
	var data: Dictionary = load_game(slot)
	if data.is_empty():
		return {}
	return {
		"timestamp": data.get("_timestamp", "Unknown"),
		"playtime": data.get("_playtime", 0.0),
		"version": data.get("_save_version", 0)
	}

func migrate_save(data: Dictionary) -> Dictionary:
	# Override to handle version upgrades
	# Example: if data._save_version == 0: data["new_field"] = default
	data["_save_version"] = SAVE_VERSION
	return data
```

### Unity C#
```csharp
using UnityEngine;
using System.IO;

[System.Serializable]
public class SaveData
{
    public int saveVersion = 1;
    public string timestamp;
    public float playtime;
    // Add game-specific fields
}

public class SaveManager : MonoBehaviour
{
    public static SaveManager Instance { get; private set; }
    private string SaveDir => Application.persistentDataPath + "/saves/";

    private void Awake()
    {
        if (Instance != null) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);
        Directory.CreateDirectory(SaveDir);
    }

    public void SaveGame(int slot, SaveData data)
    {
        data.timestamp = System.DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
        string json = JsonUtility.ToJson(data, true);
        File.WriteAllText(SaveDir + $"save_{slot}.json", json);
    }

    public SaveData LoadGame(int slot)
    {
        string path = SaveDir + $"save_{slot}.json";
        if (!File.Exists(path)) return null;
        string json = File.ReadAllText(path);
        return JsonUtility.FromJson<SaveData>(json);
    }

    public bool HasSave(int slot) => File.Exists(SaveDir + $"save_{slot}.json");

    public void DeleteSave(int slot)
    {
        string path = SaveDir + $"save_{slot}.json";
        if (File.Exists(path)) File.Delete(path);
    }
}
```

---

## Settings Persistence

Separate system for user preferences (graphics, audio, controls).

### Godot
```gdscript
class_name SettingsManager
extends Node

const SETTINGS_PATH: String = "user://settings.cfg"

var config := ConfigFile.new()

func _ready() -> void:
	load_settings()

func load_settings() -> void:
	if config.load(SETTINGS_PATH) != OK:
		set_defaults()

func save_settings() -> void:
	config.save(SETTINGS_PATH)

func set_defaults() -> void:
	config.set_value("audio", "master_volume", 1.0)
	config.set_value("audio", "music_volume", 0.8)
	config.set_value("audio", "sfx_volume", 1.0)
	config.set_value("video", "fullscreen", false)
	config.set_value("video", "vsync", true)
	config.set_value("video", "resolution", Vector2i(1920, 1080))
	config.set_value("gameplay", "language", "en")
	save_settings()

func get_setting(section: String, key: String, default_value: Variant = null) -> Variant:
	return config.get_value(section, key, default_value)

func set_setting(section: String, key: String, value: Variant) -> void:
	config.set_value(section, key, value)
	save_settings()

func apply_audio_settings() -> void:
	AudioServer.set_bus_volume_db(0, linear_to_db(get_setting("audio", "master_volume", 1.0)))
	AudioServer.set_bus_volume_db(1, linear_to_db(get_setting("audio", "music_volume", 0.8)))
	AudioServer.set_bus_volume_db(2, linear_to_db(get_setting("audio", "sfx_volume", 1.0)))

func apply_video_settings() -> void:
	var fullscreen: bool = get_setting("video", "fullscreen", false)
	if fullscreen:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
	else:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)
	DisplayServer.window_set_vsync_mode(
		DisplayServer.VSYNC_ENABLED if get_setting("video", "vsync", true) else DisplayServer.VSYNC_DISABLED
	)
```

### Unity C#
```csharp
using UnityEngine;

public class SettingsManager : MonoBehaviour
{
    public static SettingsManager Instance { get; private set; }

    public float MasterVolume { get; private set; } = 1f;
    public float MusicVolume { get; private set; } = 0.8f;
    public float SfxVolume { get; private set; } = 1f;
    public bool Fullscreen { get; private set; } = false;

    private void Awake()
    {
        if (Instance != null) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);
        LoadSettings();
    }

    public void LoadSettings()
    {
        MasterVolume = PlayerPrefs.GetFloat("MasterVolume", 1f);
        MusicVolume = PlayerPrefs.GetFloat("MusicVolume", 0.8f);
        SfxVolume = PlayerPrefs.GetFloat("SfxVolume", 1f);
        Fullscreen = PlayerPrefs.GetInt("Fullscreen", 0) == 1;
        ApplySettings();
    }

    public void SaveSettings()
    {
        PlayerPrefs.SetFloat("MasterVolume", MasterVolume);
        PlayerPrefs.SetFloat("MusicVolume", MusicVolume);
        PlayerPrefs.SetFloat("SfxVolume", SfxVolume);
        PlayerPrefs.SetInt("Fullscreen", Fullscreen ? 1 : 0);
        PlayerPrefs.Save();
    }

    public void SetVolume(string channel, float value)
    {
        switch (channel)
        {
            case "master": MasterVolume = value; break;
            case "music": MusicVolume = value; break;
            case "sfx": SfxVolume = value; break;
        }
        ApplySettings();
        SaveSettings();
    }

    private void ApplySettings()
    {
        AudioListener.volume = MasterVolume;
        Screen.fullScreen = Fullscreen;
    }
}
```

---

## Autosave System

Timer-based autosave with dirty-flag tracking.

### Godot
```gdscript
class_name AutosaveSystem
extends Node

signal autosave_triggered

@export var autosave_interval: float = 300.0  # 5 minutes
@export var autosave_slot: int = 99  # Dedicated autosave slot
@export var max_autosaves: int = 3  # Rotating slots

var timer: float = 0.0
var is_dirty: bool = false
var current_rotation: int = 0

func _process(delta: float) -> void:
	if not is_dirty:
		return

	timer += delta
	if timer >= autosave_interval:
		perform_autosave()

func mark_dirty() -> void:
	is_dirty = true

func perform_autosave() -> void:
	timer = 0.0
	is_dirty = false

	var slot: int = autosave_slot + current_rotation
	current_rotation = (current_rotation + 1) % max_autosaves

	autosave_triggered.emit()
	# Caller should connect this signal and call SaveManager.save_game(slot, data)
```

---

## Save Slot Manager

Multiple save slots with metadata display.

### Godot
```gdscript
class_name SaveSlotManager
extends Node

const MAX_SLOTS: int = 5

func get_all_slots() -> Array[Dictionary]:
	var slots: Array[Dictionary] = []
	for i in range(MAX_SLOTS):
		if SaveManager.has_save(i):
			var meta: Dictionary = SaveManager.get_save_metadata(i)
			meta["slot"] = i
			meta["exists"] = true
			slots.append(meta)
		else:
			slots.append({"slot": i, "exists": false})
	return slots

func get_newest_slot() -> int:
	var newest_slot: int = -1
	var newest_time: String = ""
	for i in range(MAX_SLOTS):
		var meta: Dictionary = SaveManager.get_save_metadata(i)
		if not meta.is_empty():
			if meta.timestamp > newest_time:
				newest_time = meta.timestamp
				newest_slot = i
	return newest_slot

func format_playtime(seconds: float) -> String:
	var hours: int = int(seconds) / 3600
	var minutes: int = (int(seconds) % 3600) / 60
	return "%dh %02dm" % [hours, minutes]
```

---

## Configuration by Genre

| Genre | Save Type | What to Persist |
|-------|-----------|-----------------|
| RPG | Full JSON | Stats, inventory, quests, world, position |
| Survival | Full JSON | Needs, structures, world, inventory, day |
| Platformer | Lightweight | Level progress, high scores, coins |
| Horror | Checkpoint | Checkpoint state, evidence, settings |
| Farming | Full JSON | Farm, calendar, relationships, inventory |
| Racing | Lightweight | Best times, unlocked tracks |
| Puzzle | Lightweight | Level completion, stars, best moves |
| Roguelike | Meta only | Unlocks, currency (runs not saved) |
| Tower Defense | Lightweight | Level progress, best scores |

---

**Reference this skill** from genre templates for save/load implementations.
