---
name: horror-template
description: Horror game template with atmosphere, stalker AI, investigation, and sanity systems. Use for games like Phasmophobia, Resident Evil, or Silent Hill.
---

# Horror Template

Production-ready horror game template with multiple sub-genres.

## When to Use

- Creating horror/survival horror games
- Need stalker AI, sanity systems, limited resources
- Want investigation mechanics (ghost hunting)
- Building atmospheric, tense gameplay

## Sub-Genres Supported

1. **Investigation** (Phasmophobia) - Ghost hunting, evidence gathering
2. **Co-op Survival** (Lethal Company) - Team objectives, monster avoidance
3. **Psychological** (Silent Hill) - Sanity, reality distortion
4. **Action Horror** (Resident Evil) - Combat with limited resources
5. **Asymmetric** (Dead by Daylight) - 1v4 killer vs survivors

## Core Features

### Player Controller
**Reference**: `player-controllers` skill → First-Person or Third-Person Controller

Additional horror features:
- Flashlight with battery drain
- Stamina for sprinting (limited)
- Hiding in closets/lockers
- Lean/peek around corners

### Enemy AI
**Reference**: `enemy-ai-patterns` skill → Chase AI, Patrol AI, Boss AI

Horror-specific behaviors:
- **Stalker**: Follows at distance, random attacks
- **Hunter**: Searches player's last known location
- **Triggered**: Activates on specific conditions

### Combat (if applicable)
**Reference**: `combat-systems` skill → Limited ranged weapons

---

## Horror-Specific Systems

### Flashlight System
```gdscript
class_name Flashlight
extends SpotLight3D

@export var max_battery: float = 100.0
@export var drain_rate: float = 5.0  # Per second when on
@export var flicker_threshold: float = 20.0

var battery: float
var is_on: bool = false

signal battery_changed(current: float, maximum: float)
signal died

func _ready() -> void:
    battery = max_battery
    visible = false

func _process(delta: float) -> void:
    if is_on:
        battery -= drain_rate * delta
        battery_changed.emit(battery, max_battery)

        # Flicker when low
        if battery <= flicker_threshold:
            visible = randf() > 0.1

        if battery <= 0:
            turn_off()
            died.emit()

func toggle() -> void:
    if is_on:
        turn_off()
    elif battery > 0:
        turn_on()

func turn_on() -> void:
    is_on = true
    visible = true

func turn_off() -> void:
    is_on = false
    visible = false

func add_battery(amount: float) -> void:
    battery = minf(battery + amount, max_battery)
```

### Unity C# (Flashlight)
```csharp
using UnityEngine;

public class Flashlight : MonoBehaviour
{
    [SerializeField] private Light spotLight;
    [SerializeField] private float maxBattery = 100f;
    [SerializeField] private float drainRate = 5f;
    [SerializeField] private float flickerThreshold = 20f;

    private float battery;
    private bool isOn;

    private void Start() { battery = maxBattery; spotLight.enabled = false; }

    private void Update()
    {
        if (Input.GetKeyDown(KeyCode.F)) Toggle();
        if (!isOn) return;

        battery -= drainRate * Time.deltaTime;
        if (battery <= flickerThreshold)
            spotLight.enabled = Random.value > 0.1f;
        if (battery <= 0) { TurnOff(); }
    }

    public void Toggle() { if (isOn) TurnOff(); else if (battery > 0) TurnOn(); }
    private void TurnOn() { isOn = true; spotLight.enabled = true; }
    private void TurnOff() { isOn = false; spotLight.enabled = false; }
    public void AddBattery(float amount) => battery = Mathf.Min(battery + amount, maxBattery);
}
```

### Sanity System
```gdscript
class_name SanitySystem
extends Node

signal sanity_changed(current: float, maximum: float)
signal sanity_effect_triggered(effect: SanityEffect)
signal insanity

enum SanityEffect { WHISPERS, SHADOWS, HALLUCINATION, PARANOIA }

@export var max_sanity: float = 100.0
@export var drain_in_dark: float = 2.0  # Per second
@export var drain_near_enemy: float = 5.0
@export var recovery_in_light: float = 1.0

var current_sanity: float
var effect_thresholds: Dictionary = {
    80.0: SanityEffect.WHISPERS,
    60.0: SanityEffect.SHADOWS,
    40.0: SanityEffect.HALLUCINATION,
    20.0: SanityEffect.PARANOIA
}
var triggered_effects: Array[SanityEffect] = []

func _ready() -> void:
    current_sanity = max_sanity

func _process(delta: float) -> void:
    check_effects()

func drain(amount: float) -> void:
    current_sanity = maxf(current_sanity - amount, 0)
    sanity_changed.emit(current_sanity, max_sanity)

    if current_sanity <= 0:
        insanity.emit()

func recover(amount: float) -> void:
    current_sanity = minf(current_sanity + amount, max_sanity)
    sanity_changed.emit(current_sanity, max_sanity)

func check_effects() -> void:
    for threshold in effect_thresholds:
        if current_sanity <= threshold:
            var effect: SanityEffect = effect_thresholds[threshold]
            if effect not in triggered_effects:
                triggered_effects.append(effect)
                sanity_effect_triggered.emit(effect)
```

