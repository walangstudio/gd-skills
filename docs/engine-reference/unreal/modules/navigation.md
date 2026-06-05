# Unreal Engine 5.4+ — Navigation Reference

> Pinned to Unreal Engine 5.4+. Verify anything newer against https://dev.epicgames.com/documentation/en-us/unreal-engine.

## Core types & entry points
- `ANavMeshBoundsVolume` — defines where the navmesh is generated; placing one spawns a `ARecastNavMesh` actor (the actual nav data). Press `P` in editor to visualize.
- `UNavigationSystemV1` — the world's nav subsystem; query via `UNavigationSystemV1::GetNavigationSystem(World)` for projection/pathfinding helpers.
- `AAIController` — possesses an AI pawn and owns a `UPathFollowingComponent` that walks paths.
- Movement entry points: `AAIController::MoveToLocation` / `MoveToActor` (full control + result), and `UAIBlueprintHelperLibrary::SimpleMoveToLocation` (fire-and-forget).
- Behavior Trees + Blackboard — the standard way to author AI decision-making; `UBehaviorTree` runs via `AAIController::RunBehaviorTree`, reading/writing a `UBlackboardComponent`.

## Common tasks
Move an AI-controlled pawn to a world location (from the pawn's `AAIController`):
```cpp
void AMyAIController::GoTo(const FVector& Dest)
{
    EPathFollowingRequestResult::Type Result =
        MoveToLocation(Dest, /*AcceptanceRadius=*/50.f);

    if (Result == EPathFollowingRequestResult::Failed)
    {
        UE_LOG(LogTemp, Warning, TEXT("No path to destination"));
    }
}
```
Bind `OnMoveCompleted` on the controller to react when the move finishes/aborts. Blueprint equivalent: `AI MoveTo` (a latent node that has Success/Fail exec pins built in).

Project an arbitrary point onto the navmesh before moving (avoids "no path" on off-mesh points):
```cpp
FNavLocation Out;
if (UNavigationSystemV1* Nav = UNavigationSystemV1::GetNavigationSystem(GetWorld()))
{
    if (Nav->ProjectPointToNavigation(RawPoint, Out, FVector(100, 100, 200)))
    {
        GoTo(Out.Location);
    }
}
```

Start a Behavior Tree (usually in the controller's `OnPossess`):
```cpp
RunBehaviorTree(BehaviorTreeAsset); // initializes the linked Blackboard
```
Behavior Trees, blackboard keys, and tasks/services are Blueprint-first (authored in the BT/Blackboard editors); C++ custom tasks subclass `UBTTaskNode`.

## Gotchas
- No `ANavMeshBoundsVolume` = no navmesh = every `MoveTo` fails silently. Confirm with the `P` overlay.
- Geometry must be `Static`/`Stationary` and have collision to affect navmesh generation; movable obstacles need a `UNavModifierComponent` or dynamic navmesh (runtime generation in Project Settings → Navigation Mesh).
- `MoveTo*` only works on a pawn possessed by an `AAIController`; the player pawn won't path-follow.
- A destination off the navmesh fails — `ProjectPointToNavigation` first, or widen the acceptance radius.
- Dynamic/runtime navmesh rebuild has a CPU cost; default is static generation. Enable runtime only if obstacles actually move.
- `SimpleMoveToLocation` gives no completion callback — use `AAIController::MoveTo*` + `OnMoveCompleted` when you need the result.

## See also
- `unreal-patterns` skill, `unreal-style` rule, `unreal-specialist` agent
- guides/ for cross-engine architecture patterns
