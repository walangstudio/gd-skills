---
name: audio-systems
description: Reusable audio implementations (AudioManager singleton, music crossfade, SFX pooling, spatial audio, bus layout). Reference from genre templates.
---

# Audio Systems

Production-ready audio management for all game types and engines.

## When to Use

Referenced by every genre template — all games need audio:
- **Platformer Template** → Music per world, SFX (jump, coin, damage)
- **FPS Template** → Weapon sounds, spatial enemy audio, ambient
- **Horror Template** → Atmospheric ambient, stingers, spatial 3D
- **RPG Template** → Area music, combat music, dialogue voice
- **Survival Template** → Dynamic ambient (day/night), crafting SFX
- **Farming Template** → Seasonal music, tool SFX, festival tracks
- **Racing Template** → Engine sounds, boost SFX, position-based music
- **Puzzle Template** → Calm BGM, move SFX, solve fanfare
- **Roguelike Template** → Per-floor music, combat intensity layers
- **Tower Defense Template** → Wave music, tower placement SFX

---

## AudioManager Singleton

Central audio controller as an autoload/singleton.

### Godot
```gdscript
class_name AudioManager
extends Node

# Music players (two for crossfade)
var music_a: AudioStreamPlayer
var music_b: AudioStreamPlayer
var active_music: AudioStreamPlayer

# SFX pool
var sfx_pool: Array[AudioStreamPlayer] = []
var sfx_pool_size: int = 16
var sfx_index: int = 0

# Cached sounds
var sfx_cache: Dictionary = {}  # name -> AudioStream

func _ready() -> void:
	# Create music players
	music_a = AudioStreamPlayer.new()
	music_a.bus = "Music"
	add_child(music_a)

	music_b = AudioStreamPlayer.new()
	music_b.bus = "Music"
	music_b.volume_db = -80.0
	add_child(music_b)

	active_music = music_a

	# Create SFX pool
	for i in range(sfx_pool_size):
		var player := AudioStreamPlayer.new()
		player.bus = "SFX"
		add_child(player)
		sfx_pool.append(player)

func play_music(stream: AudioStream, fade_duration: float = 1.0) -> void:
	if active_music.stream == stream and active_music.playing:
		return

	var old_player: AudioStreamPlayer = active_music
	var new_player: AudioStreamPlayer = music_b if active_music == music_a else music_a
	active_music = new_player

	new_player.stream = stream
	new_player.volume_db = -80.0
	new_player.play()

	# Crossfade
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(old_player, "volume_db", -80.0, fade_duration)
	tween.tween_property(new_player, "volume_db", 0.0, fade_duration)
	tween.chain().tween_callback(old_player.stop)

func stop_music(fade_duration: float = 1.0) -> void:
	var tween := create_tween()
	tween.tween_property(active_music, "volume_db", -80.0, fade_duration)
	tween.tween_callback(active_music.stop)

func play_sfx(sound_name: String, pitch_variation: float = 0.0) -> void:
	var stream: AudioStream = get_sfx(sound_name)
	if stream == null:
		return

	var player: AudioStreamPlayer = sfx_pool[sfx_index]
	sfx_index = (sfx_index + 1) % sfx_pool_size

	player.stream = stream
	if pitch_variation > 0:
		player.pitch_scale = 1.0 + randf_range(-pitch_variation, pitch_variation)
	else:
		player.pitch_scale = 1.0
	player.play()

func get_sfx(sound_name: String) -> AudioStream:
	if sfx_cache.has(sound_name):
		return sfx_cache[sound_name]

	var path: String = "res://audio/sfx/%s.ogg" % sound_name
	if ResourceLoader.exists(path):
		var stream: AudioStream = load(path)
		sfx_cache[sound_name] = stream
		return stream
	return null

func set_bus_volume(bus_name: String, linear: float) -> void:
	var bus_idx: int = AudioServer.get_bus_index(bus_name)
	if bus_idx >= 0:
		AudioServer.set_bus_volume_db(bus_idx, linear_to_db(linear))

func get_bus_volume(bus_name: String) -> float:
	var bus_idx: int = AudioServer.get_bus_index(bus_name)
	if bus_idx >= 0:
		return db_to_linear(AudioServer.get_bus_volume_db(bus_idx))
	return 1.0
```

