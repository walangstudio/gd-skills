---
description: Create a complete puzzle game with grid mechanics, level progression, undo system, and star ratings. Supports Sokoban, physics, match-3, and pattern puzzles.
---

# Create Puzzle Command

## What This Command Does

Creates a complete puzzle game with:
- ✅ Grid-based puzzle engine with push mechanics
- ✅ Undo/redo system
- ✅ Level progression with star ratings
- ✅ Level select screen
- ✅ Save/load progress
- ✅ Move counter and par targets

## When to Use

- Want a Sokoban/Baba Is You style puzzle game
- Need grid-based logic puzzles
- Want match-3 or pattern puzzles
- Creating physics puzzle gameplay

## How It Works

The **genre-template-master** agent will:

1. **Ask customization questions** via AskUserQuestion:
   - Target engine
   - Puzzle type (Sokoban, Physics, Pattern, Match-3, Spatial)
   - Perspective (Top-down 2D, Side-view, First-person 3D)
   - Features (Undo, Star ratings, Level editor, Hints)
   - Number of levels

2. **Load puzzle-template** skill

3. **Generate complete game** with all systems

## Example Usage

```
User: /create-puzzle

Agent: Creating a puzzle game! Let me customize it.

[Questions via AskUserQuestion]:

1. Which engine?
   → Godot ✓

2. Puzzle type?
   → Sokoban/Push block ✓

3. Perspective?
   → Top-down 2D ✓

4. Features?
   → Undo/redo ✓
   → Star ratings ✓
   → Level editor

[Creating game...]

✅ Complete! Your puzzle game is ready.
```

---

**Start creating your puzzle game!** Run `/create-puzzle` and answer the questions.
