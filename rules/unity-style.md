---
name: unity-style
description: Unity C# coding standards and conventions. Enforces Microsoft C# style, Unity-specific patterns, and modern Unity 6 / 2023 LTS practices.
globs: ["*.cs"]
---

# Unity C# Style Guide

Mandatory coding standards for Unity 6 / 2023 LTS projects.

## Naming Conventions

### Classes and Structs
```csharp
// ✅ CORRECT - PascalCase
public class PlayerController { }
public class EnemySpawner { }
public struct DamageInfo { }

// ❌ WRONG
public class player_controller { }
public class enemyspawner { }
```

### Interfaces
```csharp
// ✅ CORRECT - I prefix + PascalCase
public interface IDamageable { }
public interface IInteractable { }
public interface ISaveable { }

// ❌ WRONG
public interface Damageable { }
public interface damageable { }
```

### Methods
```csharp
// ✅ CORRECT - PascalCase, verb phrases
public void TakeDamage(int amount) { }
public bool IsAlive() { }
public void SpawnEnemy() { }
private void CalculateVelocity() { }

// ❌ WRONG
public void takeDamage(int amount) { }
public void damage() { }
```

### Variables and Fields
```csharp
// ✅ CORRECT
public class Player : MonoBehaviour
{
    // Public fields - camelCase (but prefer properties)
    public int health;

    // Serialized private fields - camelCase with no prefix
    [SerializeField] private int maxHealth;
    [SerializeField] private float moveSpeed;

    // Private fields - camelCase (underscore prefix optional but be consistent)
    private int currentHealth;
    private Rigidbody rb;

    // Constants - PascalCase or UPPER_SNAKE_CASE
    private const int MaxInventorySize = 20;
    private const float GRAVITY = -9.81f;

    // Static readonly - PascalCase
    private static readonly Vector3 SpawnOffset = new(0, 1, 0);

    // Properties - PascalCase
    public int Health => currentHealth;
    public bool IsAlive => currentHealth > 0;
}

// ❌ WRONG
[SerializeField] private int m_maxHealth;  // Hungarian notation
[SerializeField] private int _MaxHealth;   // Wrong casing
private int Health;                         // Fields shouldn't be PascalCase
```

### Parameters and Local Variables
```csharp
// ✅ CORRECT - camelCase
public void Initialize(int startHealth, float spawnDelay)
{
    var player = GetComponent<Player>();
    int enemyCount = enemies.Count;
    bool isReady = true;
}

// ❌ WRONG
public void Initialize(int StartHealth, float spawn_delay)
{
    var Player = GetComponent<Player>();
}
```

### Enums
```csharp
// ✅ CORRECT - PascalCase for type and values
public enum GameState
{
    MainMenu,
    Playing,
    Paused,
    GameOver
}

public enum DamageType
{
    Physical,
    Fire,
    Ice,
    Lightning
}

// ❌ WRONG
public enum gameState { MAIN_MENU, playing }
```

## Code Organization

### Script Order
```csharp
public class Player : MonoBehaviour, IDamageable
{
    // 1. Constants
    private const float MaxSpeed = 10f;

    // 2. Static fields
    private static int playerCount;

    // 3. Serialized fields (grouped by category)
    [Header("Movement")]
    [SerializeField] private float moveSpeed = 5f;
    [SerializeField] private float jumpForce = 10f;

    [Header("Combat")]
    [SerializeField] private int maxHealth = 100;
    [SerializeField] private float attackRange = 2f;

    [Header("References")]
    [SerializeField] private Transform firePoint;
    [SerializeField] private GameObject bulletPrefab;

    // 4. Public fields/properties
    public int Health => currentHealth;
    public bool IsAlive => currentHealth > 0;

    // 5. Private fields
    private int currentHealth;
    private Rigidbody rb;
    private bool isGrounded;

    // 6. Events
    public event Action<int> OnHealthChanged;
    public event Action OnDeath;

    // 7. Unity Lifecycle (in execution order)
    private void Awake() { }
    private void OnEnable() { }
    private void Start() { }
    private void Update() { }
    private void FixedUpdate() { }
    private void LateUpdate() { }
    private void OnDisable() { }
    private void OnDestroy() { }

    // 8. Public methods
    public void TakeDamage(int amount) { }
    public void Heal(int amount) { }

    // 9. Private methods
    private void Move() { }
    private void Jump() { }

    // 10. Coroutines
    private IEnumerator RespawnCoroutine() { }

    // 11. Event handlers
    private void OnTriggerEnter(Collider other) { }

    // 12. Interface implementations
    void IDamageable.TakeDamage(int damage) { }
}
```