### Unity C# (Sanity)
```csharp
using UnityEngine;
using UnityEngine.Events;

public class SanitySystem : MonoBehaviour
{
    [SerializeField] private float maxSanity = 100f;
    [SerializeField] private float drainInDark = 2f;
    [SerializeField] private float drainNearEnemy = 5f;

    public float CurrentSanity { get; private set; }
    public UnityEvent<float, float> OnSanityChanged;
    public UnityEvent OnInsanity;

    private readonly float[] thresholds = { 80f, 60f, 40f, 20f };
    private readonly string[] effects = { "Whispers", "Shadows", "Hallucination", "Paranoia" };
    private int triggeredLevel = -1;

    private void Start() => CurrentSanity = maxSanity;

    public void Drain(float amount)
    {
        CurrentSanity = Mathf.Max(CurrentSanity - amount, 0);
        OnSanityChanged?.Invoke(CurrentSanity, maxSanity);
        CheckEffects();
        if (CurrentSanity <= 0) OnInsanity?.Invoke();
    }

    public void Recover(float amount)
    {
        CurrentSanity = Mathf.Min(CurrentSanity + amount, maxSanity);
        OnSanityChanged?.Invoke(CurrentSanity, maxSanity);
    }

    private void CheckEffects()
    {
        for (int i = 0; i < thresholds.Length; i++)
            if (CurrentSanity <= thresholds[i] && i > triggeredLevel)
            {
                triggeredLevel = i;
                Debug.Log($"Sanity effect: {effects[i]}");
            }
    }
}
```

### Investigation System (Ghost Hunting)
```gdscript
class_name InvestigationSystem
extends Node

signal evidence_found(evidence: EvidenceType)
signal ghost_identified(ghost_type: String)

enum EvidenceType { EMF_5, FREEZING, SPIRIT_BOX, GHOST_WRITING, FINGERPRINTS, GHOST_ORB, DOTS }

var found_evidence: Array[EvidenceType] = []
var ghost_database: Dictionary = {
    "Spirit": [EvidenceType.EMF_5, EvidenceType.SPIRIT_BOX, EvidenceType.GHOST_WRITING],
    "Wraith": [EvidenceType.EMF_5, EvidenceType.SPIRIT_BOX, EvidenceType.DOTS],
    "Phantom": [EvidenceType.SPIRIT_BOX, EvidenceType.FINGERPRINTS, EvidenceType.DOTS],
    # Add more ghost types...
}

func add_evidence(evidence: EvidenceType) -> void:
    if evidence not in found_evidence:
        found_evidence.append(evidence)
        evidence_found.emit(evidence)
        check_identification()

func check_identification() -> void:
    if found_evidence.size() < 3:
        return

    for ghost_type in ghost_database:
        var ghost_evidence: Array = ghost_database[ghost_type]
        var matches := 0
        for e in found_evidence:
            if e in ghost_evidence:
                matches += 1
        if matches >= 3:
            ghost_identified.emit(ghost_type)
            return

func get_possible_ghosts() -> Array[String]:
    var possible: Array[String] = []
    for ghost_type in ghost_database:
        var ghost_evidence: Array = ghost_database[ghost_type]
        var valid := true
        for e in found_evidence:
            if e not in ghost_evidence:
                valid = false
                break
        if valid:
            possible.append(ghost_type)
    return possible
```

