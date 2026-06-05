---
description: Show or set the review-gate mode (solo / lean / full) for this project. Controls extra DESIGN sign-off on top of the always-on autonomous validation. Default is solo (output still validated, no extra design gates).
---

# Review Gate Command

## What This Command Does

Sets the **review mode** for *design* rigor. Output is **always** auto-validated and self-fixed regardless of mode (see `guides/autonomous-validation.md`); the mode only adds design/architecture sign-off:

- **solo** (default) — no extra design gates; output is still validated (jams, prototypes, one-shot generation)
- **lean** — a design gate at phase boundaries (design → impl, before "done", before release)
- **full** — a design gate at every step (each system reviewed before the next)

See `guides/review-gates.md` for the full model and verdict handling.

## How It Works

1. With no argument, report the current mode (read the `- **Review mode**:` line from `design/session/active.md`; if absent, it's `solo`).
2. With an argument (`solo` | `lean` | `full`), update that line in `design/session/active.md` (creating the file from its template if needed).
3. Confirm the new mode and what it means for the next builder run.

This command only sets a flag for *design* rigor. It does not control validation — builders always run the autonomous validation loop. The extra design gates fire inside the builders when the mode is `lean` or `full`.

## Usage

```
/review-gate            # show current mode
/review-gate lean       # gates at phase boundaries only
/review-gate full       # gate every step
/review-gate solo       # no extra design gates (default; output still validated)
```

## When to Use

- Switch to `lean` or `full` when a prototype becomes a real project you intend to ship.
- Stay on (or return to) `solo` for jams and quick experiments.

---

**Control the design rigor.** Output is always validated; `/review-gate lean` adds milestone design sign-offs, `/review-gate solo` keeps just the baseline.
