---
description: Update the session checkpoint (design/session/active.md) after a milestone so the next session can resume instantly. Optionally mirrors the decision into a mememo MCP for persistent memory.
---

# Checkpoint Command

## What This Command Does

Writes the current state of your game project to `design/session/active.md` — the
portable checkpoint surfaced at the start of every session. Use it after finishing
a system or making a notable decision, so a fresh session (or after a context
compaction) can pick up exactly where you left off.

This is opt-in. It does not run automatically and never interrupts the `/create-*`
flow.

## How It Works

1. Read the current `design/session/active.md` (create from the template if missing).
2. Update the fields from the current work:
   - **Engine**, **Game**, **Current milestone**
   - **Done** — append what was just completed
   - **Next** — the immediate next step
   - **Blockers** — anything stuck
   - **Key files** — the files that matter for resuming
   - `_Last updated:_` — today's date
3. Keep it terse — this is a checkpoint, not a log. Trim stale "Next" items.
4. **If a mememo MCP is available**, also `store_decision` / `store_memory` for any
   durable decision (keyed by the project) so it survives across sessions. If not,
   `active.md` alone is the source of truth.

## Usage

```
/checkpoint                       # update from current context
/checkpoint finished save system  # hint about what was just done
```

## When to Use

- After completing a system (player, combat, save/load, UI)
- Before ending a session or when context is about to compact
- After a design decision you'll want to remember next time

---

**Never lose your place.** Run `/checkpoint` after each milestone; the next session resumes from it automatically.
