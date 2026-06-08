# Self-Repair Loop

> Run the game, look at the frame, fix what's wrong, repeat. Grounds correctness
> in the running game instead of the source. Drives the `/self-repair` command.

## Why

A syntax check and a green test suite still miss the bugs you only see when the
game runs: a black screen, a sprite spawned off-camera, input that does nothing,
a level that loads with errors. The self-repair loop catches these by judging the
actual frame and error log, the way a developer hitting Play would.

## Requirements

A connected engine MCP server (configs in `mcp-configs/`). The loop is only as
good as the MCP's tools — it needs at least "run" and "read errors", and ideally
"capture screenshot". Without an MCP, `/self-repair` explains setup and stops.

## The loop

```
state intent  ->  run  ->  observe (screenshot + log)  ->  diff vs intent
      ^                                                          |
      |                                                          v
   report  <-----------------  fix smallest gap  <----  name the gap
   (bounded by an iteration budget; stop on success, clean log, or budget)
```

1. **Intent** — one checkable sentence about what should be on screen.
2. **Run** — launch via the MCP.
3. **Observe** — screenshot + error/warning log.
4. **Diff** — name one concrete gap.
5. **Fix** — smallest change; route to the engine specialist/debugger.
6. **Repeat / Report** — never claim success the frame doesn't show.

## Per-engine tool mapping

Tool names vary by MCP implementation; these are the shapes to look for (see each `mcp-configs/<engine>-mcp-example.json`).

| Engine | Run | Read errors | Screenshot | Notes |
|--------|-----|-------------|------------|-------|
| Godot | `godot_run_scene` | `godot_get_errors` | via editor/headless capture | most mature, start here |
| Defold | `defold_run` | `defold_get_errors` | window capture | open + scriptable; start here |
| Unity | `unity_run` / test runner | console read | editor capture | once MCP wired |
| Unreal | `ue_run` | automation log | high-res shot | last (heavy build step) |
| Web | browser run | console read | page screenshot | Puppeteer/Playwright MCP |

## Limits (be honest about these)

- **Screenshot diffing is heuristic.** "Looks right" is a judgment from the frame, not a pixel assertion. Pair with `/acceptance` tests for logic correctness.
- **Headless vs windowed.** Some engines need a display/RHI to render; headless runs may not produce a meaningful frame. Know which mode the MCP uses.
- **Flakiness.** Launch/capture can be slow or intermittent; the budget exists so a flaky run doesn't loop forever.
- **No dialogs.** Triggering a modal/alert blocks the MCP session — the loop avoids actions that do.
- **Engine coverage.** Godot/Defold first; Unity/Unreal/Web as their MCPs mature.

## Relationship to other tools

- `/acceptance` + tests prove the logic; self-repair proves the *visible* result. Use both.
- `/build-team` or `/create-*` produce the change; `/self-repair` hardens it against what actually renders.
- Engine specialists and the debugger agents (`physics-debugger`, `ai-debugger`, etc.) own the fixes the loop routes to them.
