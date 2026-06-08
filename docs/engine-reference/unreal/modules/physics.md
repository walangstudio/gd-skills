# Unreal Engine 5.4+ — Physics Reference

> Pinned to Unreal Engine 5.4+. Verify anything newer against https://dev.epicgames.com/documentation/en-us/unreal-engine.

## Core types & entry points
- Chaos is the physics backend (PhysX is gone in UE5). `UPrimitiveComponent` is the base for anything with collision (`UStaticMeshComponent`, `USkeletalMeshComponent`, `UCapsuleComponent`, `UBoxComponent`, `USphereComponent`).
- `ECollisionChannel` (e.g. `ECC_Visibility`, `ECC_Camera`, `ECC_Pawn`, `ECC_WorldStatic`/`Dynamic`) drives trace/object queries; collision presets (Project Settings → Collision) bundle channel responses (Block/Overlap/Ignore).
- Traces: `LineTraceSingleByChannel`, `LineTraceMultiByChannel`, `SweepSingleByChannel`; results land in `FHitResult`.
- Collision events: `OnComponentHit` (blocking, needs `bNotifyRigidBodyCollision` — editor label "Simulation Generates Hit Events", set via `SetNotifyRigidBodyCollision`), `OnComponentBeginOverlap`/`EndOverlap` (needs `bGenerateOverlapEvents`/`SetGenerateOverlapEvents` + at least one side set to Overlap).
- `UCharacterMovementComponent` — drives `ACharacter` walking/falling/flying; don't use raw rigid-body sim for player locomotion.
- `SetSimulatePhysics(true)` on a primitive enables Chaos rigid-body simulation (requires `Movable` mobility + collision enabled).

## Common tasks
Line trace from the camera forward, ignoring self:
```cpp
void AMyActor::TraceAhead()
{
    const FVector Start = GetActorLocation();
    const FVector End = Start + GetActorForwardVector() * 1000.f;

    FHitResult Hit;
    FCollisionQueryParams Params;
    Params.AddIgnoredActor(this);

    bool bHit = GetWorld()->LineTraceSingleByChannel(
        Hit, Start, End, ECC_Visibility, Params);

    if (bHit)
    {
        UE_LOG(LogTemp, Log, TEXT("Hit %s"), *GetNameSafe(Hit.GetActor()));
    }
}
```
Blueprint equivalent: the `Line Trace By Channel` node returns a bool + break the `Out Hit` struct.

Move a character with the movement component (call from your possessed `ACharacter`):
```cpp
void AMyCharacter::MoveForward(float Value)
{
    AddMovementInput(GetActorForwardVector(), Value);
}
```
`Jump()`/`StopJumping()` are built into `ACharacter`; gravity, ground detection, and step-up are handled by `UCharacterMovementComponent`.

Enable rigid-body simulation on a mesh and bind a hit:
```cpp
Mesh->SetSimulatePhysics(true);
Mesh->SetNotifyRigidBodyCollision(true);
Mesh->OnComponentHit.AddDynamic(this, &AMyActor::OnHit);
```

## Gotchas
- Overlap events fire only if `GenerateOverlapEvents` is true on BOTH components AND at least one responds `Overlap` to the other's object type — a Block/Block pair never overlaps, it hits.
- `OnComponentHit` needs `Simulation Generates Hit Events` (`SetNotifyRigidBodyCollision`); it does NOT fire for swept character movement.
- `SetSimulatePhysics` requires `Movable` mobility; calling it on a `Static`/`Stationary` component is a no-op.
- Don't drive an `ACharacter` with `SetSimulatePhysics` — it fights `CharacterMovementComponent`. Use one or the other.
- `LineTraceSingleByChannel` uses trace channels; `...ByObjectType` uses object channels — mixing them silently returns no hits.
- Run physics-dependent logic against the fixed substep, not `Tick`, for determinism-sensitive work.

## See also
- `unreal-patterns` skill, `unreal-style` rule, `unreal-specialist` agent
- guides/ for cross-engine architecture patterns
