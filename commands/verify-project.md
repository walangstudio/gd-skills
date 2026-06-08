---
description: Post-generation project checker. Audits a generated game for completeness, wiring, consistency, configurability, and a working core loop, then reports a PASS/WARN/FAIL checklist and proposes fixes.
---

# Verify Project Command

## What This Command Does

The explicit "is this game actually done?" gate — run it after generation, after assembling
components by hand, or before shipping. It runs the full autonomous-validation flow
(`guides/autonomous-validation.md`) over an existing project and reports a single checklist:
what's complete, what's wired, what's hardcoded, and whether the core loop works — with concrete
fixes. It proposes fixes; with your go-ahead it applies them.

This is the same flow the builders run automatically after every `/create-*`
(`guides/autonomous-validation.md`). `/verify-project` lets you re-run it on demand, or audit a
project that wasn't built by this plugin.

## Usage

```
/verify-project
```

## What it checks

1. **Completeness** — every system the game promised exists (player, enemies, combat, UI, menus,
   save/load, audio as applicable); no TODO / stub / placeholder / empty handler left behind;
   every referenced scene/prefab/script/asset path resolves; there is a runnable entry point.
2. **Wiring** — the `integration-validator`: every signal/event has a listener, no null/nil refs
   at entry points, save covers runtime state, client/server (Roblox) and scene/prefab
   (Unity/Godot) links hold.
3. **Consistency** — if `design/registry/entities.yaml` exists, code/docs match it
   (runs `/consistency-check`).
4. **Configurability** — tunables are exported properties / config data per
   `rules/configuration-and-tuning.md`; flags magic numbers buried in logic (speeds, health,
   damage, timers, costs, level data) and proposes hoisting them to a discoverable, editable
   surface.
5. **Core loop** — derives 3–6 acceptance criteria (move, reach a win state, reach a lose state,
   menu → gameplay → game over, save round-trips) and traces each against the code. With a
   connected engine MCP, `/self-repair` confirms it on screen.

## Output

```
## Project Verification

| Check           | Status | Detail                                                |
|-----------------|--------|-------------------------------------------------------|
| Completeness    | PASS   | 8/8 promised systems present, no stubs / dead refs    |
| Wiring          | PASS   | all signals connected; save covers inventory          |
| Consistency     | WARN   | goblin damage 7 in code vs 5 in registry              |
| Configurability | FAIL   | player speed/jump hardcoded in player.gd:42,55        |
| Core loop       | PASS   | move ✓, reach exit → win ✓, hit → lose life → over ✓   |

### Summary — PASS 3 | WARN 1 | FAIL 1

### Proposed fixes
1. [Config] Hoist player.gd speed (200) / jump (-400) to `@export` vars (or a tuning Resource).
2. [Consistency] Reconcile goblin damage — code 7 ↔ registry 5.
```

## Relationship to the other checkers

- `/validate-integration` is the wiring slice only; `/verify-project` is the whole gate.
- `/consistency-check` is the registry slice; `/verify-project` runs it as one step.
- `/review-gate` controls *extra design* rigor; `/verify-project` is the output-correctness gate
  that always applies.

## Agent

Drives the `integration-validator` plus the relevant engine specialist to read the project, map
its systems, and report.

---

**Run the full gate.** `/verify-project` after generation confirms the game is complete, wired,
configurable, and playable — not just emitted.
