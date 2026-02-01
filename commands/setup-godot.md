---
description: Set up a new Godot 4 project with proper structure, autoloads, input map, audio buses, and export presets. Quick-start for any Godot game.
---

# Setup Godot Command

## What This Command Does

Creates a properly structured Godot 4 project:
- ✅ Folder structure (scenes, scripts, assets, etc.)
- ✅ Autoload singletons (GameManager, AudioManager, SceneManager)
- ✅ Input map with common actions
- ✅ Audio bus layout (Master, Music, SFX, UI, Ambient)
- ✅ project.godot configuration
- ✅ .gitignore for Godot
- ✅ Export presets (Windows, Linux, Web, Android)

## Folder Structure Created

```
project/
├── scenes/
│   ├── player/
│   ├── enemies/
│   ├── levels/
│   ├── ui/
│   └── effects/
├── scripts/
│   ├── autoload/
│   │   ├── game_manager.gd
│   │   ├── audio_manager.gd
│   │   └── scene_manager.gd
│   ├── components/
│   └── resources/
├── assets/
│   ├── sprites/
│   ├── audio/
│   │   ├── music/
│   │   └── sfx/
│   ├── fonts/
│   └── shaders/
├── addons/
├── default_bus_layout.tres
├── project.godot
├── export_presets.cfg
└── .gitignore
```

## Usage

```
User: /setup-godot

Agent: Setting up Godot project! What type?
→ 2D Game
→ 3D Game
→ 2.5D Game

[Creating project...]

✅ Godot project ready! Open in Godot 4.3+
```

---

**Set up your Godot project!** Run `/setup-godot` to get started.
