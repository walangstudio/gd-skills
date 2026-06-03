---
description: Cross-check your game's code and design docs against the entity registry (enemy stats, item values, formulas). Flags mismatches and proposes fixes without editing anything. Produces a PASS/WARN/FAIL table.
---

# Consistency Check Command

## What This Command Does

Reads `design/registry/entities.yaml` (your copy of `design/registry/entities.example.yaml`) and verifies that the rest of your project agrees with it:

- Entity stats (health, damage, speed, armor) match what the code uses
- Item values match across systems
- Shared formulas are implemented consistently
- Nothing references a number the registry doesn't define

This catches the classic bug where the Combat system thinks the Goblin has 30 HP but the Loot table was balanced for 20.

It is **read-and-report only** — it proposes fixes but does not edit your files. The fast `/create-*` path is unaffected.

## How It Works

1. Load `design/registry/entities.yaml`. If only `entities.example.yaml` exists, tell the user to copy it first.
2. For each entity / item / formula, read the files listed in its `source_files` (and scan obvious sibling design docs / GDDs for the same ids).
3. Extract the numeric facts from those files (e.g. `health = 20`, `const DAMAGE := 5`, a heal value) using `Read` / `Grep`.
4. Compare against the registry. Classify each finding:
   - **PASS** — code agrees with the registry
   - **WARN** — registry value not found in any source file (can't confirm)
   - **FAIL** — code value contradicts the registry
5. Append every WARN/FAIL to `design/registry/consistency-failures.log` as
   `<ISO8601> | <severity> | <entity_id> | <file> | <message>`.
6. Print the summary table and a Required Fixes list (proposed, not applied).

## Usage

```
/consistency-check
```

Run after assembling systems that share numbers (combat + loot + economy + UI), or before a balance pass.

## Output

```
## Consistency Report

| Fact                          | Registry | Found        | File                          | Status |
|-------------------------------|----------|--------------|-------------------------------|--------|
| goblin.health                 | 30       | 30           | scripts/enemies/goblin.gd     | PASS   |
| goblin.damage                 | 5        | 7            | scripts/enemies/goblin.gd     | FAIL   |
| gold.value                    | 1        | (not found)  | —                             | WARN   |
| damage_after_armor            | matches  | matches      | scripts/combat/damage.gd      | PASS   |

### Summary
- PASS: 2 | WARN: 1 | FAIL: 1

### Proposed Fixes (not applied)
1. [FAIL] scripts/enemies/goblin.gd: set damage to 5 (registry) — or update the registry if 7 is intended.

Logged 2 finding(s) to design/registry/consistency-failures.log
```

## When to Use

- After `/create-rpg`, `/create-survival`, `/create-tower-defense`, or any data-heavy game
- After manually balancing stats across `/create-enemy`, `/create-health`, `/create-leaderboard`
- Before a release or a balance milestone

## Agent

Delegates to the `integration-validator` agent, which reads project files and maps registry facts to their implementations.

---

**Keep your numbers honest!** Run `/consistency-check` so the loot table and the combat system always agree.
