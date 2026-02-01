---
description: Create a complete racing game with vehicle physics, tracks, AI opponents, and lap management. Supports kart, arcade, simulation, and endless runner styles.
---

# Create Racing Command

## What This Command Does

Creates a complete racing game with:
- ✅ Vehicle controller with drift and boost
- ✅ Track system with checkpoints and laps
- ✅ AI opponents with rubber-banding
- ✅ Race positioning and timing
- ✅ Speedometer, minimap, lap counter
- ✅ Items/power-ups (kart mode)

## When to Use

- Want a Mario Kart/Need for Speed style game
- Need vehicle physics and racing mechanics
- Want AI opponents and leaderboards
- Creating kart, arcade, or sim racing

## How It Works

The **genre-template-master** agent will:

1. **Ask customization questions** via AskUserQuestion:
   - Target engine
   - Racing type (Kart, Arcade, Simulation, Endless Runner)
   - Camera (Chase, Bumper, Top-down)
   - Features (Drift, Items, Customization, Split-screen)
   - Number of tracks

2. **Load racing-template** skill

3. **Generate complete game** with all systems

## Example Usage

```
User: /create-racing

Agent: Creating a racing game! Let me customize it.

[Questions via AskUserQuestion]:

1. Which engine?
   → Godot ✓

2. Racing type?
   → Kart (Mario Kart) ✓

3. Features?
   → Drift + boost ✓
   → Items/power-ups ✓
   → Split-screen ✓

[Creating game...]

✅ Complete! Your racing game is ready.
```

---

**Start creating your racing game!** Run `/create-racing` and answer the questions.
