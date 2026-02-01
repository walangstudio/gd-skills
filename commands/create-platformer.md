---
description: Create a complete 2D or 3D platformer game with player controller, enemies, collectibles, levels, menus, and all production systems. Customize abilities, enemies, and level count.
---

# Create Platformer Command

## What This Command Does

Creates a complete, playable platformer game with:
- ✅ Player controller (run, jump, optional: double jump, wall jump, dash)
- ✅ Enemy AI (patrol, flying, turret, boss)
- ✅ Collectible system (coins, power-ups)
- ✅ Multiple levels with progression
- ✅ Lives or health system
- ✅ Complete menu system (main menu, pause, game over, victory)
- ✅ Settings (graphics, audio, controls)
- ✅ Save/load system (progress, high scores)
- ✅ HUD (lives/health, score, coins, time)
- ✅ Audio (music, SFX)

## When to Use

- Want a Mario-style platformer
- Need precise jumping mechanics
- Want level-based progression
- Creating 2D or 3D platformer

## How It Works

The **genre-template-master** agent will:

1. **Ask customization questions** via AskUserQuestion:
   - Target engine (Godot, Unity, Unreal, Web)
   - 2D or 3D?
   - Player abilities (jump, double jump, wall jump, dash)
   - Enemy types (patrol, flying, turret, boss)
   - Level count (3, 5, 10, custom)
   - Health system (lives, health bar, one-hit)
   - Theme (forest, desert, cave, castle, volcano)

2. **Load platformer template** skill for proven patterns

3. **Generate complete game** with all systems

4. **Delegate to specialists**:
   - **full-game-builder**: Menus, settings, saves, audio
   - **[engine]-specialist**: Player controller, enemies, levels
   - **game-feel-specialist**: Coyote time, jump feel, particles

5. **Deliver playable platformer** ready to test and iterate

## Example Usage