### Equipment (Investigation Tools)
```gdscript
class_name GhostEquipment
extends Node3D

enum EquipmentType { EMF_READER, THERMOMETER, SPIRIT_BOX, UV_LIGHT, CAMERA, DOTS_PROJECTOR }

@export var equipment_type: EquipmentType
@export var detection_range: float = 5.0

var is_active: bool = false

signal reading_changed(value: float)
signal evidence_detected(evidence: InvestigationSystem.EvidenceType)

func _process(_delta: float) -> void:
    if not is_active:
        return

    match equipment_type:
        EquipmentType.EMF_READER:
            check_emf()
        EquipmentType.THERMOMETER:
            check_temperature()
        EquipmentType.SPIRIT_BOX:
            check_spirit_box()

func check_emf() -> void:
    # Check for ghost activity nearby
    var ghosts := get_tree().get_nodes_in_group("ghost")
    for ghost in ghosts:
        var dist := global_position.distance_to(ghost.global_position)
        if dist <= detection_range:
            var level := int(5 - (dist / detection_range) * 4)
            reading_changed.emit(level)
            if level >= 5:
                evidence_detected.emit(InvestigationSystem.EvidenceType.EMF_5)
```

### Stalker Enemy AI
```gdscript
class_name StalkerEnemy
extends CharacterBody3D

enum State { WANDER, STALK, HUNT, ATTACK, RETREAT }

@export var wander_speed: float = 2.0
@export var stalk_speed: float = 3.0
@export var hunt_speed: float = 5.0
@export var stalk_distance: float = 15.0
@export var attack_distance: float = 3.0
@export var hunt_duration: float = 30.0

var current_state: State = State.WANDER
var target: Node3D
var hunt_timer: float = 0.0

@onready var nav_agent: NavigationAgent3D = $NavigationAgent3D

func _ready() -> void:
    target = get_tree().get_first_node_in_group("player")

func _physics_process(delta: float) -> void:
    match current_state:
        State.WANDER:
            process_wander(delta)
        State.STALK:
            process_stalk(delta)
        State.HUNT:
            process_hunt(delta)
        State.ATTACK:
            process_attack(delta)

func process_wander(delta: float) -> void:
    # Random movement, occasionally check for player
    if randf() < 0.01:  # 1% chance per frame to start stalking
        if can_sense_player():
            change_state(State.STALK)

func process_stalk(delta: float) -> void:
    # Follow at a distance
    var dist := global_position.distance_to(target.global_position)

    if dist > stalk_distance * 1.5:
        # Lost player
        change_state(State.WANDER)
    elif dist < attack_distance:
        change_state(State.ATTACK)
    elif should_start_hunt():
        change_state(State.HUNT)
    else:
        # Maintain stalking distance
        nav_agent.target_position = target.global_position
        move_at_speed(stalk_speed, delta)

func process_hunt(delta: float) -> void:
    hunt_timer -= delta

    if hunt_timer <= 0:
        change_state(State.STALK)
        return

    nav_agent.target_position = target.global_position
    move_at_speed(hunt_speed, delta)

    if global_position.distance_to(target.global_position) < attack_distance:
        change_state(State.ATTACK)

func should_start_hunt() -> bool:
    return randf() < 0.001  # Random chance to start hunting

func change_state(new_state: State) -> void:
    current_state = new_state
    if new_state == State.HUNT:
        hunt_timer = hunt_duration

func can_sense_player() -> bool:
    return global_position.distance_to(target.global_position) < stalk_distance
```

---

## Level Structure

```
HorrorLevel (Node3D)
├── WorldEnvironment (dark, fog)
├── Lighting (dim, flickering)
├── NavigationRegion3D
│   └── LevelGeometry
├── Player
├── Ghost/Enemy (spawned dynamically)
├── HidingSpots (Area3D triggers)
│   ├── Closet1
│   └── Locker1
├── EquipmentSpawns
│   └── EMFReader, Thermometer, etc.
├── EvidenceLocations
│   └── GhostRoom markers
├── Audio
│   ├── Ambient (creepy atmosphere)
│   └── Stingers (jump scare sounds)
└── Triggers
    └── ScareEvents
```

---

## Customization Options

**Sub-Genre**:
- Investigation (Phasmophobia)
- Survival (Resident Evil)
- Psychological (Silent Hill)
- Asymmetric (Dead by Daylight)

**Multiplayer**:
- Solo
- 2-4 player co-op
- 1v4 asymmetric

**Enemy Type**:
- Ghost (intangible, teleports)
- Monster (physical, chases)
- Stalker (follows, attacks randomly)

**Resource Scarcity**:
- Abundant (action focus)
- Limited (survival focus)
- None (pure stealth)

---

**Remember**: Horror games need atmosphere (lighting, sound), tension (limited resources, unpredictable enemies), and release (safe rooms, progress). Balance scares with breathing room.