## SerializeField Best Practices

```csharp
// ✅ CORRECT - Use SerializeField for inspector access
[SerializeField] private int maxHealth = 100;
[SerializeField] private GameObject prefab;

// ✅ CORRECT - Use Header for organization
[Header("Movement Settings")]
[SerializeField] private float speed = 5f;

[Header("Combat Settings")]
[SerializeField] private int damage = 10;

// ✅ CORRECT - Use attributes for validation
[SerializeField, Range(0, 100)] private int health = 100;
[SerializeField, Min(0)] private float cooldown = 1f;
[SerializeField, Tooltip("Damage dealt per hit")] private int damage = 10;

// ❌ WRONG - Public fields for inspector (use SerializeField instead)
public int maxHealth = 100;  // Exposes implementation detail
```

## Properties

```csharp
// ✅ CORRECT - Expression-bodied for simple getters
public int Health => currentHealth;
public bool IsAlive => currentHealth > 0;
public Vector3 Position => transform.position;

// ✅ CORRECT - Full property for validation
public int MaxHealth
{
    get => maxHealth;
    set => maxHealth = Mathf.Max(1, value);
}

// ✅ CORRECT - Auto-property with private setter
public bool IsInitialized { get; private set; }

// ❌ WRONG - Unnecessary full property
public int Health
{
    get { return currentHealth; }
}
```

## Null Checks and Safety

```csharp
// ✅ CORRECT - TryGetComponent (Unity 2019.2+)
if (TryGetComponent<Rigidbody>(out var rb))
{
    rb.AddForce(Vector3.up);
}

// ✅ CORRECT - Null-conditional for events
OnHealthChanged?.Invoke(currentHealth);
OnDeath?.Invoke();

// ✅ CORRECT - Null check for Unity objects
if (target != null)  // Use this for UnityEngine.Object
{
    target.TakeDamage(10);
}

// ✅ CORRECT - Pattern matching
if (other.TryGetComponent<IDamageable>(out var damageable))
{
    damageable.TakeDamage(damage);
}

// ❌ WRONG - Null-coalescing with Unity objects
var rb = GetComponent<Rigidbody>() ?? AddComponent<Rigidbody>();  // Won't work as expected
```

## Modern C# Features (Use These)

```csharp
// ✅ Expression-bodied members
public int Health => currentHealth;
public void Die() => Destroy(gameObject);

// ✅ Null-conditional operators
OnDeath?.Invoke();
var name = player?.Character?.Name;

// ✅ String interpolation
Debug.Log($"Player {playerName} has {health} HP");

// ✅ Pattern matching
if (collision.gameObject.TryGetComponent<Enemy>(out var enemy))
{
    enemy.TakeDamage(damage);
}

// ✅ Target-typed new
private List<Enemy> enemies = new();
private Vector3 position = new(0, 1, 0);

// ✅ Using declarations
using var stream = File.OpenRead(path);

// ✅ Nullable reference types (C# 8+)
#nullable enable
private Player? targetPlayer;

// ✅ Init-only setters (C# 9+)
public int Id { get; init; }

// ✅ Records for immutable data (C# 9+)
public record DamageEvent(int Amount, DamageType Type, Vector3 Position);
```

## Common Anti-Patterns

