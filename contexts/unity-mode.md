---
description: Activates Unity development mode. Sets context for C#, MonoBehaviour, prefabs, and Unity 6 / 2023.2+ best practices.
---

# Unity Development Mode

You are now working in **Unity 6 / 2023.2+** mode.

## Language & Framework
- **Language**: C# 11+ with nullable reference types
- **Engine**: Unity 6 (formerly 2023 LTS) / 2023.2+
- **Scene system**: GameObjects with Components, Prefabs
- **Input**: New Input System (InputAction assets)

## Conventions
- `[SerializeField]` for private inspector fields (not public fields)
- Null-conditional operators for safety (`component?.Method()`)
- `async/await` with `UniTask` or coroutines for async operations
- Assembly definitions (`.asmdef`) for compilation speed
- Scriptable Objects for data configuration
- Events/delegates for decoupled communication

## File Structure
```
Assets/
├── _Project/
│   ├── Scripts/     (.cs files)
│   ├── Scenes/      (.unity files)
│   ├── Prefabs/     (.prefab files)
│   ├── Art/         (sprites, materials)
│   ├── Audio/       (music, sfx, mixers)
│   └── Input/       (.inputactions)
└── Plugins/
```

## Key Patterns
- `Awake()` → early init (before Start)
- `Start()` → initialization
- `Update()` → per-frame logic
- `FixedUpdate()` → physics (50 Hz default)
- `Rigidbody2D/Rigidbody` for physics
- `Collider` + `OnTriggerEnter` for detection
- `NavMeshAgent` for pathfinding

## Use These Skills
- `unity-patterns` for engine-specific patterns
- `unity-style` rule for coding standards
- `unity-specialist` agent for complex issues
