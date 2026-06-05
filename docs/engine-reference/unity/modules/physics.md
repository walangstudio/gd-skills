# Unity 6 — Physics Reference

> Pinned to Unity 6 (2023 LTS) / 2023.2+. Verify anything newer against https://docs.unity3d.com/.

## Core types & entry points
- 3D: `Rigidbody` + a `Collider` (`BoxCollider`, `SphereCollider`, `CapsuleCollider`, `MeshCollider`). 2D: `Rigidbody2D` + a `Collider2D` (`BoxCollider2D`, `CircleCollider2D`, etc.).
- Move rigidbodies in `FixedUpdate` via `Rigidbody.MovePosition`/`AddForce` (or `linearVelocity`), never by setting `transform.position`.
- Collision callbacks: `OnCollisionEnter/Stay/Exit` (solid contact) and `OnTriggerEnter/Stay/Exit` (collider with `isTrigger = true`). 2D variants append `2D` and pass `Collision2D`/`Collider2D`.
- A trigger callback needs at least one Rigidbody (or Rigidbody2D) on one of the two objects.
- `Physics.Raycast(origin, dir, out hit, maxDistance, layerMask)` / `Physics2D.Raycast(origin, dir, distance, layerMask)`.
- Layers + the collision matrix (Project Settings → Physics / Physics 2D) decide which layers interact.
- `CharacterController` — non-Rigidbody capsule for player movement; `Move`/`SimpleMove` with built-in slope/step handling.

## Common tasks
2D platformer move + jump (Input System; physics in `FixedUpdate`):
```csharp
using UnityEngine;
using UnityEngine.InputSystem;

[RequireComponent(typeof(Rigidbody2D))]
public class Platformer : MonoBehaviour
{
    [SerializeField] float speed = 7f, jumpForce = 12f;
    [SerializeField] LayerMask groundMask;
    Rigidbody2D rb;
    float moveX;

    void Awake() => rb = GetComponent<Rigidbody2D>();

    void Update()
    {
        var kb = Keyboard.current;
        moveX = (kb.dKey.isPressed ? 1f : 0f) - (kb.aKey.isPressed ? 1f : 0f);
        if (kb.spaceKey.wasPressedThisFrame && IsGrounded())
            rb.linearVelocity = new Vector2(rb.linearVelocity.x, jumpForce);
    }

    void FixedUpdate() =>
        rb.linearVelocity = new Vector2(moveX * speed, rb.linearVelocity.y);

    bool IsGrounded() =>
        Physics2D.Raycast(transform.position, Vector2.down, 0.6f, groundMask).collider != null;
}
```

Raycast to whatever is under the mouse (3D):
```csharp
Ray ray = Camera.main.ScreenPointToRay(Mouse.current.position.ReadValue());
if (Physics.Raycast(ray, out RaycastHit hit, 100f, hittableMask))
    Debug.Log($"Hit {hit.collider.name} at {hit.point}");
```

Trigger pickup:
```csharp
void OnTriggerEnter2D(Collider2D other)
{
    if (other.CompareTag("Player"))
        Destroy(gameObject);
}
```

## Gotchas
- Set velocity/forces in `FixedUpdate`; reading input there misses key presses — read input in `Update`, apply in `FixedUpdate`.
- `Rigidbody.velocity` was renamed to `linearVelocity` in Unity 6 (2023.x); `velocity` still works but is deprecated.
- A pair only collides if BOTH the collision matrix and the layer assignments allow it.
- Triggers fire only when one object has a Rigidbody/Rigidbody2D; two static colliders never report a trigger.
- `CompareTag` allocates nothing; `other.tag == "X"` allocates a string each call.
- `CharacterController` ignores Rigidbody physics — it doesn't push or get pushed by rigidbodies without extra code.
- Mesh colliders must be `convex` to act as a moving/trigger collider.

## See also
- `unity-patterns` skill, `unity-style` rule, `unity-specialist` agent
- guides/ for cross-engine architecture patterns