```csharp
// ❌ WRONG - GetComponent in Update
void Update()
{
    var rb = GetComponent<Rigidbody>();  // Cache this!
    rb.AddForce(Vector3.up);
}

// ✅ CORRECT - Cache in Awake
private Rigidbody rb;

void Awake()
{
    rb = GetComponent<Rigidbody>();
}

void Update()
{
    rb.AddForce(Vector3.up);
}

// ❌ WRONG - Find in Update
void Update()
{
    var player = GameObject.Find("Player");  // Very slow!
}

// ❌ WRONG - SendMessage (slow, no type safety)
SendMessage("TakeDamage", 10);

// ✅ CORRECT - Direct reference or interface
target.TakeDamage(10);
// or
if (target.TryGetComponent<IDamageable>(out var damageable))
{
    damageable.TakeDamage(10);
}

// ❌ WRONG - Magic strings for animations
animator.Play("Walk");

// ✅ CORRECT - Use hashed IDs
private static readonly int WalkHash = Animator.StringToHash("Walk");
animator.Play(WalkHash);

// ❌ WRONG - Allocating in Update
void Update()
{
    var enemies = new List<Enemy>();  // Allocates every frame!
}

// ✅ CORRECT - Reuse collections
private readonly List<Enemy> enemies = new();

void Update()
{
    enemies.Clear();
    // Use enemies...
}
```

## Unity-Specific Rules

### Coroutines
```csharp
// ✅ CORRECT - Cache WaitForSeconds
private readonly WaitForSeconds waitOneSecond = new(1f);

private IEnumerator SpawnEnemies()
{
    while (true)
    {
        SpawnEnemy();
        yield return waitOneSecond;  // Reuse cached instance
    }
}

// ❌ WRONG - Allocating every iteration
private IEnumerator SpawnEnemies()
{
    while (true)
    {
        SpawnEnemy();
        yield return new WaitForSeconds(1f);  // Allocates!
    }
}
```

### Tags and Layers
```csharp
// ✅ CORRECT - Use CompareTag (faster, no allocation)
if (other.CompareTag("Player"))
{
    // Handle player collision
}

// ❌ WRONG - String comparison allocates
if (other.tag == "Player")
{
    // ...
}

// ✅ CORRECT - Define layer masks
[SerializeField] private LayerMask groundLayer;

if (Physics.Raycast(origin, direction, out var hit, distance, groundLayer))
{
    // Hit ground
}
```

### Transform Operations
```csharp
// ✅ CORRECT - Batch transform changes
transform.SetPositionAndRotation(newPosition, newRotation);

// ❌ WRONG - Separate calls (triggers multiple updates)
transform.position = newPosition;
transform.rotation = newRotation;

// ✅ CORRECT - Cache transform reference
private Transform cachedTransform;

void Awake()
{
    cachedTransform = transform;
}
```

## Access Modifiers

```csharp
// Always use explicit access modifiers
public class Player : MonoBehaviour
{
    // ✅ CORRECT - Explicit modifiers
    private int health;
    public int MaxHealth { get; }
    protected virtual void OnDeath() { }
    internal void Reset() { }

    // ❌ WRONG - Implicit private (be explicit)
    int health;  // Works but unclear
}
```

## Documentation

```csharp
// ✅ CORRECT - XML docs for public API
/// <summary>
/// Applies damage to this entity and triggers death if health reaches zero.
/// </summary>
/// <param name="amount">The amount of damage to apply.</param>
/// <returns>True if the entity died from this damage.</returns>
public bool TakeDamage(int amount)
{
    currentHealth -= amount;
    return currentHealth <= 0;
}

// Don't over-document obvious code
// ❌ WRONG
/// <summary>
/// Gets the health.
/// </summary>
public int Health => currentHealth;  // Self-explanatory
```

## File Organization

- One class per file (with rare exceptions for small related types)
- File name matches class name exactly: `PlayerController.cs`
- Folder structure mirrors namespace structure
- Keep MonoBehaviours in `Scripts/` not root `Assets/`

---

**Summary**: Use PascalCase for types/methods/properties, camelCase for fields/parameters/locals, I-prefix for interfaces. Cache GetComponent calls, use TryGetComponent, avoid Find/SendMessage, use CompareTag, cache WaitForSeconds, and leverage modern C# features.
