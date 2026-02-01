---
description: Debug your game by analyzing code for performance issues, physics bugs, AI problems, audio glitches, or networking desync. Routes to specialized debugger agents.
---

# Debug Game Command

## What This Command Does

Analyzes your game code and identifies bugs, performance issues, and common problems:
- ✅ Performance profiling (FPS drops, memory leaks, GC)
- ✅ Physics debugging (jittering, tunneling, stuck collisions)
- ✅ AI debugging (broken pathfinding, stuck enemies, detection)
- ✅ Audio debugging (no sound, distortion, spatial issues)
- ✅ Network debugging (desync, lag, authority problems)

## How It Works

1. **Ask what's wrong** via AskUserQuestion:
   - Performance (FPS drops, stuttering)
   - Physics (jittering, tunneling, stuck)
   - AI (enemies stuck, not detecting, erratic)
   - Audio (no sound, distortion, music)
   - Networking (desync, lag, connection)
   - Not sure (run all checks)

2. **Route to specialist debugger agent**:
   - Performance → `performance-debugger`
   - Physics → `physics-debugger`
   - AI → `ai-debugger`
   - Audio → `audio-debugger`
   - Network → `network-debugger`

3. **Scan codebase** for common issues

4. **Report findings** with severity and fixes

## Example Usage

```
User: /debug-game

Agent: What issue are you experiencing?
→ Performance (FPS drops, stuttering) ✓

[Scanning codebase...]

## Performance Report

### Critical
- player.gd:45 - Creating Label node every frame in _process → Use object pooling
- enemy_spawner.gd:23 - 200 enemies with individual _process → Use batch processing

### Warning
- main.gd:12 - print() left in _process → Remove debug prints
- tilemap.gd:89 - Rebuilding navigation every frame → Cache navigation

### Info
- 15 scenes loaded at startup → Consider lazy loading
- No texture compression configured → Enable GPU compression
```

---

**Debug your game!** Run `/debug-game` to identify and fix issues.
