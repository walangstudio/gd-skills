# gd-skills

> **Comprehensive game development plugin for Claude Code** - Create complete, production-ready games from simple commands

## Overview

**gd-skills** is a game development plugin for Claude Code, providing instant game creation across **5 major game engines** (Godot, Roblox, Unity, Unreal, Web) with **11 genre templates**, **15 specialized agents**, **26 skills**, and **30 commands**.

### Create a Full Game in Seconds

```bash
/create-platformer
# → Complete 2D platformer with player controller, enemies, levels, menu, settings

/create-horror
# → Investigation horror game with ghost AI, equipment, sanity system

/create-fps
# → First-person shooter with weapons, enemy AI, pickups, levels
```

## Key Features

### 11 Genre Templates
Create complete, playable games instantly:
- **Platformer** (Mario, Celeste) - player controller, enemies, collectibles, levels
- **FPS** (Doom, CS:GO) - weapons, enemy AI, pickups, arenas
- **Horror** (Phasmophobia, Resident Evil) - stalker AI, sanity, investigation
- **RPG** (Final Fantasy, Skyrim) - quests, dialogue, turn-based/real-time combat
- **Survival** (Rust, Valheim) - crafting, base building, needs, day/night
- **Farming** (Stardew Valley) - crops, seasons, NPC relationships
- **Racing** (Mario Kart, Need for Speed) - vehicle physics, tracks, AI racers
- **Puzzle** (Tetris, Sokoban) - grid logic, undo, level progression
- **Tower Defense** (Bloons TD, Kingdom Rush) - towers, waves, upgrades
- **Classic Games** (Snake, Tetris, Solitaire) - arcade, card, board games
- **Roguelike** (Hades, Slay the Spire) - procedural dungeons, permadeath, meta-progression