```
User: /create-platformer

Agent: Creating a complete 2D platformer! Let me customize it for you.

[Questions via AskUserQuestion]:

1. Which engine?
   → Godot (Recommended for 2D) ✓
   → Unity
   → Unreal
   → Web (Phaser)

2. Perspective?
   → 2D side-scrolling ✓
   → 2.5D (3D graphics, 2D gameplay)
   → 3D platformer

3. Player abilities? (Select multiple)
   → Jump (Basic) ✓
   → Double Jump ✓
   → Wall Jump
   → Dash ✓
   → Wall Climb

4. Enemy types? (Select multiple)
   → Patrol enemies ✓
   → Flying enemies ✓
   → Turret enemies
   → Boss enemy ✓

5. How many levels?
   → 3 levels (Short)
   → 5 levels (Medium) ✓
   → 10 levels (Full game)
   → Custom

6. Health system?
   → Lives system (3 lives, like Mario) ✓
   → Health bar (100 HP)
   → One-hit death (Hardcore)

7. Level theme?
   → Forest/Nature ✓
   → Desert/Canyon
   → Cave/Underground
   → Castle/Medieval
   → Volcano/Lava
   → Mixed themes

[User selects: Godot, 2D, Jump+DoubleJump+Dash, Patrol+Flying+Boss, 5 levels, Lives, Forest]

Creating your complete platformer with:
- Godot 4.3+ engine (2D)
- Player: Run, Jump, Double Jump, Dash
- Enemies: Patrol (walks platforms), Flying (sine wave), Boss (phase-based)
- 5 forest-themed levels
- Lives system (3 lives, extra life at 100 coins)
- Complete production systems

[Implementation begins]

✅ Complete! Your platformer is ready:

## Game Features
- Player Controller
  - Smooth movement with acceleration/friction
  - Jump with variable height (hold for higher jump)
  - Double jump in mid-air
  - Dash ability with cooldown
  - Coyote time (0.1s grace period)
  - Jump buffer (remember jump input)

- Enemies (3 types)
  - Patrol Enemy: Walks platforms, turns at edges
  - Flying Enemy: Sine wave pattern movement
  - Boss Enemy: 3 attack phases, health bar

- 5 Levels
  - Level 1: Forest Tutorial (easy)
  - Level 2: Forest Meadow (medium)
  - Level 3: Dense Woods (medium-hard)
  - Level 4: Treetops (hard)
  - Level 5: Boss Fight

- Collectibles
  - Coins (100 = extra life)
  - Power-ups (invincibility star, speed boost)
  - Checkpoints (respawn points)

- UI Systems
  - Main Menu (Play, Continue, Settings, Quit)
  - HUD (Lives: ❤️❤️❤️, Score: 0, Coins: 0, Time: 0:00)
  - Pause Menu (Resume, Restart, Settings, Main Menu)
  - Game Over Screen (Final Score, Retry, Main Menu)
  - Victory Screen (Total Score, Time, Next Level, Main Menu)

- Settings
  - Graphics: Resolution, Fullscreen, VSync
  - Audio: Master, Music, SFX volumes
  - Controls: Rebindable keys, Controller support

- Save System
  - Progress (unlocked levels)
  - High scores per level
  - Best times
  - Total coins collected

- Audio
  - Menu music
  - Forest ambient music (levels 1-4)
  - Boss battle music (level 5)
  - SFX: Jump, double jump, dash, coin, damage, death, victory

## Files Created
- scenes/player/player.tscn + player.gd
- scenes/enemies/patrol_enemy.tscn + patrol_enemy.gd
- scenes/enemies/flying_enemy.tscn + flying_enemy.gd
- scenes/enemies/boss.tscn + boss.gd
- scenes/levels/level_1.tscn through level_5.tscn
- scenes/ui/main_menu.tscn
- scenes/ui/hud.tscn
- scenes/ui/pause_menu.tscn
- scripts/game_manager.gd (autoload)
- scripts/audio_manager.gd (autoload)
- scripts/save_system.gd (autoload)

## How to Play
1. Open project in Godot
2. Press F5 to run
3. Use Arrow Keys or WASD to move
4. Space to jump (press twice for double jump)
5. Shift to dash
6. ESC to pause

## Next Steps
- Test each level
- Adjust difficulty in level scenes
- Add custom art/sprites (currently uses placeholders)
- Fine-tune jump feel with /add-game-feel
- Design more levels
- Add more enemy types
```

## Customization After Creation

### Change Jump Feel
```
/add-game-feel

→ Adjusts coyote time, jump buffer, acceleration
→ Adds particles, screen shake
→ Tunes to feel like Celeste/Mario/Sonic
```

### Add More Levels
```
Duplicate existing level scene
Modify layout, enemy placement
Add to level progression in GameManager
```

### Change Health System
```
Edit Player script
Switch from lives to health bar
Update HUD to show health instead
```

## What Makes It Feel Good

Every platformer includes:
- **Coyote Time**: 0.1s grace period after leaving platform
- **Jump Buffer**: Remember jump input 0.15s before landing
- **Variable Jump Height**: Hold jump longer = jump higher
- **Smooth Acceleration**: Not instant, feels responsive
- **Particle Effects**: Dust on landing, trail on dash
- **Screen Shake**: Subtle on landing, more on damage
- **Satisfying SFX**: Crisp jump sound, rewarding coin collect

## Engine-Specific Notes

### Godot
- Uses CharacterBody2D with move_and_slide()
- Signals for all events
- Scene-based level design
- TileMap for platforms

### Unity
- Uses CharacterController or Rigidbody2D
- UnityEvents for communication
- Prefabs for levels
- Tilemap for platforms

### Unreal
- Uses Character class with CharacterMovement
- Blueprint or C++ implementation
- Level Blueprints for stages
- Paper2D or 3D

### Web/Phaser
- Arcade Physics
- Scene-based structure
- Tilemap support
- Touch controls for mobile

---

**Start creating your platformer today!** Just run `/create-platformer` and answer the questions.
