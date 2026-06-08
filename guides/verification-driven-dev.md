# Verification-Driven Development

> Write the check before the code. A feature is done when a stated, testable
> criterion passes — not when it "looks done".

## What it is

Every non-trivial system gets **acceptance criteria** in Given/When/Then form
*before* it's built. Each criterion is independently checkable by someone who
didn't write the code. Where the engine supports it, criteria become real tests.
This is opt-in: in `solo` mode you skip it; in `lean`/`full` (see
`guides/review-gates.md`) the builders use it.

## Acceptance criteria (Given/When/Then)

```
Given the player is on the ground
When the jump input is pressed
Then vertical velocity is set to JUMP_VELOCITY and the "jumped" event fires

Given the player is in the air and has not double-jumped
When the jump input is pressed
Then a single double-jump is applied and further presses do nothing until landing

Given an enemy at 0 HP
When it takes any damage
Then it does not die twice and the "died" signal fires exactly once
```

Rules for good criteria:
- **One behavior each.** A criterion that needs "and" in the Then is two criteria.
- **Observable.** Phrased in terms someone can verify without reading the code.
- **No tautology.** "When jump is pressed, then the jump happens" tests nothing — name the concrete effect (velocity, event, state).
- **Cover the edges.** The double-die, the empty save, the pool-exhausted, the disconnect.

Numbers referenced (JUMP_VELOCITY, max HP) live in the entity registry
(`design/registry/entities.yaml`), so a criterion and the code agree on the value.

## Tests, per engine

When a test framework exists, turn each criterion into a failing test first, then
make it pass:

- **Godot** — GUT or gdUnit4: `test_jump_sets_velocity()` asserting on a headless scene.
- **Unity** — Unity Test Framework (EditMode/PlayMode), `[Test]` / `[UnityTest]`.
- **Unreal** — Automation Spec (`DEFINE_SPEC` / `It(...)`), headless `-nullrhi`.
- **Roblox** — TestEZ specs run via Lune/CI.
- **Defold** — a test collection + a Lua assert harness (or `deftest`); drive via `bob`.
- **Web** — Vitest/Jest for logic; Playwright for the rendered game.

For systems without practical automation (feel, juice, art), the "test" is a
written manual check or a `playtest-report` (see `docs/templates/`).

## Where it plugs in

1. `game-architect` writes acceptance criteria into the design (or a GDD from `docs/templates/`).
2. `/acceptance` turns a feature description into criteria + failing test stubs in the target engine's framework.
3. Builders (in `lean`/`full`) implement until the criteria pass, then `integration-validator` + `/consistency-check` confirm wiring and numbers.
4. `/story-done`-style sign-off: criteria green = done.

## When NOT to use it

- Jams and throwaway prototypes (`solo` mode) — skip it; speed wins.
- One-line throwaway scripts.

The point is confidence on real projects, not ceremony on every edit.

## Related
- `/acceptance` generates criteria + test stubs.
- `guides/review-gates.md` — VDD is active in lean/full.
- `guides/data-driven.md` + the entity registry — criteria reference registry numbers.