### Multi-Engine Support
- **Godot 4.3+** (GDScript 2.0)
- **Roblox 2025+** (Luau with strict typing)
- **Unity 6 / 2023.2+** (C#)
- **Unreal Engine 5.4+** (C++/Blueprints)
- **JavaScript** (Phaser 3.80+, Three.js, Babylon.js)

### 15 Specialized Agents
- **Engine specialists** (5): Godot, Roblox, Unity, Unreal, JavaScript
- **Debuggers** (5): Performance, Physics, AI, Audio, Network
- **Builders** (3): Full game, Component, Genre template
- **Polish** (2): Game architect, Game feel specialist

### 9 Shared Component Skills
Reusable game systems referenced by all genre templates:
- **player-controllers** - FPS, third-person, top-down, platformer, vehicle
- **enemy-ai-patterns** - Patrol, chase, ranged, boss, horde
- **inventory-systems** - List, grid, weight-based, equipment slots
- **combat-systems** - Health, melee, hitscan, projectile, magic
- **save-load-systems** - JSON saves, settings persistence, autosave, save slots
- **audio-systems** - Music crossfade, SFX pool, spatial audio, dynamic music
- **ui-menu-systems** - Main menu, pause, settings, HUD, game over, transitions
- **camera-systems** - Follow 2D/3D, orbit, side-scroll, screen shake
- **dialogue-systems** - Branching dialogue, typewriter effect, conditional choices

## Installation

### Quick Install (Global)

Installs to `~/.claude/` so gd-skills is available in all your projects.

**macOS / Linux / Git Bash:**
```bash
git clone https://github.com/ntancardoso/gd-skills.git
cd gd-skills
chmod +x install.sh
./install.sh
```

**Windows (PowerShell):**
```powershell
git clone https://github.com/ntancardoso/gd-skills.git
cd gd-skills
.\install.ps1
```

### Project-Local Install

Installs to `./.claude/` in your current project directory only:
```bash
cd /path/to/my-game-project
/path/to/gd-skills/install.sh --local        # bash
/path/to/gd-skills/install.ps1 -Local        # PowerShell
```

### Other AI Coding Tools

The installer also supports Cursor, Windsurf, and GitHub Copilot (rules only):
```bash
./install.sh --target cursor       # Install rules for Cursor
./install.sh --target all          # Install for all supported tools
./install.sh --list                # Show all supported targets
```

### Upgrading

Run the same install command again. The script will:
- Skip if your installed version is already newer
- Prompt before reinstalling the same version
- Auto-upgrade from older to newer versions

### Manual Installation
```bash
cp -r agents/* ~/.claude/agents/
cp -r skills/* ~/.claude/skills/
cp -r commands/* ~/.claude/commands/
cp -r rules/* ~/.claude/rules/
```

## Quick Start

### Create a Game
```bash
/create-game I want a 2D platformer with coins and enemies
/create-platformer
/create-horror
/create-rpg
/create-survival
/create-farming
/create-racing
/create-puzzle
/create-tower-defense
/create-classic-game
/create-roguelike
```

### Add Components
```bash
/create-health       # Health system (HP, armor, shields)
/create-enemy        # Enemy AI (patrol, chase, boss)
/create-player       # Player controller (FPS, top-down, platformer)
/create-level        # Level with spawns, objectives, navigation
/create-menu         # Menu system (main, pause, game over)
/create-settings     # Settings (audio, video, controls)
/create-leaderboard  # High score tracking
/create-multiplayer  # Networking and lobbies
```

### Debug and Polish
```bash
/debug-game            # Route to specialized debugger
/debug-existing        # Full project audit
/add-game-feel         # Screen shake, particles, coyote time
/optimize-performance  # Find and fix bottlenecks
```

### Engine Setup
```bash
/setup-godot    # Godot project structure + autoloads
/setup-unity    # Unity project structure + managers
/setup-unreal   # Unreal project structure + framework
/setup-roblox   # Roblox service hierarchy + DataStore
/setup-web      # Web game with Vite + Phaser/Three.js
```

## All 30 Commands

### Game Creation (12)
| Command | Description |
|---------|-------------|
| `/create-game` | Full game from text description |
| `/create-platformer` | 2D/3D platformer |
| `/create-fps` | First-person shooter |
| `/create-horror` | Horror (investigation, survival, psychological) |
| `/create-rpg` | RPG (turn-based, real-time, tactics) |
| `/create-survival` | Survival with crafting and base building |
| `/create-farming` | Farming/life sim |
| `/create-racing` | Racing (kart, arcade, sim) |
| `/create-puzzle` | Puzzle (Sokoban, match-3, physics) |
| `/create-tower-defense` | Tower defense with waves |
| `/create-classic-game` | Classic arcade, card, board games |
| `/create-roguelike` | Roguelike with procedural dungeons |

### Components (8)
| Command | Description |
|---------|-------------|
| `/create-component` | Generic game component |
| `/create-health` | Health/damage system |
| `/create-enemy` | Enemy AI |
| `/create-player` | Player controller |
| `/create-level` | Game level |
| `/create-menu` | Menu system |
| `/create-settings` | Settings screen |
| `/create-leaderboard` | Leaderboard |

### Multiplayer & Polish (3)
| Command | Description |
|---------|-------------|
| `/create-multiplayer` | Add multiplayer networking |
| `/add-game-feel` | Add juice and polish |
| `/optimize-performance` | Performance optimization |

### Debugging (2)
| Command | Description |
|---------|-------------|
| `/debug-game` | Debug specific issue |
| `/debug-existing` | Full project audit |

### Engine Setup (5)
| Command | Description |
|---------|-------------|
| `/setup-godot` | Godot project structure |
| `/setup-unity` | Unity project structure |
| `/setup-unreal` | Unreal project structure |
| `/setup-roblox` | Roblox Studio project structure |
| `/setup-web` | Web game with Vite bundler |

## All 15 Agents

| Agent | Role |
|-------|------|
| `godot-specialist` | Godot/GDScript expert |
| `unity-specialist` | Unity/C# expert |
| `unreal-specialist` | Unreal/C++ expert |
| `roblox-specialist` | Roblox/Luau expert |
| `javascript-specialist` | Web game expert |
| `performance-debugger` | FPS, memory, GPU optimization |
| `physics-debugger` | Jittering, tunneling, collisions |
| `ai-debugger` | Pathfinding, state machines, detection |
| `audio-debugger` | Sound, spatial audio, music |
| `network-debugger` | Multiplayer, desync, lag |
| `full-game-builder` | Complete game creation |
| `component-builder` | Individual system creation |
| `genre-template-master` | Template-based game generation |
| `game-architect` | Architecture and design |
| `game-feel-specialist` | Juice and polish |

## All 26 Skills

### Genre Templates (11)
`platformer-template`, `fps-template`, `horror-template`, `rpg-template`, `survival-template`, `farming-template`, `racing-template`, `puzzle-template`, `tower-defense-template`, `classic-games-template`, `roguelike-template`

### Shared Components (9)
`player-controllers`, `enemy-ai-patterns`, `inventory-systems`, `combat-systems`, `save-load-systems`, `audio-systems`, `ui-menu-systems`, `camera-systems`, `dialogue-systems`

### Engine Patterns (5)
`godot-patterns`, `unity-patterns`, `unreal-patterns`, `roblox-patterns`, `javascript-patterns`

### Other (1)
`full-game-structure`

## All 6 Rules

Coding standards automatically applied per engine:

| Rule | Scope |
|------|-------|
| `debugging-practices` | Universal debugging workflow and logging standards |
| `godot-style` | GDScript 2.0 conventions, node naming, signal patterns |
| `javascript-style` | ES6+ patterns, module structure, web game conventions |
| `roblox-style` | Luau strict typing, service architecture, DataStore patterns |
| `unity-style` | C# conventions, MonoBehaviour patterns, ScriptableObjects |
| `unreal-style` | C++/Blueprint conventions, UE5 framework patterns |

## Plugin Architecture

```
gd-skills/
├── agents/     (15 specialized agents)
├── skills/     (26 skills with code templates)
├── commands/   (30 slash commands)
├── rules/      (6 coding standards)
├── hooks/      (automation)
├── scripts/    (utilities)
├── contexts/   (engine modes)
└── examples/   (configurations)
```

## License

MIT License - see [LICENSE](LICENSE) file

---

**Start creating games today!** Try `/create-platformer` or `/create-horror` to get started.
