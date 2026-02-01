---
description: Add a leaderboard system with local high scores, online rankings, and score submission. Works with any game genre.
---

# Create Leaderboard Command

## What This Command Does

Adds a leaderboard system with:
- ✅ Local high score tracking and persistence
- ✅ Score entry with player name
- ✅ Top-N display with formatting
- ✅ Multiple leaderboard categories
- ✅ Online leaderboard (optional, via HTTP API)
- ✅ Leaderboard UI screen

## How It Works

1. **Ask customization questions**:
   - Score type (Points, Time, Distance, Waves)
   - Storage (Local only, Online via API)
   - Display format (Top 10, Scrollable list)
   - Categories (Overall, Per-level, Per-mode)
   - Engine (Godot, Unity)

2. **Generate leaderboard system**

3. **Create leaderboard UI**

## Features

### Local Leaderboard
- Save/load from file (JSON)
- Sorted by score (ascending or descending)
- Player name entry on new high score
- Persistent across sessions

### Online Leaderboard (Optional)
- Submit scores via HTTP POST
- Fetch top scores via HTTP GET
- Anti-cheat validation (basic)
- Rate limiting

---

**Add leaderboards!** Run `/create-leaderboard` to get started.
