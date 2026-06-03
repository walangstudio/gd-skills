# Godot 4.3 — Breaking Changes & Version Notes

Pinned baseline: Godot 4.3 (latest stable 4.x). Notable changes around this baseline that affect generated code.

| Version | Change | Migration |
|---------|--------|-----------|
| 4.0 | GDScript 2.0: `yield` removed, replaced by `await`; signals connect with Callables not strings; `export` is now the `@export` annotation. | Use `await sig` and `@export`/`@onready`; connect signals with `.connect(Callable)`. |
| 4.0 | `KinematicBody` replaced by `CharacterBody2D`/`CharacterBody3D`; `move_and_slide()` takes no args (uses the `velocity` property). | Set `velocity` then call `move_and_slide()`. |
| 4.2 | Old `Tween` node removed; use `create_tween()` (SceneTreeTween). | Create tweens via `create_tween()`. |
| 4.3 | Additive only (physics interpolation, perf); no major API removals vs 4.2. | Safe to target 4.2 APIs on 4.3. |

> Verify against the authoritative docs for versions beyond the pinned baseline.
