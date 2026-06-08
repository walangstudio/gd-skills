---
description: Turn a feature or system into testable Given/When/Then acceptance criteria, then generate failing test stubs in the target engine's framework. The verification-first half of the build loop.
---

# Acceptance Command

## What This Command Does

Takes a feature description and produces:

1. **Acceptance criteria** in Given/When/Then form, one behavior each, edge cases included.
2. **Failing test stubs** in the target engine's test framework, one per criterion, ready to make pass.

It writes the check before the code. See `guides/verification-driven-dev.md` for
the why. This is opt-in and most useful in `lean`/`full` review mode; in `solo`
mode the fast path skips it.

## How It Works

1. Read the target engine from the session checkpoint (ask if unknown).
2. Draft criteria from the feature description. Each is observable, single-behavior, and non-tautological. Numbers come from the entity registry (`design/registry/entities.yaml`) when they exist.
3. Pick the engine's framework and emit one failing test stub per criterion:
   - Godot: GUT / gdUnit4
   - Unity: Unity Test Framework (EditMode/PlayMode)
   - Unreal: Automation Spec
   - Roblox: TestEZ
   - Defold: Lua assert harness / deftest collection
   - Web: Vitest/Jest (logic), Playwright (rendered)
4. Present criteria + stubs for approval before writing.

## Usage

```
/acceptance double-jump with coyote time
/acceptance save system covers inventory, health, and unlocked levels
/acceptance boss phase transitions at 66% and 33% HP
```

## Output (shape)

```
## Acceptance Criteria: double-jump with coyote time

1. Given on ground, When jump pressed, Then velocity.y = JUMP_VELOCITY and "jumped" fires
2. Given just left a ledge within COYOTE_TIME, When jump pressed, Then a ground jump still applies
3. Given in air past coyote window and not double-jumped, When jump pressed, Then exactly one double-jump applies
4. Given already double-jumped, When jump pressed, Then nothing happens until landing

## Test stubs (Godot / GUT)
- test_ground_jump_sets_velocity()   # failing
- test_coyote_jump_within_window()   # failing
- test_double_jump_once()            # failing
- test_no_triple_jump()              # failing
```

## When to Use

- Before building a non-trivial system on a real (non-jam) project
- When a feature has tricky edges (double-fire, empty state, pool exhaustion, disconnect)
- Alongside `/review-gate lean` or `full`

## When NOT to Use

- Jams and throwaway prototypes (`solo` mode)
- Trivial one-off scripts

---

**Check first, then build.** `/acceptance` writes the criteria and failing tests so "done" means "passes", not "looks right".
