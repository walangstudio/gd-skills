---
description: Create a game level with proper scene structure, spawn points, objectives, lighting, and navigation. Works with any genre and engine.
---

# Create Level Command

## What This Command Does

Creates a complete game level with:
- ✅ Scene hierarchy (environment, spawns, triggers)
- ✅ Player spawn point
- ✅ Enemy spawn points or placements
- ✅ Objectives and triggers (win condition, checkpoints)
- ✅ Navigation mesh (3D) or tilemap (2D)
- ✅ Lighting and environment setup
- ✅ Audio zones (ambient, music triggers)

## How It Works

1. **Ask customization questions**:
   - Game genre (FPS, platformer, RPG, etc.)
   - Level type (Linear, Open, Arena, Hub)
   - Environment (Indoor, Outdoor, Underground, Space)
   - Difficulty placement (Easy start, hard end)
   - Engine (Godot, Unity, Unreal)

2. **Generate level scene** with proper structure

3. **Add gameplay elements** based on genre

## Level Types

- **Linear**: Start → corridors → encounters → boss → end
- **Open World**: Hub with branching paths, points of interest
- **Arena**: Enclosed combat space with waves
- **Hub**: Central area connecting to sub-levels
- **Procedural**: Generated layout with rooms/corridors

---

**Create a level!** Run `/create-level` and describe your game.
