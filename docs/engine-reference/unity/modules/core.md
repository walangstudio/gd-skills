# Unity 6 — Core Reference

> Pinned to Unity 6 (2023 LTS) / 2023.2+. Verify anything newer against https://docs.unity3d.com/.

## Core types & entry points
- `GameObject` — container; behaviour comes from attached `Component`s. `AddComponent<T>()`, `GetComponent<T>()`.
- `MonoBehaviour` — script base class. Lifecycle order: `Awake` → `OnEnable` → `Start` → (loop) `FixedUpdate` → `Update` → `LateUpdate` → `OnDisable` → `OnDestroy`.
- `Awake`/`OnEnable` fire even when the script is disabled-then-enabled; `Start` runs once before the first `Update`, only if the component is enabled.
- `Transform` — every GameObject has one. `position`/`localPosition`, `rotation`, `localScale`, `parent`, `SetParent`.
- `ScriptableObject` — data asset that lives outside a scene; create via `[CreateAssetMenu]`.
- Prefabs — saved GameObject templates; spawn with `Instantiate`. Edit the asset to update all instances.
- Coroutines — `IEnumerator` + `StartCoroutine`; `Time.deltaTime` is the frame delta, `Time.fixedDeltaTime` the physics step.

## Common tasks
Lifecycle + frame-rate-independent movement:
```csharp
using UnityEngine;

public class Spinner : MonoBehaviour
{
    [SerializeField] float degreesPerSecond = 90f;

    void Update()
    {
        transform.Rotate(0f, degreesPerSecond * Time.deltaTime, 0f);
    }
}
```

Spawn a prefab instance:
```csharp
[SerializeField] GameObject bulletPrefab;
[SerializeField] Transform muzzle;

void Fire()
{
    GameObject bullet = Instantiate(bulletPrefab, muzzle.position, muzzle.rotation);
    Destroy(bullet, 3f); // auto-destroy after 3s
}
```

Coroutine for a timed sequence:
```csharp
IEnumerator FlashThenHide()
{
    GetComponent<Renderer>().enabled = true;
    yield return new WaitForSeconds(0.5f);
    GetComponent<Renderer>().enabled = false;
}
// start it: StartCoroutine(FlashThenHide());
```

ScriptableObject data asset:
```csharp
[CreateAssetMenu(menuName = "Game/EnemyStats")]
public class EnemyStats : ScriptableObject
{
    public int maxHealth = 100;
    public float moveSpeed = 3f;
}
```

## Gotchas
- `Awake` may run before another object's `Awake`; never assume cross-object init order. Use `Start` for setup that depends on other objects.
- Do physics in `FixedUpdate`, input/rendering in `Update`. Reading input in `FixedUpdate` drops events because it can run zero or many times per frame.
- `Destroy` is deferred to end of frame; the object still exists for the rest of this frame. Use `DestroyImmediate` only in editor code.
- A coroutine stops if its host GameObject is disabled or destroyed.
- `Time.deltaTime` inside `FixedUpdate` equals `Time.fixedDeltaTime` — Unity swaps it automatically.
- ScriptableObject field changes made at runtime persist in the editor (they mutate the asset); reset them deliberately.

## See also
- `unity-patterns` skill, `unity-style` rule, `unity-specialist` agent
- guides/ for cross-engine architecture patterns
