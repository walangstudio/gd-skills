---
description: Validate cross-component integration. Checks event wiring, missing references, data flow, and client-server boundaries. Produces a PASS/WARN/FAIL checklist.
---

# Validate Integration Command

## What This Command Does

Audits your assembled game components to verify they are correctly wired together before you declare the game done:

- Event connections (signals, RemoteEvents, UnityEvents, EventBus)
- Missing references (NullRef risks, unconnected listeners)
- Save/load coverage (all runtime state persisted)
- Client-server boundaries (Roblox) or scene/prefab links (Unity/Godot)

## Usage

```
/validate-integration
```

Invoke after you have assembled multiple components (player + enemy + combat + UI + save).

## Output

```
## Integration Validation Report

### Integration Checks
| Integration Point                          | Status | Detail                        |
|--------------------------------------------|--------|-------------------------------|
| PlayerController → UIManager (health)      | PASS   | signal connected              |
| CombatSystem → EnemyAI (on hit)            | PASS   | OnHit subscribed              |
| SaveSystem → InventorySystem               | FAIL   | no save call found            |
| [Roblox] DamageEvent client→server         | PASS   | OnServerEvent found           |

### Summary
- PASS: 3 | WARN: 0 | FAIL: 1

### Required Fixes
1. [FAIL] Add inventory save/load in SaveSystem
```

## When to Use

- After `/create-platformer`, `/create-rpg`, `/create-survival`, etc.
- After manually assembling components with `/create-player`, `/create-enemy`, `/create-health`
- Before publishing or shipping — final integration gate

## Agent

Invokes the `integration-validator` agent which reads your project files and maps all integration points.

---

**Run integration checks!** Use `/validate-integration` to find broken wiring before it breaks at runtime.
