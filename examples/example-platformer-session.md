# Example: Creating a Platformer

This walkthrough shows how to use `/create-platformer` to build a complete 2D platformer game.

## Session

```
User: /create-platformer

Agent: Creating a platformer game! Let me customize it for you.

[AskUserQuestion]:
1. Which engine?
   → Godot 4 ✓

2. Player abilities?
   → Jump + Double Jump + Dash ✓

3. How many levels?
   → 5 levels (medium) ✓

4. Health system?
   → Lives system (3 lives) ✓

5. Theme?
   → Forest/Nature ✓

Agent: Building your platformer...

[Loads skills: platformer-template, player-controllers, enemy-ai-patterns]
[Delegates to: godot-specialist agent]

✅ Complete! Your platformer is ready.

## Created Files
scenes/
├── player/player.tscn          # Player with movement, jump, dash
├── enemies/patrol_enemy.tscn   # Ground patrol enemy
├── enemies/flying_enemy.tscn   # Sine-wave flying enemy
├── collectibles/coin.tscn      # Collectible coin
├── levels/level_1.tscn         # Forest level 1
├── levels/level_2.tscn         # Forest level 2 (harder)
├── ui/hud.tscn                 # Score, lives, coins
├── ui/main_menu.tscn           # Play, Settings, Quit
└── ui/game_over.tscn           # Retry, Menu

scripts/
├── player.gd                   # CharacterBody2D with coyote time
├── enemy_patrol.gd             # Patrol AI with edge detection
├── coin.gd                     # Collection with tween animation
├── game_manager.gd             # Score, lives, level progression
└── hud.gd                      # UI updates

## How to Play
- Arrow keys / WASD: Move
- Space: Jump (press again for double jump)
- Shift: Dash
- Collect coins, avoid enemies, reach the exit!
```

## What Skills Were Used
- `platformer-template` → Overall game structure
- `player-controllers` → Base movement controller
- `enemy-ai-patterns` → Patrol enemy behavior
- `godot-patterns` → Engine-specific implementation