### Unity C#
```csharp
using UnityEngine;
using UnityEngine.Audio;
using System.Collections;
using System.Collections.Generic;

public class AudioManager : MonoBehaviour
{
    public static AudioManager Instance { get; private set; }

    [Header("Mixer")]
    [SerializeField] private AudioMixerGroup musicGroup;
    [SerializeField] private AudioMixerGroup sfxGroup;

    [Header("Pool")]
    [SerializeField] private int sfxPoolSize = 16;

    private AudioSource musicSourceA;
    private AudioSource musicSourceB;
    private AudioSource activeMusic;
    private List<AudioSource> sfxPool = new();
    private int sfxIndex;
    private Dictionary<string, AudioClip> sfxCache = new();

    private void Awake()
    {
        if (Instance != null) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);

        musicSourceA = CreateAudioSource("MusicA", musicGroup, true);
        musicSourceB = CreateAudioSource("MusicB", musicGroup, true);
        activeMusic = musicSourceA;

        for (int i = 0; i < sfxPoolSize; i++)
            sfxPool.Add(CreateAudioSource($"SFX_{i}", sfxGroup, false));
    }

    private AudioSource CreateAudioSource(string name, AudioMixerGroup group, bool loop)
    {
        var go = new GameObject(name);
        go.transform.SetParent(transform);
        var source = go.AddComponent<AudioSource>();
        source.outputAudioMixerGroup = group;
        source.loop = loop;
        return source;
    }

    public void PlayMusic(AudioClip clip, float fadeDuration = 1f)
    {
        if (activeMusic.clip == clip && activeMusic.isPlaying) return;
        var oldSource = activeMusic;
        activeMusic = (activeMusic == musicSourceA) ? musicSourceB : musicSourceA;
        activeMusic.clip = clip;
        activeMusic.volume = 0f;
        activeMusic.Play();
        StartCoroutine(Crossfade(oldSource, activeMusic, fadeDuration));
    }

    private IEnumerator Crossfade(AudioSource from, AudioSource to, float duration)
    {
        float t = 0;
        while (t < duration)
        {
            t += Time.deltaTime;
            float progress = t / duration;
            from.volume = 1f - progress;
            to.volume = progress;
            yield return null;
        }
        from.Stop();
        from.volume = 0f;
        to.volume = 1f;
    }

    public void PlaySFX(string clipName, float pitchVariation = 0f)
    {
        AudioClip clip = GetSFX(clipName);
        if (clip == null) return;
        var source = sfxPool[sfxIndex];
        sfxIndex = (sfxIndex + 1) % sfxPoolSize;
        source.clip = clip;
        source.pitch = 1f + Random.Range(-pitchVariation, pitchVariation);
        source.Play();
    }

    private AudioClip GetSFX(string name)
    {
        if (sfxCache.TryGetValue(name, out var clip)) return clip;
        clip = Resources.Load<AudioClip>($"Audio/SFX/{name}");
        if (clip != null) sfxCache[name] = clip;
        return clip;
    }
}
```

---

## Spatial Audio (3D)

Positional sound for 3D games (footsteps, gunshots, ambient zones).

