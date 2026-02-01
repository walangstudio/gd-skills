---
description: Analyze and fix an existing game project. Scans for bugs, anti-patterns, missing features, and provides improvement recommendations.
---

# Debug Existing Game Command

## What This Command Does

Performs a full audit of an existing game project:
- ✅ Code quality scan (anti-patterns, bugs)
- ✅ Architecture review (scene structure, autoloads)
- ✅ Performance audit (hot paths, memory usage)
- ✅ Missing feature detection (no pause menu, no save system)
- ✅ Engine best-practices check
- ✅ Improvement roadmap

## How It Works

1. **Scan the full project** structure
2. **Identify the engine** and framework
3. **Run all debugger agents** in sequence:
   - Performance scan
   - Physics scan
   - AI scan (if enemies exist)
   - Audio scan
   - Network scan (if multiplayer)
4. **Check for missing essentials**:
   - Pause menu
   - Settings screen
   - Save/load system
   - Input rebinding
   - Audio bus configuration
5. **Generate improvement report**

## Example Usage

```
User: /debug-existing

Agent: Scanning your project...

## Project Audit Report

### Project: Space Shooter (Godot 4.3)
- 23 scenes, 45 scripts, 120 assets
- Genre: Top-down shooter

### Critical Issues (3)
1. enemy.gd:67 - Memory leak: enemies never queue_free()
2. player.gd:34 - Physics in _process instead of _physics_process
3. No save system detected

### Warnings (7)
1. No pause menu
2. Audio bus layout: only Master bus
3. 5 scripts with print() in hot paths
...

### Recommendations
1. Add pause menu (Priority: High)
2. Implement save/load (Priority: High)
3. Configure audio buses (Priority: Medium)
4. Add object pooling for projectiles (Priority: Medium)
5. Add screen shake on hits (Priority: Low - polish)
```

---

**Audit your existing game!** Run `/debug-existing` to get a full report.
