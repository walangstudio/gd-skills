---
description: Create a complete first-person shooter with weapons, enemy AI, health/ammo systems, levels, menus, and all production systems.
---

# Create FPS Command

## What This Command Does

Creates a complete, playable FPS game with:
- ✅ First-person controller (WASD, mouse look, sprint, crouch, jump)
- ✅ Weapon system (shoot, reload, switch weapons)
- ✅ Enemy AI (patrol, chase, ranged, boss)
- ✅ Health, armor, and ammo systems
- ✅ Multiple levels with progression
- ✅ Complete menu system (main menu, pause, game over, victory)
- ✅ Settings (graphics, audio, controls, sensitivity)
- ✅ Save/load system
- ✅ HUD (health, armor, ammo, crosshair)

## When to Use

- Want a Doom/Quake style shooter
- Need first-person weapon combat
- Want arena or mission-based levels
- Creating action or horror FPS

## How It Works

The **genre-template-master** agent will:

1. **Ask customization questions** via AskUserQuestion:
   - Target engine (Godot, Unity, Unreal)
   - Weapon types (pistol, shotgun, rifle, melee)
   - Enemy types (melee, ranged, boss)
   - Level style (linear, arena, exploration)
   - Health system (regenerating, pickups, hardcore)
   - Theme (military, sci-fi, horror, fantasy)

2. **Load fps-template** skill for proven patterns

3. **Generate complete game** with all systems

4. **Delegate to specialists**:
   - **full-game-builder**: Menus, settings, saves, audio
   - **[engine]-specialist**: Player controller, weapons, enemies
   - **game-feel-specialist**: Screen shake, weapon feedback, hit effects

## Example Usage

```
User: /create-fps

Agent: Creating a complete first-person shooter! Let me customize it.

[Questions via AskUserQuestion]:

1. Which engine?
   → Godot (Recommended for 3D) ✓
   → Unity
   → Unreal

2. Weapons? (Select multiple)
   → Pistol ✓
   → Shotgun ✓
   → Assault Rifle ✓
   → Rocket Launcher
   → Melee weapon

3. Enemy types? (Select multiple)
   → Melee rushers ✓
   → Ranged soldiers ✓
   → Heavy/tank enemies
   → Boss enemy ✓

4. Level style?
   → Linear missions ✓
   → Arena/wave survival
   → Open exploration

5. Health system?
   → Regenerating (modern)
   → Pickups only (classic) ✓
   → Hardcore (permadeath)

6. Theme?
   → Military/tactical
   → Sci-fi/alien ✓
   → Horror/survival
   → Fantasy

[Creating game...]

✅ Complete! Your FPS is ready:

## Files Created
- scenes/player/fps_player.tscn + fps_player.gd
- scenes/weapons/pistol.tscn, shotgun.tscn, rifle.tscn
- scenes/enemies/enemy_melee.tscn, enemy_ranged.tscn, boss.tscn
- scenes/levels/level_1.tscn through level_5.tscn
- scenes/ui/main_menu.tscn, hud.tscn, pause_menu.tscn
- scripts/game_manager.gd, weapon_manager.gd (autoloads)

## How to Play
1. Open project in Godot
2. Press F5 to run
3. WASD to move, Mouse to look
4. Left click to shoot, R to reload
5. 1-3 to switch weapons
6. ESC to pause
```

## What Gets Created

### Player Controller
- Smooth mouse look with sensitivity option
- WASD movement with sprint (Shift) and crouch (Ctrl)
- Jump with proper gravity
- Head bob while moving

### Weapons (3 by default)
- Pistol: Accurate, slow fire rate, 12 rounds
- Shotgun: Spread pattern, high damage, 8 shells
- Rifle: Automatic, medium damage, 30 rounds

### Enemies
- Melee: Rush player, moderate health
- Ranged: Take cover, shoot from distance
- Boss: Multiple phases, special attacks

### Production Systems
- Main menu, pause, settings, game over, victory
- HUD with health/armor bars, ammo counter, crosshair
- Save/load progress
- Graphics/audio/control settings

---

**Start creating your FPS today!** Just run `/create-fps` and answer the questions.
