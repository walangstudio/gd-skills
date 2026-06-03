# Godot 4.3 — Scripting Reference

> Pinned to Godot 4.3 (latest stable 4.x). Verify anything newer against https://docs.godotengine.org/en/stable/.

## Core types & entry points
- GDScript 2.0: static typing with `:` annotations, `class_name` for global registration, first-class lambdas, `await`.
- Signals: declare with `signal`, emit with `.emit(args)`, connect with `.connect(Callable)`.
- `await` replaces 3.x `yield` — suspend on a signal or a coroutine call.
- `Callable` and `Signal` are first-class types; bind args with `.bind(...)`.
- `preload()` (compile-time) vs `load()` (runtime) for resources.

## Common tasks
Typed script with a custom class and signal:
```gdscript
class_name Health
extends Node

signal died
signal changed(current: int, max: int)

@export var max_hp: int = 100
var hp: int

func _ready() -> void:
    hp = max_hp

func take_damage(amount: int) -> void:
    hp = max(hp - amount, 0)
    changed.emit(hp, max_hp)
    if hp == 0:
        died.emit()
```

Connect a signal (Callable form, 4.x):
```gdscript
func _ready() -> void:
    $Health.died.connect(_on_died)

func _on_died() -> void:
    queue_free()
```

`await` a signal or a timer:
```gdscript
func flash() -> void:
    modulate = Color.RED
    await get_tree().create_timer(0.2).timeout
    modulate = Color.WHITE
```

Lambda + bind:
```gdscript
button.pressed.connect(func(): print("clicked"))
area.body_entered.connect(_on_hit.bind("spike"))
```

## Gotchas
- 4.x uses `.connect(Callable)` — string-name signal connections from 3.x are gone.
- `yield` does not exist; use `await`. `await sig` resumes when `sig` emits.
- Static typing is optional but enables compile-time checks and speedups; mixing untyped vars loses that.
- `func _on_x(): ...` connected via the editor must match the signal's argument count.
- `==` on two `Object`s compares references; use value comparisons for data.

## See also
- `godot-patterns` skill, `godot-style` rule, `godot-specialist` agent
- guides/ for cross-engine architecture patterns
