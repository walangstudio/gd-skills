# Example: Debugging a Game

This walkthrough shows how to use `/debug-game` and `/debug-existing` to find and fix issues.

## Session 1: Specific Issue

```
User: /debug-game

Agent: What issue are you experiencing?
→ Physics (jittering, tunneling, stuck) ✓

[Routes to physics-debugger agent]
[Scans codebase...]

## Physics Report

### Critical
- player.gd:45 - Physics movement in _process() instead of _physics_process()
  → Fix: Move move_and_slide() to _physics_process()

- enemy.gd:23 - Setting global_position directly on CharacterBody3D
  → Fix: Use velocity + move_and_slide() instead

### Warning
- player.gd:78 - Missing floor_snap_length (causes edge jitter)
  → Fix: Set floor_snap_length = 0.5

### Info
- Collision layers not configured (everything on layer 1)
  → Recommended: Separate player, enemies, world, triggers

Agent: Want me to apply these fixes?
User: Yes

[Applies fixes...]
✅ All physics issues fixed.
```

## Session 2: Full Project Audit

```
User: /debug-existing

[Scanning project structure...]
[Running all debugger agents...]

## Project Audit: Space Shooter (Godot 4.3)
- 23 scenes, 45 scripts, 120 assets

### Critical Issues (3)
1. enemy.gd:67 - Memory leak: enemies never queue_free() after death
2. player.gd:34 - Physics in _process, should be _physics_process
3. No save system detected

### Warnings (5)
1. No pause menu
2. Audio: only Master bus (no SFX/Music separation)
3. 5 scripts with print() in hot paths
4. No object pooling for projectiles (50+ instantiated per second)
5. Enemy AI: distance-only detection (no line-of-sight raycast)

### Recommendations
1. Add pause menu (Priority: High)
2. Implement save/load system (Priority: High)
3. Configure audio buses (Priority: Medium)
4. Add object pooling (Priority: Medium)
5. Add screen shake on hits (Priority: Low - polish)
```

## What Agents Were Used
- `performance-debugger` → FPS, memory, allocation issues
- `physics-debugger` → Jittering, tunneling, collision layers
- `ai-debugger` → Enemy pathfinding and detection
- `audio-debugger` → Sound and bus configuration
