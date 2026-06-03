---
description: Show or set the review-gate mode (solo / lean / full) for this project. Controls whether builders pause for architect/validator sign-off between phases. Default is solo (no gates) so the fast /create-* path is never slowed.
---

# Review Gate Command

## What This Command Does

Sets the **review mode** that builders read before advancing between phases. Modes:

- **solo** (default) — no gates; maximum speed (jams, prototypes, one-shot generation)
- **lean** — gates only at phase boundaries (design → impl, before "done", before release)
- **full** — a gate at every step (each system reviewed before the next)

See `guides/review-gates.md` for the full model and verdict handling.

## How It Works

1. With no argument, report the current mode (read the `- **Review mode**:` line from `design/session/active.md`; if absent, it's `solo`).
2. With an argument (`solo` | `lean` | `full`), update that line in `design/session/active.md` (creating the file from its template if needed).
3. Confirm the new mode and what it means for the next builder run.

This command only sets a flag. It never reviews code itself — the gates fire inside the builders when the mode is `lean` or `full`.

## Usage

```
/review-gate            # show current mode
/review-gate lean       # gates at phase boundaries only
/review-gate full       # gate every step
/review-gate solo       # back to no gates (default)
```

## When to Use

- Switch to `lean` or `full` when a prototype becomes a real project you intend to ship.
- Stay on (or return to) `solo` for jams and quick experiments.

---

**Control the rigor.** `/review-gate lean` adds milestone sign-offs; `/review-gate solo` keeps the generator fast.
