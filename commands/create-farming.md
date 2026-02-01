---
description: Create a complete farming/life sim game with crops, animals, NPCs, seasons, and town activities. Supports Stardew Valley, Animal Crossing, Rune Factory styles.
---

# Create Farming Command

## What This Command Does

Creates a complete farming/life sim game with:
- ✅ Crop planting, growing, harvesting system
- ✅ Season/calendar with festivals
- ✅ NPC relationships with gifting
- ✅ Tool-based gameplay (hoe, water, axe)
- ✅ Inventory and selling system
- ✅ Day/night cycle with energy

## When to Use

- Want a Stardew Valley/Harvest Moon style game
- Need farming mechanics with seasons
- Want NPC relationship systems
- Creating cozy life simulation gameplay

## How It Works

The **genre-template-master** agent will:

1. **Ask customization questions** via AskUserQuestion:
   - Target engine
   - Sub-genre (Classic Farm, Life Sim, Fantasy Farm, Cozy Survival)
   - Perspective (Top-down 2D, Isometric, 3D)
   - Features (Farming, Animals, Mining, Fishing, Romance)

2. **Load farming-template** skill

3. **Generate complete game** with all systems

4. **Delegate to specialists**

## Example Usage

```
User: /create-farming

Agent: Creating a farming game! Let me customize it.

[Questions via AskUserQuestion]:

1. Which engine?
   → Godot ✓

2. Farming sub-genre?
   → Classic Farm (Stardew Valley) ✓

3. Perspective?
   → Top-down 2D (pixel art) ✓

4. Which features? (multi-select)
   → Farming + Animals ✓
   → Mining/Dungeons ✓
   → Fishing ✓
   → NPC Romance ✓

[Creating game...]

✅ Complete! Your farming game is ready.
```

---

**Start creating your farming game!** Run `/create-farming` and answer the questions.
