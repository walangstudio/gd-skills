# Unity 6 — Navigation Reference

> Pinned to Unity 6 (2023 LTS) / 2023.2+. Verify anything newer against https://docs.unity3d.com/.

## Core types & entry points
- `NavMeshAgent` (namespace `UnityEngine.AI`) — pathfinding mover. `SetDestination`, `destination`, `speed`, `stoppingDistance`, `isStopped`, `remainingDistance`, `velocity`.
- `NavMesh` — the baked walkable surface. Query with `NavMesh.SamplePosition` and `NavMesh.CalculatePath`.
- `NavMeshSurface` (AI Navigation package `com.unity.ai.navigation`) — the current workflow: a component you add to a GameObject and bake, instead of the legacy Window → Navigation static-flags bake. Supports runtime `BuildNavMesh()`.
- `NavMeshObstacle` — dynamic blocker that carves the mesh or just avoids agents.
- `NavMeshLink` (package) / off-mesh links — connect disconnected areas (jumps, ladders).
- Areas + area costs control which surfaces an agent prefers/avoids via its `areaMask`.

## Common tasks
Chase a target with a NavMeshAgent:
```csharp
using UnityEngine;
using UnityEngine.AI;

[RequireComponent(typeof(NavMeshAgent))]
public class Chaser : MonoBehaviour
{
    [SerializeField] Transform target;
    NavMeshAgent agent;

    void Awake() => agent = GetComponent<NavMeshAgent>();

    void Update()
    {
        if (target != null)
            agent.SetDestination(target.position);
    }
}
```

Pick a valid point on the navmesh near a random spot:
```csharp
bool RandomPointNear(Vector3 center, float radius, out Vector3 result)
{
    Vector3 candidate = center + Random.insideUnitSphere * radius;
    if (NavMesh.SamplePosition(candidate, out NavMeshHit hit, radius, NavMesh.AllAreas))
    {
        result = hit.position;
        return true;
    }
    result = center;
    return false;
}
```

Bake a surface at runtime:
```csharp
using Unity.AI.Navigation; // NavMeshSurface lives here

[SerializeField] NavMeshSurface surface;
void RebuildNav() => surface.BuildNavMesh();
```

## Gotchas
- The modern bake is `NavMeshSurface` from the AI Navigation package, not the legacy "Navigation Static" window — install `com.unity.ai.navigation` via Package Manager.
- `NavMeshSurface` is in namespace `Unity.AI.Navigation`, but `NavMeshAgent`/`NavMesh` are in `UnityEngine.AI` — two different usings.
- `SetDestination` returns false / does nothing if the agent isn't on a baked navmesh; check `agent.isOnNavMesh`.
- `agent.remainingDistance` is `Infinity` until the path finishes computing (`pathPending`) — guard with `!agent.pathPending`.
- An agent and the surface must share a compatible Agent Type/radius; mismatched radii leave the agent unable to find paths.
- Moving an agent with `transform.position` fights the agent; use `agent.Warp(pos)` to teleport, `SetDestination` to move.

## See also
- `unity-patterns` skill, `unity-style` rule, `unity-specialist` agent
- guides/ for cross-engine architecture patterns
