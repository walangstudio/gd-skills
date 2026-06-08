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

1. **Completeness** — every system the game promised is actually present (player, enemies/obstacles, combat/interaction, UI/HUD, menus, save/load, audio — whatever the genre + the user's answers implied). No TODO / stub / placeholder / empty handler / `pass`-only function left behind; every referenced scene/prefab/script/asset path resolves; there is a runnable entry point. Build what's missing; delete dead references.
2. **Wire check** — run the `integration-validator` over the assembled components: every emitted event/signal has a listener, no null/nil references at runtime entry points, save/load covers all runtime state, client/server boundaries hold (Roblox), scene/prefab links resolve (Unity/Godot). Fix every FAIL.
3. **Consistency** — if `design/registry/entities.yaml` exists, run the `/consistency-check`: stats, item values, and formulas in the code match the registry. Fix mismatches (or reconcile the registry to the intended values).
4. **Configurability** — enforce `rules/configuration-and-tuning.md`: tunables (speed, jump, gravity, health, damage, cooldowns, spawn rates, costs, timers, level/wave data) are exported/serialized properties or config data in one discoverable place — NOT bare literals buried in logic. Hoist any magic numbers found in hot paths to the engine-idiomatic config surface (Godot `@export`/Resource, Unity `[SerializeField]`/ScriptableObject, Unreal `UPROPERTY`/DataAsset, Roblox Attributes/config module, Defold `go.property`/config module, Web `config.js`/JSON).
5. **Functional self-check** — derive 3–6 acceptance criteria for what was actually built (the core loop runs; the player can move; a win and a lose state are reachable; menu → gameplay → game over flows; settings persist; save/load round-trips) and verify each against the code by reading and tracing it. Where an engine MCP is connected, run `/self-repair` to confirm it on screen. Fix failures.
6. **Repeat** — after fixing, re-run the checks. Loop up to a small bounded number of times (a handful) until the checks pass or only non-blocking warnings remain.
7. **Report** — emit a short Verification summary (below). Hand back a game that passed, or a clear blocker.

The user can re-run this whole flow on demand (or against a hand-built project) with `/verify-project`.

## Escalate only for genuine blockers

Do not bounce routine findings back to the user — fix them. Come back only when:
- the design intent is ambiguous (two reasonable behaviors, the choice changes the game),
- something external is missing (an asset, a key, an engine/tool not installed),
- a fix would exceed the requested scope (a whole new system).

When you escalate, ask one specific question with options — never "it might have issues, please check."

## Verification report (what the user sees)

```
## Verification
- Completeness: PASS (8/8 promised systems present; no stubs/TODOs; all asset/scene refs resolve)
- Wiring: PASS (player→HUD health signal, combat→enemy on-hit, save→inventory all connected)
- Consistency: PASS (goblin/gold/player stats match the registry)
- Configurability: PASS (speed/jump/health/damage are @export/config — no magic numbers in logic)
- Core loop: PASS (move ✓, reach exit → win ✓, touch enemy → lose life → game over ✓)
- Menus: PASS (main → play → pause → game over → main)
- Fixed during validation: 3 (wired the missing SaveSystem→inventory call; corrected goblin damage 7→5 to match registry; hoisted hardcoded player speed/jump to @export vars)
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