### Godot
```gdscript
class_name SpatialSFX
extends AudioStreamPlayer3D

@export var sound_name: String
@export var auto_play_on_ready: bool = false
@export var pitch_variation: float = 0.05

func _ready() -> void:
	bus = "SFX"
	max_distance = 30.0
	attenuation_model = ATTENUATION_INVERSE_DISTANCE
	if auto_play_on_ready:
		play_sound()

func play_sound() -> void:
	var sfx: AudioStream = AudioManager.get_sfx(sound_name)
	if sfx:
		stream = sfx
		pitch_scale = 1.0 + randf_range(-pitch_variation, pitch_variation)
		play()

# Ambient zone: plays looping spatial audio when player is inside
class_name AmbientZone
extends Area3D

@export var ambient_stream: AudioStream
@export var volume_db: float = -10.0

@onready var player: AudioStreamPlayer3D = $AudioStreamPlayer3D

func _on_body_entered(body: Node3D) -> void:
	if body.is_in_group("player"):
		player.stream = ambient_stream
		player.volume_db = volume_db
		player.play()

func _on_body_exited(body: Node3D) -> void:
	if body.is_in_group("player"):
		var tween := create_tween()
		tween.tween_property(player, "volume_db", -80.0, 1.0)
		tween.tween_callback(player.stop)
```

---

## Audio Bus Layout

Recommended bus hierarchy for all games:

```
Master (idx 0)
├── Music (idx 1)
│   ├── BGM
│   └── Stingers
├── SFX (idx 2)
│   ├── Weapons
│   ├── Footsteps
│   └── UI
├── Ambient (idx 3)
│   ├── Nature
│   └── Weather
└── Voice (idx 4)
    ├── Dialogue
    └── Announcer
```

### Godot Setup
Create this in `default_bus_layout.tres` or via Project Settings → Audio → Buses.

### Unity Setup
Create an `AudioMixer` asset with groups matching this hierarchy. Expose volume parameters for settings UI.

---

## Dynamic Music System

Switch music based on game state (combat, exploration, menu).

### Godot
```gdscript
class_name DynamicMusicManager
extends Node

enum MusicState { MENU, EXPLORATION, COMBAT, BOSS, VICTORY, GAME_OVER }

var music_tracks: Dictionary = {
	MusicState.MENU: preload("res://audio/music/menu.ogg"),
	MusicState.EXPLORATION: preload("res://audio/music/explore.ogg"),
	MusicState.COMBAT: preload("res://audio/music/combat.ogg"),
	MusicState.BOSS: preload("res://audio/music/boss.ogg"),
	MusicState.VICTORY: preload("res://audio/music/victory.ogg"),
	MusicState.GAME_OVER: preload("res://audio/music/game_over.ogg"),
}

var current_state: MusicState = MusicState.MENU

func change_state(new_state: MusicState) -> void:
	if new_state == current_state:
		return
	current_state = new_state
	if music_tracks.has(new_state):
		AudioManager.play_music(music_tracks[new_state])

func enter_combat() -> void:
	change_state(MusicState.COMBAT)

func exit_combat() -> void:
	change_state(MusicState.EXPLORATION)

func enter_boss() -> void:
	change_state(MusicState.BOSS)
```

---

## Configuration by Genre

| Genre | Music Style | Key SFX | Spatial? |
|-------|------------|---------|----------|
| Platformer | Per-world BGM, boss theme | Jump, coin, damage, victory | No (2D) |
| FPS | Combat intensity, ambient | Weapons, reload, footsteps, hit | Yes (3D) |
| Horror | Dark ambient, stingers | Footsteps, doors, heartbeat | Yes (3D) |
| RPG | Area themes, battle music | Sword, magic, UI, dialogue | Optional |
| Survival | Dynamic day/night ambient | Tools, crafting, animals | Yes (3D) |
| Farming | Seasonal BGM, festival | Tools, animals, UI, rain | No (2D) |
| Racing | High-energy, speed-dependent | Engine, boost, crash, crowd | Yes (3D) |
| Puzzle | Calm BGM, increasing tempo | Move, solve, star, undo | No |
| Roguelike | Per-floor themes, boss | Weapons, items, level-up | Optional |

---

**Reference this skill** from genre templates for audio implementations.
