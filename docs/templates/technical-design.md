# Technical Design: <System Name>

> What this system does in one line, and which GDD mechanic it serves.

## Engine & Constraints
Target engine, version, performance budget (frame time / entity count / memory), platform limits.

## Data Model
The data the system owns. Registry-defined facts (stats, costs, formulas) referenced by id from `design/registry/entities.yaml`. Config vs code split.

## Components / Objects
The pieces and their responsibilities. Keep each one focused. For the chosen communication pattern, see `guides/message-passing.md` / `guides/event-bus.md`.

## Control Flow
How a typical operation runs end to end. Lifecycle hooks used, update vs event-driven, async boundaries.

## Interfaces
The messages / signals / events / methods other systems use to talk to this one. Inputs, outputs, ownership.

## Failure & Edge Cases
What happens on bad input, missing references, save mid-operation, disconnect (if networked). The states that must never corrupt.

## Test Hooks
How correctness is verified: what to assert, what a passing run looks like. Feeds `/validate-integration` and `/consistency-check`.

## Open Questions
Unresolved technical decisions.
