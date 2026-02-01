---
description: Create a complete RPG with stats, leveling, quests, inventory, NPCs, and dialogue. Supports action, turn-based, and tactics combat.
---

# Create RPG Command

## What This Command Does

Creates a complete RPG with:
- ✅ Character stats and leveling system
- ✅ Combat (action, turn-based, or tactics)
- ✅ Inventory and equipment
- ✅ Quest system with objectives
- ✅ Dialogue system with choices
- ✅ NPCs (merchants, quest givers)
- ✅ Complete menu system

## When to Use

- Want a Skyrim/Final Fantasy style game
- Need character progression and stats
- Want quests, NPCs, dialogue
- Creating fantasy/sci-fi RPG

## How It Works

The **genre-template-master** agent will:

1. **Ask customization questions** via AskUserQuestion:
   - Target engine
   - Perspective (2D, 2.5D, 3D)
   - Combat type (Action, Turn-based, Tactics)
   - World structure (Linear, Open)
   - Party size

2. **Load rpg-template** skill

3. **Generate complete game**

4. **Delegate to specialists**

## Example Usage

```
User: /create-rpg

Agent: Creating an RPG! Let me customize it.

[Questions via AskUserQuestion]:

1. Which engine?
   → Godot ✓
   → Unity
   → Unreal

2. Perspective?
   → 2D top-down
   → 2.5D isometric
   → 3D third-person ✓

3. Combat type?
   → Action (real-time) ✓
   → Turn-based (menu)
   → Tactics (grid-based)

4. World structure?
   → Linear (story-focused)
   → Semi-open ✓
   → Open world

5. Party size?
   → Solo hero ✓
   → Party of 4
   → Army/squad

[Creating game...]

✅ Complete! Your RPG is ready:

## Game Features
- Character with STR, DEX, INT, VIT stats
- Level-up system with stat allocation
- Real-time action combat (melee + magic)
- Equipment slots (weapon, armor, accessories)
- Quest journal with tracking
- NPCs with dialogue and shops
- Semi-open world with regions

## Files Created
- scenes/player/rpg_player.tscn
- scenes/enemies/enemy_base.tscn
- scenes/npcs/npc.tscn, merchant.tscn
- scenes/ui/inventory.tscn, quest_log.tscn
- scripts/character_stats.gd
- scripts/quest_system.gd
- scripts/dialogue_system.gd
```

## What Gets Created

### RPG Systems
- Character stats and leveling
- Combat system (per chosen type)
- Inventory with equipment slots
- Quest system
- Dialogue system
- NPC interactions

### Production Systems
- Main menu, pause, settings
- Character screen
- Quest log UI
- Shop interface

---

**Start creating your RPG!** Run `/create-rpg` and answer the questions.
