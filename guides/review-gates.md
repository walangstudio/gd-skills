# Review Gates

> Tiered DESIGN rigor on top of the baseline. Baseline autonomous validation
> (`guides/autonomous-validation.md`) always runs — these gates add design/architecture
> sign-off for teams and shipping projects.

## What it is

A review gate is a checkpoint where a reviewer (the architect or a specialist) signs off before work advances to the next phase. **This is separate from validation:** every build self-validates its output regardless of mode (see `guides/autonomous-validation.md`). Review gates add *extra design rigor* — they are tiered so a game-jam dev moves fast and a team can be as rigorous as it wants.

## The three modes

| Mode | Adds (on top of baseline validation) | Use when |
|------|--------------------------------------|----------|
| **solo** (default) | nothing extra — output is still validated and self-fixed | game jams, prototypes, the one-shot `/create-*` flow |
| **lean** | a design/architecture gate at phase boundaries | solo devs who want a design sanity check at milestones |
| **full** | a design gate before each system + at every phase | teams, learning, anything shipping to players |

Set the mode in `design/session/active.md`:

```
- **Review mode**: solo
```

If the line is absent, the mode is **solo**. Override per run with `/review-gate <mode>`. Note: `solo` does NOT mean "no checks" — the build still runs the autonomous validation loop; `solo` just skips the extra design gates.

## How a gate works

When a gate fires, the reviewer returns one verdict:

- **APPROVE** — proceed.
- **CONCERNS** — proceed only if the user accepts the listed concerns; otherwise revise.
- **REJECT** — stop, fix the blockers, re-gate.

A gate never edits code. It reads the artifact (a design doc, the assembled systems, the entity registry) and returns the verdict + a short rationale. In `solo` mode these design gates don't fire — but the build still runs its autonomous validation loop and self-fixes, so the output is verified either way.

## Phase gates (lean + full)

- **Design gate** — after a design doc / system spec, before implementation. Reviewer: game-architect.
- **Architecture gate** — after the system layout, before wiring. Reviewer: game-architect.
- **Integration gate** — after assembly, before "done". Reviewer: integration-validator (also runs `/consistency-check` against the entity registry).
- **Release gate** — before shipping. Reviewer: integration-validator + game-feel-specialist.

## Per-step gates (full only)

In `full` mode each system added (player, combat, save, UI) gets a quick design + integration review before the next system starts. This catches drift early at the cost of speed — only worth it on team/shipping projects.

## Builders and gates

`full-game-builder`, `component-builder`, and `genre-template-master` always run the autonomous validation loop, and additionally invoke a design gate when the mode is `lean` or `full`. In `solo` they skip the extra design gates but still validate and self-fix the output — that's what keeps the generator fast *without* handing back broken games.

## When to raise the mode

- Stay in `solo` for jams and prototypes — the output is still validated.
- Use `lean` when you want a design sanity check at milestones on a real project.
- Use `full` for teams, learning, or anything shipping to players.

Gates add design confidence on real projects; they are not what keeps the output correct — the autonomous validation loop does that in every mode.

## Related
- `/review-gate` sets or shows the mode.
- `guides/verification-driven-dev.md` + `/acceptance` — in lean/full, systems get testable acceptance criteria before they're built.
- `guides/data-driven.md` and the entity registry back the integration gate's consistency check.
