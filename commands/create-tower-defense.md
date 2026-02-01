---
description: Create a complete tower defense game with tower placement, enemy waves, upgrades, and economy. Supports Bloons, Kingdom Rush, Plants vs Zombies styles.
---

# Create Tower Defense Command

## What This Command Does

Creates a complete tower defense game with:
- ✅ Tower placement and targeting system
- ✅ Enemy wave spawning with pathing
- ✅ Tower upgrades with branching paths
- ✅ Economy (gold, lives, wave bonuses)
- ✅ Multiple tower and enemy types
- ✅ Speed controls (1x, 2x, 3x)

## When to Use

- Want a Bloons TD/Kingdom Rush style game
- Need tower placement and wave systems
- Want strategic defense gameplay
- Creating lane defense or maze TD

## How It Works

The **genre-template-master** agent will:

1. **Ask customization questions** via AskUserQuestion:
   - Target engine
   - TD type (Classic, Maze, Lane, Action)
   - Perspective (Top-down 2D, Isometric, 3D)
   - Features (Upgrades, Hero unit, Abilities, Endless mode)
   - Number of maps

2. **Load tower-defense-template** skill

3. **Generate complete game** with all systems

## Example Usage

```
User: /create-tower-defense

Agent: Creating a tower defense game! Let me customize it.

[Questions via AskUserQuestion]:

1. Which engine?
   → Godot ✓

2. TD type?
   → Classic TD (Bloons style) ✓

3. Features?
   → Tower upgrades ✓
   → Hero unit ✓
   → Endless mode ✓

[Creating game...]

✅ Complete! Your tower defense game is ready.
```

---

**Start creating your tower defense game!** Run `/create-tower-defense` and answer the questions.
