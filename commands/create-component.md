---
description: Create a reusable game component (health system, enemy AI, player controller, etc.) with customization options. Auto-detects engine or asks user.
---

# Create Component Command

## What This Command Does

Creates production-ready game components that work across engines:
- ✅ Health systems (with regeneration, shields, damage types)
- ✅ Enemy AI (patrol, chase, turret, flying)
- ✅ Player controllers (platformer, top-down, FPS, third-person)
- ✅ Movement systems (dash, jump, climb, swim)
- ✅ Inventory systems (items, equipment, stacking)
- ✅ Interaction systems (doors, pickups, NPCs)

Each component includes:
- Clean, engine-specific code
- Customization options via questions
- Usage examples
- Event/signal documentation

## When to Use

- Need a health system
- Want enemy AI
- Creating player movement
- Building inventory
- Need any reusable component

## How It Works

The **component-builder** agent will:

1. **Detect or ask for engine** (Godot, Unity, Unreal, Roblox, Web)
2. **Ask what component** you need
3. **Ask customization questions** specific to that component
4. **Generate complete code** following engine patterns
5. **Provide usage example** showing how to attach and use

## Example Usage

### Example 1: Health Component

```
User: /create-component health system

Agent: I'll create a health component for you!

[Auto-detects Godot from project structure]

Questions:

1. Max health?
   → 50
   → 100 ✓
   → 200
   → Custom

2. Health regeneration?
   → None ✓
   → Slow (1 HP/sec)
   → Fast (5 HP/sec)
   → Custom rate

3. Damage types?
   → Single (all damage same)
   → Multiple (Physical, Magic, Fire, etc.) ✓

4. Shield/Armor?
   → None ✓
   → Shield (absorbs damage first)
   → Armor (reduces damage %)
   → Both

5. On death?
   → Destroy object ✓
   → Respawn at checkpoint
   → Disable and show game over
   → Custom callback

[User answers: 100, None, Multiple, None, Destroy]

Creating health component for Godot...

✅ Created: HealthComponent.gd

```gdscript
class_name HealthComponent
extends Node

signal health_changed(current: int, maximum: int)
signal damage_taken(amount: int, damage_type: String)
signal died

@export var max_health: int = 100

var current_health: int = max_health

func take_damage(amount: int, damage_type: String = "physical") -> void:
    current_health = maxi(0, current_health - amount)
    damage_taken.emit(amount, damage_type)
    health_changed.emit(current_health, max_health)

    if current_health <= 0:
        died.emit()
        owner.queue_free()

func heal(amount: int) -> void:
    current_health = mini(max_health, current_health + amount)
    health_changed.emit(current_health, max_health)

func get_health_percentage() -> float:
    return current_health / float(max_health)
```

## Usage Example

Add HealthComponent as child of your player/enemy:

```gdscript
# player.gd
@onready var health: HealthComponent = $HealthComponent

func _ready() -> void:
    health.health_changed.connect(_on_health_changed)
    health.died.connect(_on_died)

func _on_health_changed(current: int, maximum: int) -> void:
    $HealthBar.value = (current / float(maximum)) * 100.0

func _on_died() -> void:
    print("Player died!")
```

Component created successfully!
```

### Example 2: Enemy AI

```
User: /create-component enemy AI that patrols and chases player

Agent: Creating enemy AI component!

[Detects Unity from .unity files]

Questions:

1. AI behavior?
   → Patrol only
   → Chase only
   → Patrol, then chase when player near ✓
   → Turret (stationary, rotate to aim)
   → Flying (pattern movement)

2. Detection range?
   → 5 meters (close)
   → 10 meters (medium) ✓
   → 20 meters (far)
   → Custom

3. Movement speed?
   → Slow (2 m/s)
   → Medium (5 m/s) ✓
   → Fast (10 m/s)

4. Attack pattern?
   → Melee (touch to damage) ✓
   → Ranged (shoot projectiles)
   → Both

[User answers shown above]

Creating Unity enemy AI component...

✅ Created: EnemyAI.cs

```csharp
using UnityEngine;

