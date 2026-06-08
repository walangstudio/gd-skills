# Unreal Engine 5.4+ — Scripting Reference

> Pinned to Unreal Engine 5.4+. Verify anything newer against https://dev.epicgames.com/documentation/en-us/unreal-engine.

## Core types & entry points
- `UFUNCTION(BlueprintCallable)` — call C++ from Blueprint graphs; `BlueprintPure` for side-effect-free getters; `BlueprintImplementableEvent` / `BlueprintNativeEvent` to call into Blueprint.
- `UPROPERTY(EditAnywhere)` (editable in defaults + per-instance), `EditDefaultsOnly`, `VisibleAnywhere`; add `BlueprintReadWrite`/`BlueprintReadOnly` to expose to graphs.
- Dynamic delegates: `DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(...)` for Blueprint-assignable events; bind with `AddDynamic`.
- `TSubclassOf<T>` — a typed class reference for spawning/templating; pick the subclass in the editor.
- `Cast<T>(Obj)` — safe runtime downcast, returns `nullptr` on failure.
- `FTimerHandle` + `GetWorldTimerManager()` — delayed/repeating callbacks.
- `UE_LOG(LogTemp, Warning, TEXT("..."))` for logging.

## Common tasks
Expose a tunable + a callable to Blueprint, and declare a BP-assignable event:
```cpp
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnScored, int32, NewScore);

UCLASS()
class MYGAME_API AScorer : public AActor
{
    GENERATED_BODY()
public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Scoring")
    int32 Score = 0;

    UPROPERTY(BlueprintAssignable, Category = "Scoring")
    FOnScored OnScored;

    UFUNCTION(BlueprintCallable, Category = "Scoring")
    void AddPoints(int32 Amount);
};

void AScorer::AddPoints(int32 Amount)
{
    Score += Amount;
    OnScored.Broadcast(Score);
}
```

Spawn an actor from a `TSubclassOf` chosen in the editor:
```cpp
UPROPERTY(EditAnywhere, Category = "Spawning")
TSubclassOf<AActor> ProjectileClass;

void AScorer::Fire(const FVector& Loc, const FRotator& Rot)
{
    if (ProjectileClass)
    {
        GetWorld()->SpawnActor<AActor>(ProjectileClass, Loc, Rot);
    }
}
```

Repeating timer that fires every 2 seconds:
```cpp
FTimerHandle TimerHandle;
GetWorldTimerManager().SetTimer(
    TimerHandle, this, &AScorer::OnTick, 2.f, /*bLoop=*/true);
```

Blueprint-first: timers, casts, spawning, and delegate binding all have node equivalents (Set Timer by Function Name, Cast To, Spawn Actor from Class, Bind Event). Keep designer-facing flow in Blueprint; put hot loops and shared logic in C++.

## Gotchas
- `AddDynamic` only works with `UFUNCTION`-marked handlers and dynamic (`DYNAMIC`) delegates; non-dynamic delegates use `AddUObject`/`BindLambda`.
- `SpawnActor` returns `nullptr` if collision at the spawn transform fails — set `FActorSpawnParameters::SpawnCollisionHandlingOverride` to control this.
- `Cast<>` to a Blueprint-only class from C++ needs the C++ base, not the BP asset; cast to the native parent.
- A `UFUNCTION` exposed to Blueprint can't use templates, non-reflected types, or most `TArray<TArray<>>` nesting.
- Timers are cleared automatically when the owning object is destroyed, but a stale `FTimerHandle` you re-use without clearing can stack callbacks.

## See also
- `unreal-patterns` skill, `unreal-style` rule, `unreal-specialist` agent
- guides/ for cross-engine architecture patterns
