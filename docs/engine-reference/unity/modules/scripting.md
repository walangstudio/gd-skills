# Unity 6 — Scripting Reference

> Pinned to Unity 6 (2023 LTS) / 2023.2+. Verify anything newer against https://docs.unity3d.com/.

## Core types & entry points
- `MonoBehaviour` — base for scene scripts. `[SerializeField]` exposes private fields to the inspector without making them public.
- `GetComponent<T>()` returns null if absent; `TryGetComponent<T>(out var c)` avoids the null check and the GC churn.
- `FindFirstObjectByType<T>()` / `FindObjectsByType<T>(FindObjectsSortMode.None)` — replacements for the deprecated `FindObjectOfType`/`FindObjectsOfType`.
- `Instantiate(prefab, pos, rot)` to spawn, `Destroy(obj)` to remove (deferred to end of frame).
- Events: plain C# `event Action<T>` for code-to-code; `UnityEvent` (serialized) to wire callbacks in the inspector.
- Object pooling: prefer `UnityEngine.Pool.ObjectPool<T>` over `Instantiate`/`Destroy` spam for bullets, particles, enemies.

## Common tasks
Cache components in `Awake`, expose tuning via `[SerializeField]`:
```csharp
using UnityEngine;

public class Health : MonoBehaviour
{
    [SerializeField] int maxHealth = 100;
    public event System.Action<int> OnChanged;
    int current;

    void Awake() => current = maxHealth;

    public void TakeDamage(int amount)
    {
        current = Mathf.Max(0, current - amount);
        OnChanged?.Invoke(current);
        if (current == 0) Destroy(gameObject);
    }
}
```

Safe component access with `TryGetComponent`:
```csharp
void OnTriggerEnter(Collider other)
{
    if (other.TryGetComponent<Health>(out var hp))
        hp.TakeDamage(10);
}
```

`UnityEvent` wired in the inspector:
```csharp
using UnityEngine;
using UnityEngine.Events;

public class Trigger : MonoBehaviour
{
    public UnityEvent onActivated;
    void Activate() => onActivated.Invoke();
}
```

Object pool instead of Instantiate/Destroy:
```csharp
using UnityEngine.Pool;

readonly ObjectPool<Bullet> pool = new(
    createFunc: () => Instantiate(bulletPrefab),
    actionOnGet: b => b.gameObject.SetActive(true),
    actionOnRelease: b => b.gameObject.SetActive(false));
```

## Gotchas
- `GetComponent` is not free — cache the result in `Awake`/`Start` instead of calling it every frame.
- `FindFirstObjectByType`/`FindObjectsByType` are slow scene scans; never call them per-frame. Wire references in the inspector or via a registry.
- Forgetting `?.Invoke` on a null event throws; always null-check C# events.
- A `[SerializeField]` reference set in the inspector overrides any value you assign in `Awake`/field initializer — order matters.
- Pooled objects keep their state; reset them in `actionOnGet`, not just on creation.

## See also
- `unity-patterns` skill, `unity-style` rule, `unity-specialist` agent
- guides/ for cross-engine architecture patterns
