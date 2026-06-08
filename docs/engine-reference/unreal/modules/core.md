# Unreal Engine 5.4+ — Core Reference

> Pinned to Unreal Engine 5.4+. Verify anything newer against https://dev.epicgames.com/documentation/en-us/unreal-engine.

## Core types & entry points
- `UObject` — base of the reflected type system; GC-managed, supports `UPROPERTY`/`UFUNCTION` reflection and Blueprint exposure.
- `AActor` — anything placeable in a level. Composes `UActorComponent`s (logic) and `USceneComponent`s (have a transform).
- `APawn` — an `AActor` a controller can possess; `ACharacter` adds a `UCharacterMovementComponent` + capsule + skeletal mesh.
- `AController` / `APlayerController` / `AAIController` — possess pawns; the player controller owns input and HUD.
- `AGameModeBase` (server-only rules/spawning) vs `AGameStateBase` (replicated match state); `APlayerState` per-player replicated state.
- `UWorld` — the running level container; reach it from any actor/component via `GetWorld()`.
- Reflection macros: `UCLASS()`, `USTRUCT()`, `UENUM()`, `UPROPERTY()`, `UFUNCTION()`. Each `UCLASS` needs `GENERATED_BODY()` and a matching `.generated.h` include last.

## Common tasks
Minimal actor with lifecycle and a tick. `BeginPlay` runs once when the actor enters play; `Tick` runs per frame (opt in via `PrimaryActorTick.bCanEverTick`); `EndPlay` runs on destroy/level-end:
```cpp
UCLASS()
class MYGAME_API AMyActor : public AActor
{
    GENERATED_BODY()
public:
    AMyActor() { PrimaryActorTick.bCanEverTick = true; }

protected:
    virtual void BeginPlay() override;
    virtual void EndPlay(const EEndPlayReason::Type Reason) override;

public:
    virtual void Tick(float DeltaSeconds) override;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Config")
    float Speed = 600.f;
};
```

GC-safe object references: hold `UObject`s in a `UPROPERTY` (or `TObjectPtr<>`, 5.0+) so the garbage collector keeps them alive and nulls them on destroy. A raw pointer not marked `UPROPERTY` can dangle.
```cpp
UPROPERTY()
TObjectPtr<UStaticMeshComponent> Mesh;
```

Blueprint vs C++: define base systems and performance-critical code in C++, expose tunables with `UPROPERTY(EditAnywhere)` and behavior with `UFUNCTION(BlueprintCallable)`, then subclass as a Blueprint for designer iteration. Blueprint-first is fine for prototypes and UI; move hot paths to C++.

## Gotchas
- The `#include "MyActor.generated.h"` must be the LAST include in the header, or Unreal Header Tool fails.
- Don't run gameplay logic in the constructor — it runs at CDO/load time before the world exists. Use `BeginPlay` (or `OnConstruction` for editor-time setup).
- A `UObject*` that isn't a `UPROPERTY` is invisible to GC and can be collected out from under you. Use `UPROPERTY()` or `TStrongObjectPtr`.
- `Tick` is off by default; enabling it on many actors is a common perf sink — prefer timers or events.
- Renaming a `UPROPERTY` breaks saved/serialized references; use `UPROPERTY(meta=(DeprecatedProperty))` + `core redirects` to migrate.
- `GameMode` exists only on the server/authority; never assume it on clients.

## See also
- `unreal-patterns` skill, `unreal-style` rule, `unreal-specialist` agent
- guides/ for cross-engine architecture patterns
