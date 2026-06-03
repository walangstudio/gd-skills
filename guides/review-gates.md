# Review Gates

> Opt-in quality checkpoints between phases. Default is **solo** — no gates — so the fast `/create-*` path is never slowed.

## What it is

A review gate is a checkpoint where a reviewer (the architect or a specialist) signs off before work advances to the next phase. gd-skills borrows the idea from full-studio workflows but makes it **opt-in and tiered**, so a game-jam dev moves at full speed and a team can be as rigorous as it wants.

## The three modes

| Mode | Gates run | Use when |
|------|-----------|----------|
| **solo** (default) | none | game jams, prototypes, the one-shot `/create-*` flow — maximum speed |
| **lean** | only phase gates (before moving to the next major phase) | solo devs who want a sanity check at milestones |
| **full** | every step (design, architecture, each system, release) | teams, learning, anything shipping to players |

Set the mode in `design/session/active.md`:

```
- **Review mode**: solo
```

If the line is absent, the mode is **solo**. Override per run with `/review-gate <mode>`.

## How a gate works

When a gate fires, the reviewer returns one verdict:

- **APPROVE** — proceed.
- **CONCERNS** — proceed only if the user accepts the listed concerns; otherwise revise.
- **REJECT** — stop, fix the blockers, re-gate.

A gate never edits code. It reads the artifact (a design doc, the assembled systems, the entity registry) and returns the verdict + a short rationale. In `solo` mode no gate fires at all — builders skip the gate section entirely.

## Phase gates (lean + full)

- **Design gate** — after a design doc / system spec, before implementation. Reviewer: game-architect.
- **Architecture gate** — after the system layout, before wiring. Reviewer: game-architect.
- **Integration gate** — after assembly, before "done". Reviewer: integration-validator (also runs `/consistency-check` against the entity registry).
- **Release gate** — before shipping. Reviewer: integration-validator + game-feel-specialist.

## Per-step gates (full only)

In `full` mode each system added (player, combat, save, UI) gets a quick design + integration review before the next system starts. This catches drift early at the cost of speed — only worth it on team/shipping projects.

## Builders and gates

`full-game-builder`, `component-builder`, and `genre-template-master` each read the review mode and only invoke a gate when the mode is `lean` or `full`. In `solo` they behave exactly as before — no extra prompts, no waiting. This is what keeps the generator fast by default.

## When NOT to use gates

- Prototypes and jams — stay in `solo`.
- A single small component — the gate overhead isn't worth it.
- When the user explicitly wants speed over rigor.

Gates are a tool for confidence on real projects, not a tax on every action.

## Related
- `/review-gate` sets or shows the mode.
- `guides/data-driven.md` and the entity registry back the integration gate's consistency check.
