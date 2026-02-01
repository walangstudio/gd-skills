---
description: Add juice and polish to your game with screen shake, particles, coyote time, hit stop, and visual feedback. Makes games feel satisfying.
---

# Add Game Feel Command

## What This Command Does

Adds juice and polish to make your game feel amazing:
- ✅ Screen shake (trauma-based)
- ✅ Coyote time and jump buffer (platformers)
- ✅ Hit stop / freeze frames (combat)
- ✅ Particle effects (landing, hit, death)
- ✅ Camera effects (punch, zoom, lerp)
- ✅ Visual feedback (flash, squash & stretch)
- ✅ Audio layering and pitch variation
- ✅ Controller vibration

## How It Works

1. **Analyze existing game code**

2. **Ask what needs improvement**:
   - Movement (stiff, floaty, unresponsive)
   - Combat (hits feel weak, no impact)
   - Camera (too rigid, nauseating)
   - UI (boring, no feedback)
   - Everything

3. **Route to game-feel-specialist agent**

4. **Apply targeted improvements**

## What Gets Added

### Movement Polish
- Acceleration/friction curves
- Coyote time (0.1s grace period)
- Jump buffer (0.15s input memory)
- Variable jump height
- Landing squash animation
- Dust particles on run/land

### Combat Polish
- Screen shake on hit
- Hit stop (50ms freeze frame)
- Enemy flash white on damage
- Damage number popups
- Particle burst on impact
- Controller vibration on heavy hits
- Camera punch toward action

### Camera Polish
- Smooth follow with damping
- Look-ahead (toward movement)
- Trauma-based shake system
- Dynamic FOV (sprint widens)

### Audio Polish
- Pitch variation on repeated sounds
- Audio ducking (lower music during action)
- Layered impact sounds
- Footstep variation

## Boilerplate Code

### Screen Shake (Trauma-Based)
```gdscript
# Attach to Camera2D
class_name ShakeCamera
extends Camera2D

@export var decay: float = 0.8
@export var max_offset: Vector2 = Vector2(10, 8)
@export var max_rotation: float = 2.0

var trauma: float = 0.0

func add_trauma(amount: float) -> void:
    trauma = minf(trauma + amount, 1.0)

func _process(delta: float) -> void:
    if trauma > 0:
        var shake := trauma * trauma  # Quadratic falloff
        offset.x = max_offset.x * shake * randf_range(-1, 1)
        offset.y = max_offset.y * shake * randf_range(-1, 1)
        rotation = deg_to_rad(max_rotation * shake * randf_range(-1, 1))
        trauma = maxf(trauma - decay * delta, 0)
    else:
        offset = Vector2.ZERO
        rotation = 0
```

### Coyote Time + Jump Buffer
```gdscript
# Add to your platformer controller
@export var coyote_time: float = 0.1
@export var jump_buffer_time: float = 0.15

var coyote_timer: float = 0.0
var jump_buffer_timer: float = 0.0

func _physics_process(delta: float) -> void:
    # Coyote time — allow jump briefly after leaving edge
    if is_on_floor():
        coyote_timer = coyote_time
    else:
        coyote_timer -= delta

    # Jump buffer — remember jump press before landing
    if Input.is_action_just_pressed("jump"):
        jump_buffer_timer = jump_buffer_time
    else:
        jump_buffer_timer -= delta

    # Jump if either grace period is active
    if jump_buffer_timer > 0 and coyote_timer > 0:
        velocity.y = jump_velocity
        coyote_timer = 0
        jump_buffer_timer = 0
```

### Hit Stop (Freeze Frame)
```gdscript
func hit_stop(duration: float = 0.05) -> void:
    Engine.time_scale = 0.0
    await get_tree().create_timer(duration, true, false, true).timeout
    Engine.time_scale = 1.0
```

### Before / After

| Aspect | Before | After |
|--------|--------|-------|
| Jumping | Stiff, unforgiving | Coyote time + jump buffer = responsive |
| Combat hits | Enemy HP drops silently | Screen shake + hit stop + flash + particles |
| Camera | Locked rigidly to player | Smooth follow with look-ahead and shake |
| Landing | Nothing happens | Squash animation + dust particles + thud SFX |
| Repeated SFX | Same sound every time | Pitch variation (0.9-1.1) feels natural |

## Files Created

```
src/
├── effects/
│   ├── ScreenShake.gd        # Trauma-based camera shake
│   ├── HitStop.gd            # Freeze frame effect
│   └── FlashEffect.gd        # White flash on damage
├── player/
│   └── CoyoteTime.gd         # Coyote + jump buffer
└── particles/
    ├── hit_particles.tscn
    ├── dust_particles.tscn
    └── death_particles.tscn
```

---

**Make your game feel amazing!** Run `/add-game-feel` to add juice and polish.
