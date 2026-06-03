# ECS vs Component vs Inheritance

> Three ways to assemble game entities: deep OOP inheritance, composition of components, or data-oriented Entity-Component-System.

## What it is
**Inheritance**: behavior lives in a class hierarchy (`Enemy : Character : Actor`). Simple until the hierarchy fights you. **Component-based**: an entity is a bag of components, each owning one concern; favor composition over inheritance. **ECS**: entities are bare IDs, components are pure data, systems are functions that run over all matching components. ECS trades ergonomics for cache locality and scale (thousands of entities). Most games never need ECS; composition handles the vast majority.

## When to use it
- **Composition**: default for almost everything. Mix-and-match behaviors without combinatorial subclasses.
- **ECS**: simulating thousands to millions of similar entities (bullet hells, RTS units, particles, boids) where per-frame iteration cost and cache misses dominate.
- **Inheritance**: a genuinely small, stable "is-a" hierarchy with shared base logic and no diamond pressure.

## When NOT to use it
- Don't reach for ECS in a small or mid-size game. The boilerplate, tooling friction, and debugging cost rarely pay off below thousands of hot entities.
- Don't build deep inheritance trees — past 2-3 levels you'll hit "I need this method but not that one." Switch to composition.
- Don't bolt a third-party ECS onto an engine whose native model is composition unless profiling proves you need it.

## Per-engine mapping
| Engine | What it actually is |
|--------|---------------------|
| Godot | Node tree = composition. Nodes are children/components; scenes compose scenes. Can subclass nodes, but composition is idiomatic. No built-in ECS (3rd-party addons exist). |
| Unity | GameObject + MonoBehaviour components (composition). Optional **DOTS/Entities** is a real ECS for the high-scale path; separate from the GameObject world. |
| Unreal | Actor + UActorComponent (composition). Actors can subclass (C++/Blueprint inheritance is common). Mass Entity is Unreal's ECS for crowds. |
| Defold | Strict component model: game object = collection of components, communicating by message. **No inheritance at all.** Not ECS (components hold behavior + state), but pure composition. |
| Roblox | Instances + ModuleScript-driven behavior. No formal ECS or class inheritance; composition via attached scripts/attributes. Community ECS libs (e.g. Matter) exist. |
| Web | Varies. Phaser uses GameObjects (composition). Three.js is a scene graph (composition). Plain ECS libs (bitECS, miniplex) are popular for data-oriented JS games. |

## Minimal example
Godot — composition by node assembly (the natural fit for most engines here):
```gdscript
# Enemy.tscn assembled from components, not a deep subclass:
#   Enemy (CharacterBody2D)
#   ├── HealthComponent      (script: hp, take_damage signal)
#   ├── HitboxComponent      (Area2D)
#   └── AIComponent          (state machine)
# Behavior = which components you attach, not what you inherit.
func _ready() -> void:
    $HealthComponent.died.connect(_on_died)
```

## Pitfalls
- Cargo-culting ECS for the buzzword: you inherit its constraints (no easy per-entity polymorphism, harder debugging) without needing its benefits.
- Component soup: 30 tiny components with tangled cross-references is as bad as deep inheritance. Group by cohesive concern.
- In Unity, mixing GameObject-land and DOTS-land has real interop cost — don't straddle both without a plan.
- Claiming an engine "has ECS" when it ships composition. Only Unity (DOTS) and Unreal (Mass) ship first-party ECS here; the rest rely on community libs.

## Related
- `godot-patterns`, `unity-patterns`, `unreal-patterns`, `defold-patterns`, `roblox-patterns`, `javascript-patterns`
- `enemy-ai-patterns`, `inventory-systems`
- `guides/data-driven.md`, `guides/object-pooling.md`, `guides/message-passing.md`
