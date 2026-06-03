# Data-Driven Design

> Keep tunable values and entity definitions in data (config files/assets) separate from code, so designers can change behavior without recompiling and there are no magic numbers buried in logic.

## What it is
Code defines *how* things work; data defines *what* the specific things are. Enemy stats, weapon damage, item definitions, spawn tables, and balance numbers live in editable assets or config, not hardcoded in scripts. The engine loads the data and instantiates from it. This makes content designer-tunable, enables hot-iteration, and turns "add a new enemy" into "add a row," not "write a class."

## When to use it
- Many similar entities differing only by values (enemies, weapons, items, levels).
- Values designers/balancers must tune frequently without engineer involvement.
- Content that should be addable without code changes (new item = new data entry).
- Localization, difficulty tables, drop rates, progression curves.

## When NOT to use it
- One-off values used in exactly one place — a named constant is clearer than an external asset.
- Behavior that genuinely differs in logic, not just numbers. Data-driving control flow into a giant config interpreter is worse than code.
- Early prototyping where the schema is still churning daily; harden it into data once the shape stabilizes.

## Per-engine mapping
| Engine | How this pattern is expressed |
|--------|-------------------------------|
| Godot | Custom `Resource` classes saved as `.tres`/`.res`; export vars are inspector-editable. Load with `preload`/`ResourceLoader`. |
| Unity | **ScriptableObject** assets — the canonical Unity data container, editable in the inspector, referenced by prefabs/systems. |
| Unreal | **DataAssets** (`UPrimaryDataAsset`) and **DataTables** (CSV/JSON-backed row structs); curves via `UCurveTable`. |
| Roblox | ModuleScripts returning Lua tables of config; Attributes for per-instance tunables; optionally external JSON via `HttpService`. |
| Defold | `go.property(...)` for per-instance tunables (script properties, settable in editor/factory) + plain Lua config tables/modules; `.json`/resources for bulk data. |
| Web | Plain JSON (or JS object modules) loaded at boot; schema-validated config. The default and lightest path. |

## Minimal example
Unity — ScriptableObject as the data container (the textbook case):
```csharp
[CreateAssetMenu(menuName = "Game/EnemyDef")]
public class EnemyDef : ScriptableObject {
    public string id;
    public int    maxHp = 30;
    public float  moveSpeed = 2.5f;
    public int    contactDamage = 5;
}
// Enemy.cs reads the def — no numbers hardcoded:
public EnemyDef def;
void Start() => hp = def.maxHp;
```

## Pitfalls
- **Schema drift**: data and the code that reads it disagree (renamed field, changed type). Validate on load; fail loud, not silent.
- **Over-abstraction**: data-driving logic (conditions, formulas) into config turns your config into an untyped, untested programming language. Keep logic in code.
- **No validation**: bad data (negative HP, missing id) crashes deep in gameplay. Validate at load with clear errors.
- **Dual sources of truth**: an example here is the entity registry at `design/registry/entities.example.yaml` — if both a schema and a registry list constraints, keep them in sync or readers see drift.
- Hot-reload gaps: changing data at runtime may not re-apply to already-spawned entities. Decide reload semantics.

## Related
- `godot-patterns`, `unity-patterns`, `unreal-patterns`, `defold-patterns`, `roblox-patterns`, `javascript-patterns`
- `inventory-systems`, `save-load-systems`, `combat-systems`, `dialogue-systems`
- `guides/ecs-vs-component.md`, `guides/object-pooling.md`
