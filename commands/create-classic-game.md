---
description: Create a classic arcade, card, board, puzzle, or retro game. Supports Tetris, Snake, Solitaire, Chess, Space Invaders, and more.
---

# Create Classic Game Command

## What This Command Does

Creates a complete classic game with:
- ✅ Core game mechanics for chosen genre
- ✅ Score system with high scores and combos
- ✅ Grid/board system (puzzle and board games)
- ✅ Card system (card games)
- ✅ Difficulty progression
- ✅ Polish (screen shake, particles, sounds)

## When to Use

- Want to recreate a classic game (Tetris, Snake, Pac-Man)
- Building card or board games
- Need a simple, polished game quickly
- Learning game development with proven designs

## How It Works

The **genre-template-master** agent will:

1. **Ask customization questions** via AskUserQuestion:
   - Target engine
   - Game genre (Arcade, Puzzle, Card, Board, Retro)
   - Specific game (Tetris, Snake, Solitaire, Chess, etc.)
   - Visual style (Pixel, Minimalist, Neon, Hand-drawn)
   - Multiplayer (Solo, Local 2P, Online)

2. **Load classic-games-template** skill

3. **Generate complete game** with all systems

4. **Add polish and game feel**

## Example Usage

```
User: /create-classic-game

Agent: Creating a classic game! Let me customize it.

[Questions via AskUserQuestion]:

1. Which engine?
   → Godot ✓
   → Unity
   → JavaScript (HTML5)

2. Game genre?
   → Arcade (Space Invaders, Breakout)
   → Puzzle (Tetris, Match-3, 2048) ✓
   → Card (Solitaire, Poker)
   → Board (Chess, Checkers)
   → Retro Action (Snake, Pong)

3. Specific game?
   → Tetris ✓
   → Match-3
   → 2048
   → Minesweeper

4. Visual style?
   → Pixel art retro ✓
   → Clean minimalist
   → Neon/synthwave
   → Hand-drawn

[Creating game...]

✅ Complete! Your Tetris clone is ready:

## Game Features
- 7 standard tetrominoes with wall kicks
- Line clearing with combo scoring
- Ghost piece preview
- Next piece display
- Level progression (speed increases)
- High score save/load
- Screen shake and particles on line clear

## Files Created
- scenes/game/tetris_board.tscn
- scenes/ui/hud.tscn
- scenes/ui/game_over.tscn
- scripts/game_board.gd
- scripts/piece_system.gd
- scripts/score_system.gd

## Controls
- ←/→: Move piece
- ↑: Rotate
- ↓: Soft drop
- Space: Hard drop
- P: Pause
```

## What Gets Created

### Game Systems
- Grid/Board for spatial games
- Card deck for card games
- Score system with combos and high scores
- Piece/tetromino system (puzzle games)
- Input handling per genre

### Production Systems
- Main menu with high scores
- Pause screen
- Game over with retry
- Settings (volume, controls)

---

**Start creating your classic game!** Run `/create-classic-game` and pick your genre.
