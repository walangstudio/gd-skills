---
description: Coordinate several gd-skills agents on one feature in a single pass, then merge their input into one plan before building.
---

# Build Team Command

## What This Command Does

This command takes one focused feature and gathers input from several gd-skills
agents at once, then merges that input into a single plan. It suits a meaty
system such as combat or inventory where design, code, feel, and wiring matter.

It is heavier than the one-shot `/create-*` flow on purpose. For a whole game from
a description, the right tool is `/create-game`. For a quick component, the right
tool is `/create-component`.

## The Team

The command gathers four perspectives on the named feature. The game architect
covers scope, the right pattern, and the data the system needs. The engine
specialist covers idiomatic implementation in the target engine across godot,
unity, unreal, roblox, defold, or javascript. The game feel specialist covers
juice, feedback, and timing. The integration validator covers how the feature
wires into existing systems and what could break.

## Usage

```
/build-team combat system with combos and hitstop
/build-team inventory with grid + equipment slots
/build-team boss fight with three phases
```

## When to Use

- A system spanning design, code, feel, and wiring, rather than a trivial component
- When several aligned perspectives are worth having before committing
- Before building something that other systems will depend on

## When NOT to Use

- A whole game from a one-line idea, where `/create-game` fits better
- A small, well-understood component, where `/create-component` fits better
- A jam where speed beats deliberation

---

**Align before you build.** Run `/build-team` with a system name to bring architecture, engine, feel, and integration onto the same page in one pass.

Placeholder.
