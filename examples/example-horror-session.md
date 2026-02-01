# Example: Creating a Horror Game

This walkthrough shows how to use `/create-horror` to build an investigation horror game.

## Session

```
User: /create-horror

Agent: Creating a horror game! Let me customize it.

[AskUserQuestion]:
1. Which engine?
   → Godot 4 ✓

2. Horror sub-genre?
   → Investigation (Phasmophobia) ✓

3. Multiplayer?
   → 2-4 player co-op ✓

4. Enemy behavior?
   → Ghost (intangible, teleports) ✓

Agent: Building your horror game...

[Loads skills: horror-template, player-controllers, enemy-ai-patterns, combat-systems]
[Delegates to: godot-specialist agent]

✅ Complete! Your horror game is ready.

## Created Files
scenes/
├── player/horror_player.tscn   # FPS controller with flashlight
├── enemies/ghost.tscn          # Ghost AI with hunting phases
├── equipment/emf_reader.tscn   # EMF detection equipment
├── equipment/thermometer.tscn  # Temperature reading
├── equipment/spirit_box.tscn   # Spirit communication
├── levels/haunted_house.tscn   # Main investigation level
├── ui/hud.tscn                 # Sanity bar, equipment, timer
└── ui/lobby.tscn               # Multiplayer lobby

scripts/
├── flashlight.gd               # Battery drain, flicker
├── sanity_system.gd            # Sanity effects (whispers, shadows)
├── investigation_system.gd     # Evidence gathering
├── ghost_equipment.gd          # Equipment base class
├── stalker_enemy.gd            # Ghost hunting AI
└── multiplayer_manager.gd      # Co-op networking

## How to Play
1. Enter the haunted location with your team
2. Use equipment to gather evidence (EMF, temperature, spirit box)
3. Identify the ghost type from evidence
4. Don't let your sanity drop to zero
5. Survive the ghost's hunting phases
```

## What Skills Were Used
- `horror-template` → Flashlight, sanity, investigation, stalker AI
- `player-controllers` → First-person controller base
- `enemy-ai-patterns` → Chase and patrol AI patterns
- `combat-systems` → Health system for damage
