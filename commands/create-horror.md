---
description: Create a complete horror game with atmosphere, stalker AI, investigation mechanics, and sanity systems. Supports multiple sub-genres.
---

# Create Horror Command

## What This Command Does

Creates a complete horror game with:
- ✅ First-person controller with flashlight, stamina, hiding
- ✅ Stalker/Hunter enemy AI
- ✅ Sanity system with effects
- ✅ Investigation mechanics (optional, Phasmophobia-style)
- ✅ Atmospheric lighting and audio
- ✅ Complete menu system
- ✅ Multiplayer support (optional)

## When to Use

- Want a Phasmophobia/Resident Evil style game
- Need atmospheric horror with stalker enemies
- Want investigation/ghost hunting mechanics
- Creating psychological horror

## How It Works

The **genre-template-master** agent will:

1. **Ask customization questions** via AskUserQuestion:
   - Target engine
   - Sub-genre (Investigation, Survival, Psychological, Asymmetric)
   - Multiplayer (Solo, Co-op, 1v4)
   - Enemy type (Ghost, Monster, Stalker)
   - Resource scarcity level

2. **Load horror-template** skill

3. **Generate complete game** with all systems

4. **Delegate to specialists**

## Example Usage

```
User: /create-horror

Agent: Creating a horror game! Let me customize it.

[Questions via AskUserQuestion]:

1. Which engine?
   → Godot ✓
   → Unity
   → Unreal

2. Horror sub-genre?
   → Investigation (Phasmophobia) ✓
   → Survival (Resident Evil)
   → Psychological (Silent Hill)
   → Asymmetric (Dead by Daylight)

3. Multiplayer?
   → Solo only
   → 2-4 player co-op ✓
   → 1v4 asymmetric

4. Enemy behavior?
   → Ghost (intangible, teleports) ✓
   → Monster (physical pursuit)
   → Stalker (follows, random attacks)

[Creating game...]

✅ Complete! Your horror game is ready:

## Game Features
- First-person controller with flashlight (battery drains)
- Ghost AI with hunting phases
- Investigation equipment (EMF, Thermometer, Spirit Box)
- Evidence system to identify ghost type
- Sanity system with visual/audio effects
- 4-player online co-op with proximity voice
- Atmospheric lighting and sound design

## Files Created
- scenes/player/horror_player.tscn
- scenes/enemies/ghost.tscn
- scenes/equipment/emf_reader.tscn, thermometer.tscn, etc.
- scenes/levels/house.tscn
- scripts/investigation_system.gd
- scripts/sanity_system.gd
- scripts/multiplayer_manager.gd

## How to Play
1. Enter the haunted location
2. Use equipment to gather evidence
3. Identify the ghost type
4. Don't let your sanity drop to zero
5. Survive the ghost's hunting phases
```

## What Gets Created

### Horror Systems
- Flashlight with battery
- Sanity with effects (whispers, shadows, hallucinations)
- Investigation equipment
- Evidence gathering
- Ghost identification

### Production Systems
- Main menu, pause, settings
- Lobby system (multiplayer)
- HUD with sanity bar, equipment
- Save/load progress

---

**Start creating your horror game!** Run `/create-horror` and answer the questions.
