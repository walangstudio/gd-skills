---
description: Create a complete survival game with crafting, base building, needs systems, and day/night cycles. Supports multiple survival sub-genres.
---

# Create Survival Command

## What This Command Does

Creates a complete survival game with:
- ✅ Player controller with gathering, building, swimming
- ✅ Needs system (hunger, thirst, stamina, warmth)
- ✅ Crafting system with recipes and stations
- ✅ Base building with grid placement
- ✅ Day/night cycle with temperature
- ✅ Wildlife AI (passive and aggressive)
- ✅ Resource gathering and respawning

## When to Use

- Want a Rust/Valheim/The Forest style game
- Need crafting and base building systems
- Want survival mechanics (hunger, thirst, temperature)
- Creating open-world survival gameplay

## How It Works

The **genre-template-master** agent will:

1. **Ask customization questions** via AskUserQuestion:
   - Target engine
   - Sub-genre (Wilderness, Sandbox, Underwater, Colony)
   - Perspective (First-person, Third-person, Top-down)
   - Multiplayer (Solo, Co-op, PvPvE)
   - Environment (Forest, Island, Underwater, Arctic, Desert)
   - Difficulty (Peaceful, Normal, Hardcore)

2. **Load survival-template** skill

3. **Generate complete game** with all systems

4. **Delegate to specialists**

## Example Usage

```
User: /create-survival

Agent: Creating a survival game! Let me customize it.

[Questions via AskUserQuestion]:

1. Which engine?
   → Godot ✓
   → Unity
   → Unreal

2. Survival sub-genre?
   → Wilderness (The Forest) ✓
   → Sandbox PvP (Rust)
   → Exploration (Subnautica)
   → Colony Management (RimWorld)

3. Perspective?
   → First-person ✓
   → Third-person
   → Top-down

4. Environment?
   → Forest/Wilderness ✓
   → Island
   → Underwater
   → Arctic

[Creating game...]

✅ Complete! Your survival game is ready:

## Game Features
- First-person controller with resource gathering
- Hunger, thirst, stamina, warmth systems
- 25+ crafting recipes (hand, workbench, forge)
- Grid-based building (walls, floors, doors, stations)
- Day/night cycle (20-min days)
- Temperature system with heat sources
- Wildlife AI (deer, wolves, bears)
- Procedural resource spawning

## Files Created
- scenes/player/survival_player.tscn
- scenes/world/terrain.tscn
- scenes/structures/wall.tscn, floor.tscn, etc.
- scripts/needs_system.gd
- scripts/crafting_system.gd
- scripts/building_system.gd
- scripts/day_night_cycle.gd
- scripts/temperature_system.gd

## How to Play
1. Gather wood, stone, and plants
2. Craft tools and weapons
3. Build shelter before nightfall
4. Hunt and cook food
5. Explore and expand your base
```

## What Gets Created

### Survival Systems
- Needs (hunger, thirst, warmth, stamina)
- Crafting with stations (hand, workbench, forge)
- Base building with snap grid
- Day/night cycle with lighting
- Temperature with heat sources

### Production Systems
- Main menu, pause, settings
- HUD with need bars, time display, minimap
- Save/load world state
- Multiplayer lobby (if selected)

---

**Start creating your survival game!** Run `/create-survival` and answer the questions.
