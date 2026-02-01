---
description: Create a complete roguelike/roguelite with procedural dungeon generation, permadeath, item randomization, meta-progression, and run-based gameplay.
---

# Create Roguelike Command

## What This Command Does

Creates a complete, playable roguelike/roguelite game with:
- Procedural dungeon/floor generation
- Run-based gameplay with permadeath
- Randomized items and abilities with rarity tiers
- Meta-progression between runs (upgrades, unlocks)
- Multiple room types (combat, shop, treasure, rest, boss)
- Enemy scaling per floor
- Complete menu system (main menu, pause, run summary)
- Meta-upgrade screen between runs

## When to Use

- Want a Hades/Dead Cells-style action roguelike
- Building a Slay the Spire-style deckbuilder
- Creating a bullet hell roguelite (Enter the Gungeon)
- Need procedural generation with run variety

## How It Works

The **genre-template-master** agent will:

1. **Ask customization questions** via AskUserQuestion:
   - Target engine (Godot, Unity, Unreal, Web)
   - Sub-genre (action, deckbuilder, bullet hell, traditional, auto-battler)
   - Perspective (top-down 2D, side-scroll, 3D)
   - Run length (short 5 floors, medium 10, long 20)
   - Meta-progression depth (light, medium, heavy)
   - Combat style (melee, ranged, magic, hybrid)

2. **Load roguelike template** skill for proven patterns

3. **Generate complete game** with all systems

4. **Delegate to specialists**:
   - **full-game-builder**: Menus, meta-upgrade screen, run summary
   - **[engine]-specialist**: Dungeon gen, combat, items, enemies
   - **game-feel-specialist**: Screen shake, hit stop, damage numbers

5. **Deliver playable roguelike** ready to test and iterate

## Example Usage

```
User: /create-roguelike

Agent: Creating a roguelike! Let me customize it for you.

[AskUserQuestion]:

1. Which engine?
   → Godot (Recommended) ✓

2. Sub-genre?
   → Action Roguelike (Hades/Dead Cells) ✓

3. Perspective?
   → Top-down 2D ✓

4. Run length?
   → Medium (10 floors) ✓

5. Meta-progression?
   → Medium (unlockable items + stat upgrades) ✓

6. Combat style?
   → Hybrid (melee + ranged abilities) ✓

[Loads skills: roguelike-template, player-controllers, combat-systems, enemy-ai-patterns]
[Delegates to: godot-specialist agent]

✅ Complete! Your roguelike is ready.

## Created Files
scenes/
├── player/player.tscn              # Top-down player with dash
├── enemies/slime.tscn              # Basic enemy
├── enemies/skeleton.tscn           # Ranged enemy
├── enemies/elite_knight.tscn       # Elite enemy
├── enemies/slime_king.tscn         # Floor 1 boss
├── rooms/combat_room.tscn          # Combat encounter template
├── rooms/shop_room.tscn            # Shop with items for gold
├── rooms/treasure_room.tscn        # Free item choice
├── rooms/rest_room.tscn            # Heal or upgrade
├── ui/hud.tscn                     # HP, gold, floor, minimap
├── ui/item_choice.tscn             # Pick 1 of 3 items
├── ui/run_summary.tscn             # End-of-run stats
├── ui/meta_upgrades.tscn           # Between-run upgrade screen
├── ui/main_menu.tscn               # Play, Upgrades, Settings, Quit
└── ui/pause_menu.tscn              # Resume, Restart, Menu

scripts/
├── run_manager.gd                  # Run lifecycle, floor progression
├── dungeon_generator.gd            # Procedural room layout
├── item_randomizer.gd              # Weighted item drops, synergies
├── meta_progression.gd             # Persistent upgrades, currency
├── game_manager.gd (autoload)      # Global state
└── audio_manager.gd (autoload)     # Music per floor, SFX

## How to Play
- WASD/Arrows: Move
- Left Click: Attack (melee)
- Right Click: Ability (ranged)
- Space: Dash (i-frames)
- E: Interact (doors, NPCs, chests)
- ESC: Pause
- Clear all rooms on a floor, defeat the boss, advance
- Die = run ends, keep meta-currency for upgrades
```

## Customization After Creation

### Add New Items
Add entries to the item pool in `item_randomizer.gd`. Each item has rarity, effects, and synergy tags.

### Add New Enemies
Create new enemy scenes following the existing pattern. Add to `dungeon_generator.gd` enemy pools per floor range.

### Adjust Difficulty
Edit `dungeon_generator.gd` for room count, enemy scaling, and boss selection per floor.

### Add New Meta-Upgrades
Add entries to the `upgrade_tree` dictionary in `meta_progression.gd`.

---

**Start creating your roguelike!** Run `/create-roguelike` and answer the questions.