public class EnemyAI : MonoBehaviour
{
    [Header("Detection")]
    [SerializeField] private float detectionRange = 10f;
    [SerializeField] private LayerMask playerLayer;

    [Header("Movement")]
    [SerializeField] private float patrolSpeed = 2f;
    [SerializeField] private float chaseSpeed = 5f;
    [SerializeField] private float patrolDistance = 5f;

    [Header("Combat")]
    [SerializeField] private int meleeDamage = 10;

    private Transform player;
    private Vector3 startPosition;
    private int patrolDirection = 1;
    private bool isChasing = false;

    private void Start()
    {
        startPosition = transform.position;
        player = GameObject.FindGameObjectWithTag("Player")?.transform;
    }

    private void Update()
    {
        if (PlayerInRange())
        {
            ChasePlayer();
        }
        else
        {
            Patrol();
        }
    }

    private bool PlayerInRange()
    {
        if (player == null) return false;
        return Vector3.Distance(transform.position, player.position) < detectionRange;
    }

    private void ChasePlayer()
    {
        isChasing = true;
        Vector3 direction = (player.position - transform.position).normalized;
        transform.position += direction * chaseSpeed * Time.deltaTime;
    }

    private void Patrol()
    {
        isChasing = false;
        transform.position += Vector3.right * patrolDirection * patrolSpeed * Time.deltaTime;

        if (Mathf.Abs(transform.position.x - startPosition.x) > patrolDistance)
        {
            patrolDirection *= -1;
        }
    }

    private void OnCollisionEnter(Collision collision)
    {
        if (collision.gameObject.CompareTag("Player"))
        {
            var health = collision.gameObject.GetComponent<HealthComponent>();
            if (health != null)
            {
                health.TakeDamage(meleeDamage);
            }
        }
    }
}
```

## Usage
1. Attach to enemy GameObject
2. Assign player layer in inspector
3. Tag player as "Player"
4. Adjust ranges and speeds as needed

Component created!
```

### Example 3: Player Controller

```
User: /create-component player controller for top-down game

Agent: Creating player controller!

Questions:

1. Movement type?
   → 4-directional (up/down/left/right)
   → 8-directional (diagonal movement) ✓
   → Free rotation (tank controls)

2. Speed?
   → Slow (100)
   → Medium (200) ✓
   → Fast (400)

3. Sprint ability?
   → Yes ✓
   → No

4. Dodge/Roll?
   → Yes ✓
   → No

[Creates complete player controller with WASD movement, sprint on Shift, dodge on Space]
```

## Available Component Types

### Movement Components
- Player controller (platformer, top-down, FPS, third-person)
- Enemy AI (patrol, chase, flying, turret)
- Vehicle controller
- Swimming/flying movement

### Combat Components
- Health system
- Damage dealer
- Projectile
- Melee attack
- Shield/armor

### Interaction Components
- Interactable objects
- Door system
- Pickup items
- NPC dialogue trigger

### Progression Components
- Experience/leveling
- Inventory
- Quest tracker
- Achievement system

### Utility Components
- Timer
- Object pooler
- Save/load handler
- Audio manager

## Engine Adaptations

### Godot
- Node-based components
- Signals for events
- @export for properties
- Type hints mandatory

### Unity
- MonoBehaviour components
- UnityEvents/C# events
- [SerializeField] for inspector
- XML documentation

### Unreal
- ActorComponent subclasses
- Delegates for events
- UPROPERTY macros
- Blueprint-friendly

### Roblox
- ModuleScript pattern
- Strict Luau typing
- RemoteEvents for networking
- Type exports

### JavaScript/Web
- Class-based
- Event emitters
- Module exports
- TypeScript optional

---

**Build reusable components for any game!** Just run `/create-component` and specify what you need.
