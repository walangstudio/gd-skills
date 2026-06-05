# Autonomous Validation

> Generate, then validate and self-fix before handing back. The builder verifies
> its own output so the user reviews a working game, not a broken one. This runs
> by default on every `/create-*` and build — it is not opt-in.

## Why

The fast path used to generate a game and stop, leaving the user to discover what
was broken. That makes the user the QA. Instead, after generating, the builder
runs a validation loop and fixes what it can, then reports what it verified. The
user is the last check, not the first.

## The loop (the builder MUST do this before saying "done")

1. **Wire check** — run the `integration-validator` over the assembled components: every emitted event/signal has a listener, no null/nil references at runtime entry points, save/load covers all runtime state, client/server boundaries hold (Roblox), scene/prefab links resolve (Unity/Godot). Fix every FAIL.
2. **Consistency** — if `design/registry/entities.yaml` exists, run the `/consistency-check`: stats, item values, and formulas in the code match the registry. Fix mismatches (or reconcile the registry to the intended values).
3. **Functional self-check** — derive 3–6 acceptance criteria for what was actually built (the core loop runs; the player can move; a win and a lose state are reachable; menu → gameplay → game over flows; settings persist; save/load round-trips) and verify each against the code by reading and tracing it. Where an engine MCP is connected, run `/self-repair` to confirm it on screen. Fix failures.
4. **Repeat** — after fixing, re-run the checks. Loop up to a small bounded number of times (a handful) until the checks pass or only non-blocking warnings remain.
5. **Report** — emit a short Verification summary (below). Hand back a game that passed, or a clear blocker.

## Escalate only for genuine blockers

Do not bounce routine findings back to the user — fix them. Come back only when:
- the design intent is ambiguous (two reasonable behaviors, the choice changes the game),
- something external is missing (an asset, a key, an engine/tool not installed),
- a fix would exceed the requested scope (a whole new system).

When you escalate, ask one specific question with options — never "it might have issues, please check."

## Verification report (what the user sees)

```
## Verification
- Wiring: PASS (player→HUD health signal, combat→enemy on-hit, save→inventory all connected)
- Consistency: PASS (goblin/gold/player stats match the registry)
- Core loop: PASS (move ✓, reach exit → win ✓, touch enemy → lose life → game over ✓)
- Menus: PASS (main → play → pause → game over → main)
- Fixed during validation: 2 (wired the missing SaveSystem→inventory call; corrected goblin damage 7→5 to match registry)
- Open: none
```

If something can't be auto-verified (e.g. visual feel without an engine MCP), say so
explicitly rather than implying it passed.

## Relationship to review gates

This baseline validation **always runs**. `/review-gate` controls *additional design
rigor* on top of it (see `guides/review-gates.md`):
- **solo** (default) — baseline validation only.
- **lean** — + a design/architecture gate at phase boundaries.
- **full** — + a design check before each system is built.

`solo` no longer means "no checks" — it means "validate the output, skip the
extra design gates."
