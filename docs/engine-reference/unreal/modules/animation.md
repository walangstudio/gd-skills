# Unreal Engine 5.4+ — Animation Reference

> Pinned to Unreal Engine 5.4+. Verify anything newer against https://dev.epicgames.com/documentation/en-us/unreal-engine.

## Core types & entry points
- `USkeletalMeshComponent` plays animation; its `AnimClass` points at a `UAnimInstance` subclass authored as an Animation Blueprint (AnimBP).
- AnimBP graphs: the AnimGraph (pose evaluation — state machines, blends) and the Event Graph (read game state into AnimBP variables each frame).
- State machines drive locomotion (Idle/Walk/Run/Jump) via transition rules on AnimBP variables.
- Blend Spaces (`UBlendSpace`) blend animations across 1-2 input axes (e.g. speed/direction).
- `UAnimMontage` — one-off/slot-based clips (attacks, reloads) played on top of the state machine; `ACharacter::PlayAnimMontage(Montage)` is the convenient entry.
- Control Rig — node-based runtime rigging for procedural/IK adjustments, evaluated in the AnimGraph.
- Root motion — animation drives capsule movement; enable on the montage/sequence and set the AnimBP root-motion mode.

## Common tasks
Play a montage from a character ability:
```cpp
UPROPERTY(EditAnywhere, Category = "Anim")
TObjectPtr<UAnimMontage> AttackMontage;

void AMyCharacter::Attack()
{
    if (AttackMontage)
    {
        PlayAnimMontage(AttackMontage); // returns duration; 0 if it failed
    }
}
```
Blueprint equivalent: `Play Anim Montage` (Character) or `Play Montage` (Anim Instance) node.

Drive AnimBP variables from C++ each frame (the AnimBP reads these in its Event Graph). Override `NativeUpdateAnimation` in your `UAnimInstance` subclass:
```cpp
void UMyAnimInstance::NativeUpdateAnimation(float DeltaSeconds)
{
    Super::NativeUpdateAnimation(DeltaSeconds);
    if (APawn* Owner = TryGetPawnOwner())
    {
        Speed = Owner->GetVelocity().Size2D();
        bIsFalling = Owner->GetMovementComponent()->IsFalling();
    }
}
```
`Speed`/`bIsFalling` are `UPROPERTY(BlueprintReadOnly)` members the state machine transitions and blend space read.

Anim is heavily Blueprint-first: state machines, blend spaces, transition rules, and montage notifies are authored in the AnimBP/asset editors. C++ typically just feeds variables and triggers montages.

## Gotchas
- `PlayAnimMontage`/`Play Montage` need a Slot node wired in the AnimGraph (e.g. `DefaultSlot`) or the montage plays nothing.
- Root motion only moves the capsule if BOTH the asset has root motion enabled AND the AnimBP's root-motion mode is set (e.g. `Root Motion from Montages Only`); otherwise it animates in place.
- AnimBP variable updates belong in `NativeUpdateAnimation` (thread-aware) — don't mutate game state from the AnimGraph.
- `USkeletalMeshComponent::PlayAnimation` switches to single-asset mode and bypasses the AnimBP entirely; don't mix it with an AnimClass-driven mesh.
- Transition rules read last frame's values; a one-frame lag between game state and pose is normal.

## See also
- `unreal-patterns` skill, `unreal-style` rule, `unreal-specialist` agent
- guides/ for cross-engine architecture patterns
