---
description: Create a complete, production-ready game from a simple description. Transforms your game idea into a playable game with menus, settings, leaderboards, and all necessary systems.
---

# Create Game Command

## What This Command Does

1. Analyzes your game idea/mechanics description
2. Asks clarifying questions to understand your vision
3. Identifies genre and required systems
4. Creates complete game structure with all systems
5. Delegates to specialized agents for implementation
6. Delivers a fully playable game with:
   - Complete gameplay mechanics
   - Main menu system
   - Pause menu
   - Settings (graphics, audio, controls, gameplay)
   - Save/load system
   - Leaderboard/high scores
   - Audio (music + SFX)
   - Polish and game feel

## When to Use

- You have a game idea and want it fully implemented
- You want to create a complete game, not just a prototype
- You need all production systems (menus, settings, saves)
- You want to describe mechanics and get a playable game

## How It Works

The **game-architect** agent will:

1. **Analyze** your description to identify:
   - Genre (platformer, FPS, RPG, puzzle, etc.)
   - Core mechanics (what the player does)
   - Win/lose conditions
   - Progression system

2. **Ask questions** via interactive prompts:
   - Which engine? (Godot, Roblox, Unity, Unreal, Web)
   - How many levels/stages?
   - Health system type? (lives, health bar, one-hit)
   - Enemy behaviors?
   - Multiplayer type? (solo, co-op, competitive)
   - UI requirements?
   - Audio needs?

3. **Create structure** for the complete game:
   - All necessary scenes/screens
   - Menu flow (splash → main menu → gameplay → pause → game over)
   - Core systems (player, enemies, collectibles, etc.)
   - UI systems (HUD, menus, settings)
   - Audio systems (music, SFX)
   - Save/load system

4. **Delegate** to specialists:
   - **full-game-builder**: Menus, settings, saves, audio
   - **[engine]-specialist**: Gameplay implementation
   - **gameplay-designer**: Mechanic refinement
   - **level-architect**: Level design

5. **Integrate** all systems to create a cohesive, playable game

## Example Usage

### Example 1: Platformer

```
User: /create-game I want a 2D platformer where you collect coins and avoid enemies

Agent: I'll create a complete 2D platformer! Let me ask a few questions to make it perfect.

Questions:
- Engine?
  → Godot (Recommended for 2D)
  → Unity
  → Web (JavaScript/Phaser)

- How many levels?
  → 3 levels
  → 5 levels
  → 10 levels

- Health system?
  → Lives system (3 lives) - Like classic Mario
  → Health bar (100 HP) - Take damage, can heal
  → One-hit death - Instant restart, hardcore

- Enemy types? (Select multiple)
  → Patrol enemies - Walk back and forth
  → Flying enemies - Move in patterns
  → Boss enemy - Special boss at end

[User answers: Godot, 5 levels, Lives system, Patrol + Flying enemies]

Creating your complete 2D platformer:

✅ Game Structure Created:
- 5 levels with progressive difficulty
- Player controller (run, jump, lives system)
- Patrol enemies and flying enemies
- Coin collection system
- Main menu (Play, Settings, Quit)
- Pause menu (Resume, Restart, Settings, Main Menu)
- Game Over screen (Retry, Main Menu)
- Victory screen (Next Level, Main Menu)
- Settings (Audio volume, Controls, Fullscreen)
- HUD (Lives, Coins, Score, Time)
- Save system (high scores, unlocked levels)
- Audio (background music, SFX for jump/coin/enemy)

Implementing systems...

[Implementation happens via agents]

✅ Complete! Your platformer is ready to play:
- Run with Godot (F5)
- Files created:
  - scenes/main_menu.tscn
  - scenes/gameplay.tscn (5 level variants)
  - scenes/pause_menu.tscn
  - scripts/player_controller.gd
  - scripts/enemy_patrol.gd
  - scripts/enemy_flying.gd
  - scripts/audio_manager.gd
  - scripts/save_system.gd

Next steps:
- Test the game
- Adjust difficulty in level scenes
- Add custom art/sprites
- Tune jump feel with /add-game-feel
```

### Example 2: Horror Game

```
User: /create-game Multiplayer horror game like Phasmophobia where you hunt ghosts

Agent: Perfect! A ghost hunting investigation horror game. Let me gather details.

Questions:
- Engine?
  → Unity (Recommended for 3D multiplayer)
  → Unreal (High-fidelity graphics)
  → Godot (Open-source, good networking)

- Players?
  → 2 players
  → 4 players (Like Phasmophobia)
  → 6-8 players

- Horror mechanics? (Select multiple)
  → Investigation (EMF, thermometer, evidence gathering)
  → Monster hunting phases (Safe, then dangerous)
  → Proximity voice chat
  → Sanity system

- Ghost AI?
  → Roaming and hunting phases
  → Triggered by player actions
  → Random events

[User answers: Unity, 4 players, All mechanics, Roaming and hunting]

Creating your multiplayer horror game:

✅ Game Structure Created:
- 4-player online co-op
- Lobby system (host/join, ready up)
- Voice chat with proximity
- Investigation equipment:
  - Flashlight
  - EMF reader
  - Thermometer
  - Spirit box
  - Camera
- Ghost AI with hunting phases
- Sanity system (drain in dark, effects)
- 3D positional audio
- Main menu (Host, Join, Settings)
- In-game objectives system
- Death/spectator mode
- Settings (Graphics, Audio, Network)

✅ Complete! Your horror game is ready:
- Supports 1-4 players
- Dedicated server architecture
- Full investigation mechanics
- Production-quality UI
- Ghost AI with realistic hunting
- Voice chat integrated

Files created in Unity project structure.

Test: Host a game, have friends join, investigate together!
```

