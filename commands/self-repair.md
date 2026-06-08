---
description: Run the game through an engine MCP, capture a screenshot and the error log, compare against the intended result, and auto-fix visible defects in a loop. Requires a connected engine MCP server. Best on Godot and Defold first.
---

# Self-Repair Command

## What This Command Does

Closes the loop between code and the running game. Instead of judging "done" from
the source, it launches the game through an engine MCP, looks at the actual frame
and error log, compares them to what you asked for, fixes the gap, and repeats
until the game looks and behaves right (or it runs out of its iteration budget).

This is the Godogen-style idea: defects that pass a syntax check but are visible
on screen (a sprite off the edge, a black screen, a stuck player) get caught
because the loop grounds itself in the running game, not the code.

## Requirements

A connected engine MCP server (see `mcp-configs/`). Without one, this command
explains what to install and stops — it does not pretend to run. Maturity by
engine today:

- **Godot** and **Defold** first (open, scriptable, fast to launch headless or windowed)
- Unity and Unreal once their MCP servers are wired
- Web via a browser-automation MCP (Puppeteer/Playwright)

## The Loop

1. **Detect MCP.** Find a connected engine MCP. If none, print setup steps from `mcp-configs/` and stop.
2. **State the intent.** Restate, in one checkable sentence, what the current change should produce on screen (the player jumps, the menu shows three buttons, the level loads without errors).
3. **Run.** Launch the scene/build via the MCP (e.g. `godot_run_scene`, `defold_run`).
4. **Observe.** Capture a screenshot and the error/warning log (e.g. `godot_get_errors`, `defold_get_errors`).
5. **Diff vs intent.** Compare the frame + log against the intent. Name the specific gap (black screen, error on line N, sprite at wrong position, no input response).
6. **Fix.** Make the smallest change that addresses the named gap. Route engine-specific fixes to the matching specialist or debugger agent.
7. **Repeat** from step 3 until the intent is met, the log is clean, or the iteration budget is hit.
8. **Report.** Summarize what was wrong, what was changed, and the final state. If the budget ran out, say what is still off — never claim success the screenshot doesn't show.

## Usage

```
/self-repair                       # repair the current change against its stated intent
/self-repair the player should reach the exit flag on level 1
/self-repair menu should show Play, Settings, Quit and respond to clicks
```

## Guardrails

- Bounded: stops after a fixed number of iterations (default a handful) to avoid loops.
- Honest: a finding is only "fixed" when the screenshot/log shows it. No silent success.
- Minimal diffs: one named gap, one smallest fix, re-run — not a rewrite.
- Does not trigger engine dialogs/modals that would block the MCP session.

## When to Use

- After a `/create-*` or `/build-team` pass, to catch what looks-done-but-isn't
- When a change compiles but the game misbehaves on screen
- Before a playtest, to clear obvious visible defects

## When NOT to Use

- No engine MCP connected (it will just tell you to set one up)
- Pure logic/unit-testable changes — use `/acceptance` + tests instead
- A quick text tweak

See `guides/self-repair-loop.md` for the per-engine tool mapping and limits.

---

**See it, then fix it.** `/self-repair` grounds the fix in the running game, not the source.