### Example 3: Puzzle Game

```
User: /create-game Match-3 puzzle game like Candy Crush with power-ups

Agent: A match-3 puzzle game! I'll create the complete experience.

Questions:
- Engine?
  → Web (Best for match-3, easy to share)
  → Unity (Mobile + Web)
  → Godot (All platforms)

- Grid size?
  → 8x8 (Standard)
  → 10x10 (Larger)
  → 6x6 (Compact)

- Gem types?
  → 5 colors (Basic)
  → 7 colors (More variety)
  → 6 colors + special gems

- Game modes? (Select multiple)
  → Moves limited (Clear objectives in X moves)
  → Time attack (Race against time)
  → Endless (Play until no moves)

[User answers: Web (Phaser), 8x8, 6 colors + specials, Moves + Time attack]

Creating your match-3 puzzle game:

✅ Game Structure Created:
- 8x8 grid system
- 6 gem types + 4 special power-ups
- Match detection algorithm
- Gravity/falling system
- Combo detection
- Two game modes:
  - Moves Mode (30 moves, reach score goal)
  - Time Attack (90 seconds, endless)
- Level progression (50 levels)
- Main menu
- Level select
- Settings (SFX volume, Music, Particle effects)
- Leaderboard (per mode)
- Tutorial level
- Power-ups:
  - Line clear (match 4)
  - Cross clear (match 5)
  - Color bomb (match 5 in L/T shape)
  - Flame gem (match 4 in square)

✅ Complete! Your match-3 game is ready:
- Playable in browser
- Touch + mouse support
- Satisfying animations
- Particle effects on matches
- Progressive difficulty
- Save progress locally

Open index.html in browser to play!
```

## Advanced Usage

### With Specific Details

```
User: /create-game FPS game with 3 weapons, 2 enemy types, 3 maps, online multiplayer 4v4

Agent: [Creates complete FPS with all specified features]
```

### With Genre Reference

```
User: /create-game Tower defense like Bloons TD

Agent: Great! I'll use the tower defense template and customize it.
[Creates complete tower defense with multiple tower types, enemy waves, upgrades]
```

### Requesting Specific Engine

```
User: /create-game Survival crafting game in Godot

Agent: Creating a survival game in Godot with crafting, building, hunger/thirst...
```

## What Gets Created

Every game created includes:

### Core Systems
- ✅ Player controller
- ✅ Game mechanics (specific to your game)
- ✅ Enemy AI (if applicable)
- ✅ Scoring/progression system
- ✅ Win/lose conditions

### Menu Systems
- ✅ Splash screen (logo)
- ✅ Main menu (Play, Settings, Credits, Quit)
- ✅ Pause menu (Resume, Restart, Settings, Main Menu)
- ✅ Game Over screen (Retry, View Score, Main Menu)
- ✅ Victory screen (Next Level/Continue, View Score, Main Menu)
- ✅ Settings menu (all categories)

### Settings Categories
- ✅ **Graphics**: Resolution, display mode, quality, shadows, AA, vsync
- ✅ **Audio**: Master, music, SFX, voice (if multiplayer)
- ✅ **Gameplay**: Difficulty, assists, tutorial hints
- ✅ **Controls**: Key bindings, mouse sensitivity, controller support

### Persistence Systems
- ✅ Save/load game progress
- ✅ Settings persistence
- ✅ Leaderboard (high scores)
- ✅ Unlockable levels/content

### Audio Systems
- ✅ Background music (menu, gameplay, victory, defeat)
- ✅ Sound effects (all actions)
- ✅ Audio manager with volume control
- ✅ Music crossfading
- ✅ 3D spatial audio (for 3D games)

### Polish
- ✅ Button animations (hover, click)
- ✅ Screen transitions
- ✅ Particle effects
- ✅ Screen shake (optional)
- ✅ Controller vibration (if applicable)

## Alternative Commands

If your game matches a specific genre, you can use genre-specific commands for faster setup:

- `/create-platformer` - 2D/3D platformer
- `/create-fps` - First-person shooter
- `/create-horror` - Horror game (8 sub-genres)
- `/create-survival` - Survival game with crafting
- `/create-rpg` - RPG (2D/2.5D/3D, various combat types)
- `/create-farming` - Farming simulator
- `/create-racing` - Racing game
- `/create-puzzle` - Puzzle game
- `/create-tower-defense` - Tower defense
- `/create-classic-game` - Classic arcade games (Pong, Tetris, etc.)

## Tips for Best Results

1. **Be specific** about mechanics:
   - "Platformer where you wall-jump and dash" (specific)
   - vs "A platformer" (vague)

2. **Mention inspirations**:
   - "Like Celeste but with combat"
   - "Stardew Valley style farming"
   - "Phasmophobia but solo"

3. **Specify multiplayer early**:
   - "4-player co-op"
   - "1v1 competitive"
   - "Couch co-op split-screen"

4. **Engine preference** (if you have one):
   - "In Unity"
   - "Using Godot"
   - "Web-based with Phaser"

## Limitations

- Scope: Aim for achievable scope (prototype to full game)
- Assets: Will use placeholder art/sounds (you can replace later)
- Testing: You'll need to test and iterate after creation
- Platform: Some engines better for certain platforms

## After Creation

Once your game is created:

1. **Test it**: Play through all systems
2. **Iterate**: Use `/add-game-feel` for polish
3. **Debug**: Use `/debug-game` if issues arise
4. **Optimize**: Use `/optimize-performance` if slow
5. **Expand**: Add more levels, mechanics, content

---

**Start creating your dream game today!** Just describe your idea and let the game-architect bring it to life.
