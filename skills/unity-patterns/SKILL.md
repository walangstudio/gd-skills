---
name: unity-patterns
description: Unity 6 / 2023 LTS best practices and common patterns. Use for C# architecture, ScriptableObjects, ECS, new Input System, Netcode, and Unity-specific design patterns.
---

# Unity Patterns

Production-ready Unity 6 (2023 LTS) patterns covering architecture, components, data-driven design, and modern Unity features.

## When to Use

- Building games in Unity 6 / 2023.2+
- Need ScriptableObject architecture
- Implementing multiplayer with Netcode
- Using new Input System
- Setting up proper project structure

## Project Structure

### Recommended Folder Organization
```
Assets/
├── _Project/                    # Main project folder (underscore keeps at top)
│   ├── Art/
│   │   ├── Animations/
│   │   ├── Materials/
│   │   ├── Models/
│   │   ├── Sprites/
│   │   └── Textures/
│   ├── Audio/
│   │   ├── Music/
│   │   └── SFX/
│   ├── Data/                    # ScriptableObjects
│   │   ├── Items/
│   │   ├── Enemies/
│   │   └── Settings/
│   ├── Prefabs/
│   │   ├── Characters/
│   │   ├── Environment/
│   │   ├── UI/
│   │   └── VFX/
│   ├── Scenes/
│   │   ├── Levels/
│   │   └── UI/
│   └── Scripts/
│       ├── Core/                # Managers, singletons
│       ├── Gameplay/            # Player, enemies, items
│       ├── UI/                  # UI controllers
│       └── Utilities/           # Helpers, extensions
├── Plugins/                     # Third-party assets
└── Resources/                   # Runtime-loaded assets (use sparingly)
```

## Component Architecture

### Composition Over Inheritance
```csharp
// ✅ GOOD - Composition with separate components
public class Player : MonoBehaviour
{
    [SerializeField] private HealthComponent health;
    [SerializeField] private MovementComponent movement;
    [SerializeField] private AttackComponent attack;
}

// Health is reusable for enemies, NPCs, destructibles
public class HealthComponent : MonoBehaviour
{
    [SerializeField] private int maxHealth = 100;
    private int currentHealth;

    public event Action<int, int> OnHealthChanged; // current, max
    public event Action OnDeath;

    public void TakeDamage(int amount)
    {
        currentHealth = Mathf.Max(0, currentHealth - amount);
        OnHealthChanged?.Invoke(currentHealth, maxHealth);

        if (currentHealth <= 0)
        {
            OnDeath?.Invoke();
        }
    }
}

// ❌ BAD - Deep inheritance
public class Player : LivingEntity { }
public class LivingEntity : Entity { }
public class Entity : MonoBehaviour { }
```

### RequireComponent Pattern
```csharp
[RequireComponent(typeof(Rigidbody))]
[RequireComponent(typeof(Collider))]
public class PhysicsObject : MonoBehaviour
{
    private Rigidbody rb;

    private void Awake()
    {
        rb = GetComponent<Rigidbody>();
    }
}
```

## ScriptableObject Architecture

### Data Containers
```csharp
[CreateAssetMenu(fileName = "New Weapon", menuName = "Game/Items/Weapon")]
public class WeaponData : ScriptableObject
{
    [Header("Basic Info")]
    public string weaponName;
    public Sprite icon;
    [TextArea] public string description;

    [Header("Stats")]
    [Range(1, 100)] public int damage = 10;
    [Range(0.1f, 5f)] public float attackSpeed = 1f;
    [Range(0, 100)] public int criticalChance = 5;

    [Header("Visuals")]
    public GameObject prefab;
    public AudioClip attackSound;
    public ParticleSystem hitEffect;
}
```

### Runtime Sets (Event-like Pattern)
```csharp
// Track all active enemies without FindObjectsOfType
[CreateAssetMenu(fileName = "Enemy Set", menuName = "Game/Runtime Sets/Enemies")]
public class EnemyRuntimeSet : ScriptableObject
{
    private readonly List<Enemy> items = new();

    public IReadOnlyList<Enemy> Items => items;
    public int Count => items.Count;

    public void Add(Enemy enemy)
    {
        if (!items.Contains(enemy))
        {
            items.Add(enemy);
        }
    }

    public void Remove(Enemy enemy)
    {
        items.Remove(enemy);
    }

    public void Clear()
    {
        items.Clear();
    }
}

// Usage in Enemy
public class Enemy : MonoBehaviour
{
    [SerializeField] private EnemyRuntimeSet enemySet;

    private void OnEnable() => enemySet.Add(this);
    private void OnDisable() => enemySet.Remove(this);
}
```

### Game Events (Observer Pattern)
```csharp
// ScriptableObject-based event
[CreateAssetMenu(fileName = "Game Event", menuName = "Game/Events/Game Event")]
public class GameEvent : ScriptableObject
{
    private readonly List<GameEventListener> listeners = new();

    public void Raise()
    {
        for (int i = listeners.Count - 1; i >= 0; i--)
        {
            listeners[i].OnEventRaised();
        }
    }

    public void RegisterListener(GameEventListener listener)
    {
        listeners.Add(listener);
    }

    public void UnregisterListener(GameEventListener listener)
    {
        listeners.Remove(listener);
    }
}

// Listener component
public class GameEventListener : MonoBehaviour
{
    [SerializeField] private GameEvent gameEvent;
    [SerializeField] private UnityEvent response;

    private void OnEnable() => gameEvent.RegisterListener(this);
    private void OnDisable() => gameEvent.UnregisterListener(this);

    public void OnEventRaised() => response?.Invoke();
}

// Typed event with parameter
[CreateAssetMenu(fileName = "Int Event", menuName = "Game/Events/Int Event")]
public class IntEvent : ScriptableObject
{
    private readonly List<Action<int>> listeners = new();

    public void Raise(int value)
    {
        foreach (var listener in listeners)
        {
            listener?.Invoke(value);
        }
    }

    public void AddListener(Action<int> listener) => listeners.Add(listener);
    public void RemoveListener(Action<int> listener) => listeners.Remove(listener);
}
```

### Variable References
```csharp
// Flexible variable that can be constant or reference SO
[Serializable]
public class FloatReference
{
    public bool UseConstant = true;
    public float ConstantValue;
    public FloatVariable Variable;

    public float Value => UseConstant ? ConstantValue : Variable.Value;
}

[CreateAssetMenu(fileName = "Float Variable", menuName = "Game/Variables/Float")]
public class FloatVariable : ScriptableObject
{
    public float Value;
}

// Usage
public class Weapon : MonoBehaviour
{
    [SerializeField] private FloatReference damage;

    public void Attack()
    {
        // Works whether using constant or SO reference
        DealDamage(damage.Value);
    }
}
```

## Singleton Pattern

### Modern Singleton
```csharp
public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    [SerializeField] private GameSettings settings;

    public GameSettings Settings => settings;
    public bool IsPaused { get; private set; }

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
            Initialize();
        }
        else
        {
            Destroy(gameObject);
        }
    }

    private void Initialize()
    {
        // Setup code
    }

    public void PauseGame()
    {
        IsPaused = true;
        Time.timeScale = 0f;
    }

    public void ResumeGame()
    {
        IsPaused = false;
        Time.timeScale = 1f;
    }
}
```

### Generic Singleton Base
```csharp
public abstract class Singleton<T> : MonoBehaviour where T : MonoBehaviour
{
    private static T instance;
    private static readonly object lockObj = new();

    public static T Instance
    {
        get
        {
            if (instance == null)
            {
                lock (lockObj)
                {
                    instance = FindFirstObjectByType<T>();

                    if (instance == null)
                    {
                        var singleton = new GameObject(typeof(T).Name);
                        instance = singleton.AddComponent<T>();
                    }
                }
            }
            return instance;
        }
    }

    protected virtual void Awake()
    {
        if (instance == null)
        {
            instance = this as T;
            DontDestroyOnLoad(gameObject);
        }
        else if (instance != this)
        {
            Destroy(gameObject);
        }
    }
}

// Usage
public class AudioManager : Singleton<AudioManager>
{
    protected override void Awake()
    {
        base.Awake();
        // AudioManager-specific init
    }
}
```

## New Input System

### Input Actions Setup
```csharp
using UnityEngine;
using UnityEngine.InputSystem;

public class PlayerController : MonoBehaviour
{
    [Header("References")]
    [SerializeField] private InputActionAsset inputActions;

    private InputAction moveAction;
    private InputAction jumpAction;
    private InputAction attackAction;

    private Vector2 moveInput;

    private void Awake()
    {
        var playerMap = inputActions.FindActionMap("Player");
        moveAction = playerMap.FindAction("Move");
        jumpAction = playerMap.FindAction("Jump");
        attackAction = playerMap.FindAction("Attack");
    }

    private void OnEnable()
    {
        moveAction.Enable();
        jumpAction.Enable();
        attackAction.Enable();

        jumpAction.performed += OnJump;
        attackAction.performed += OnAttack;
    }

    private void OnDisable()
    {
        jumpAction.performed -= OnJump;
        attackAction.performed -= OnAttack;

        moveAction.Disable();
        jumpAction.Disable();
        attackAction.Disable();
    }

    private void Update()
    {
        moveInput = moveAction.ReadValue<Vector2>();
        // Use moveInput for movement
    }

    private void OnJump(InputAction.CallbackContext context)
    {
        // Handle jump
    }

    private void OnAttack(InputAction.CallbackContext context)
    {
        // Handle attack
    }
}
```

### PlayerInput Component Approach
```csharp
using UnityEngine;
using UnityEngine.InputSystem;

// Uses PlayerInput component with Send Messages or Unity Events
public class PlayerInputHandler : MonoBehaviour
{
    private Vector2 moveInput;

    // Called by PlayerInput component
    public void OnMove(InputValue value)
    {
        moveInput = value.Get<Vector2>();
    }

    public void OnJump(InputValue value)
    {
        if (value.isPressed)
        {
            // Jump
        }
    }

    public void OnFire(InputValue value)
    {
        if (value.isPressed)
        {
            // Fire
        }
    }
}
```

## Object Pooling

### Modern Unity ObjectPool
```csharp
using UnityEngine;
using UnityEngine.Pool;

public class BulletSpawner : MonoBehaviour
{
    [SerializeField] private Bullet bulletPrefab;
    [SerializeField] private int defaultCapacity = 20;
    [SerializeField] private int maxSize = 100;

    private ObjectPool<Bullet> bulletPool;

    private void Awake()
    {
        bulletPool = new ObjectPool<Bullet>(
            createFunc: CreateBullet,
            actionOnGet: OnGetBullet,
            actionOnRelease: OnReleaseBullet,
            actionOnDestroy: OnDestroyBullet,
            collectionCheck: true,
            defaultCapacity: defaultCapacity,
            maxSize: maxSize
        );
    }

    private Bullet CreateBullet()
    {
        var bullet = Instantiate(bulletPrefab);
        bullet.SetPool(bulletPool);
        return bullet;
    }

    private void OnGetBullet(Bullet bullet)
    {
        bullet.gameObject.SetActive(true);
    }

    private void OnReleaseBullet(Bullet bullet)
    {
        bullet.gameObject.SetActive(false);
    }

    private void OnDestroyBullet(Bullet bullet)
    {
        Destroy(bullet.gameObject);
    }

    public Bullet SpawnBullet(Vector3 position, Quaternion rotation)
    {
        var bullet = bulletPool.Get();
        bullet.transform.SetPositionAndRotation(position, rotation);
        return bullet;
    }
}

// Bullet class
public class Bullet : MonoBehaviour
{
    private ObjectPool<Bullet> pool;

    public void SetPool(ObjectPool<Bullet> pool)
    {
        this.pool = pool;
    }

    public void ReturnToPool()
    {
        pool.Release(this);
    }
}
```

## State Machine

### Simple State Machine
```csharp
public enum PlayerState
{
    Idle,
    Running,
    Jumping,
    Falling,
    Attacking
}

public class PlayerStateMachine : MonoBehaviour
{
    public PlayerState CurrentState { get; private set; }

    public event Action<PlayerState, PlayerState> OnStateChanged;

    public void ChangeState(PlayerState newState)
    {
        if (CurrentState == newState) return;

        var previousState = CurrentState;
        ExitState(CurrentState);
        CurrentState = newState;
        EnterState(newState);

        OnStateChanged?.Invoke(previousState, newState);
    }

    private void EnterState(PlayerState state)
    {
        switch (state)
        {
            case PlayerState.Idle:
                // Play idle animation
                break;
            case PlayerState.Running:
                // Play run animation
                break;
            case PlayerState.Jumping:
                // Play jump animation, apply jump force
                break;
        }
    }

    private void ExitState(PlayerState state)
    {
        // Cleanup for exiting state
    }

    private void Update()
    {
        UpdateState(CurrentState);
    }

    private void UpdateState(PlayerState state)
    {
        switch (state)
        {
            case PlayerState.Jumping:
                // Check for landing
                break;
            case PlayerState.Running:
                // Check for stop input
                break;
        }
    }
}
```

### Class-Based State Machine
```csharp
public interface IState
{
    void Enter();
    void Update();
    void FixedUpdate();
    void Exit();
}

public abstract class PlayerStateBase : IState
{
    protected PlayerController player;

    public PlayerStateBase(PlayerController player)
    {
        this.player = player;
    }

    public virtual void Enter() { }
    public virtual void Update() { }
    public virtual void FixedUpdate() { }
    public virtual void Exit() { }
}

public class IdleState : PlayerStateBase
{
    public IdleState(PlayerController player) : base(player) { }

    public override void Enter()
    {
        player.Animator.Play("Idle");
    }

    public override void Update()
    {
        if (player.MoveInput.magnitude > 0.1f)
        {
            player.StateMachine.ChangeState(player.RunState);
        }
    }
}

public class StateMachine
{
    public IState CurrentState { get; private set; }

    public void ChangeState(IState newState)
    {
        CurrentState?.Exit();
        CurrentState = newState;
        CurrentState?.Enter();
    }

    public void Update() => CurrentState?.Update();
    public void FixedUpdate() => CurrentState?.FixedUpdate();
}
```

## Netcode for GameObjects

### Network Player
```csharp
using Unity.Netcode;

public class NetworkPlayer : NetworkBehaviour
{
    [SerializeField] private float moveSpeed = 5f;

    private NetworkVariable<int> health = new(
        100,
        NetworkVariableReadPermission.Everyone,
        NetworkVariableWritePermission.Server
    );

    private NetworkVariable<Vector3> networkPosition = new(
        Vector3.zero,
        NetworkVariableReadPermission.Everyone,
        NetworkVariableWritePermission.Owner
    );

    public override void OnNetworkSpawn()
    {
        health.OnValueChanged += OnHealthChanged;

        if (IsOwner)
        {
            // Setup for local player
        }
    }

    public override void OnNetworkDespawn()
    {
        health.OnValueChanged -= OnHealthChanged;
    }

    private void Update()
    {
        if (!IsOwner) return;

        // Local player movement
        var move = new Vector3(
            Input.GetAxis("Horizontal"),
            0,
            Input.GetAxis("Vertical")
        );
        transform.position += move * moveSpeed * Time.deltaTime;
        networkPosition.Value = transform.position;
    }

    private void LateUpdate()
    {
        if (!IsOwner)
        {
            // Interpolate other players
            transform.position = Vector3.Lerp(
                transform.position,
                networkPosition.Value,
                Time.deltaTime * 10f
            );
        }
    }

    private void OnHealthChanged(int previous, int current)
    {
        // Update health UI
    }

    [ServerRpc]
    public void TakeDamageServerRpc(int amount)
    {
        health.Value = Mathf.Max(0, health.Value - amount);

        if (health.Value <= 0)
        {
            DieClientRpc();
        }
    }

    [ClientRpc]
    private void DieClientRpc()
    {
        // Play death effects on all clients
    }
}
```

## Async/Await Patterns

### Addressables Loading
```csharp
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

public class AssetLoader : MonoBehaviour
{
    [SerializeField] private AssetReference characterPrefab;

    private GameObject loadedCharacter;

    public async void LoadCharacterAsync()
    {
        var handle = characterPrefab.LoadAssetAsync<GameObject>();
        await handle.Task;

        if (handle.Status == AsyncOperationStatus.Succeeded)
        {
            loadedCharacter = Instantiate(handle.Result);
        }
    }

    private void OnDestroy()
    {
        if (loadedCharacter != null)
        {
            characterPrefab.ReleaseAsset();
        }
    }
}
```

### Scene Loading
```csharp
using UnityEngine;
using UnityEngine.SceneManagement;
using System.Threading.Tasks;

public class SceneLoader : MonoBehaviour
{
    [SerializeField] private CanvasGroup loadingScreen;
    [SerializeField] private Slider progressBar;

    public async Task LoadSceneAsync(string sceneName)
    {
        loadingScreen.alpha = 1f;
        loadingScreen.blocksRaycasts = true;

        var operation = SceneManager.LoadSceneAsync(sceneName);
        operation.allowSceneActivation = false;

        while (operation.progress < 0.9f)
        {
            progressBar.value = operation.progress;
            await Task.Yield();
        }

        progressBar.value = 1f;
        await Task.Delay(500); // Brief pause

        operation.allowSceneActivation = true;

        loadingScreen.alpha = 0f;
        loadingScreen.blocksRaycasts = false;
    }
}
```

## Save System

### JSON Save System
```csharp
using UnityEngine;
using System.IO;

[Serializable]
public class SaveData
{
    public int level;
    public int score;
    public float playTime;
    public Vector3Serializable playerPosition;
    public List<string> unlockedItems;
}

[Serializable]
public struct Vector3Serializable
{
    public float x, y, z;

    public Vector3Serializable(Vector3 v)
    {
        x = v.x;
        y = v.y;
        z = v.z;
    }

    public Vector3 ToVector3() => new(x, y, z);
}

public static class SaveSystem
{
    private static string SavePath => Path.Combine(Application.persistentDataPath, "save.json");

    public static void Save(SaveData data)
    {
        string json = JsonUtility.ToJson(data, prettyPrint: true);
        File.WriteAllText(SavePath, json);
    }

    public static SaveData Load()
    {
        if (!File.Exists(SavePath))
        {
            return new SaveData();
        }

        string json = File.ReadAllText(SavePath);
        return JsonUtility.FromJson<SaveData>(json);
    }

    public static void Delete()
    {
        if (File.Exists(SavePath))
        {
            File.Delete(SavePath);
        }
    }

    public static bool SaveExists() => File.Exists(SavePath);
}
```

## Audio Manager

```csharp
public class AudioManager : Singleton<AudioManager>
{
    [SerializeField] private AudioSource musicSource;
    [SerializeField] private AudioSource sfxSource;

    [Header("Audio Clips")]
    [SerializeField] private AudioClip[] musicTracks;
    [SerializeField] private AudioClip[] sfxClips;

    private Dictionary<string, AudioClip> sfxLookup;

    protected override void Awake()
    {
        base.Awake();

        sfxLookup = new Dictionary<string, AudioClip>();
        foreach (var clip in sfxClips)
        {
            sfxLookup[clip.name] = clip;
        }
    }

    public void PlayMusic(int trackIndex, bool loop = true)
    {
        if (trackIndex >= 0 && trackIndex < musicTracks.Length)
        {
            musicSource.clip = musicTracks[trackIndex];
            musicSource.loop = loop;
            musicSource.Play();
        }
    }

    public void PlaySFX(string clipName)
    {
        if (sfxLookup.TryGetValue(clipName, out var clip))
        {
            sfxSource.PlayOneShot(clip);
        }
    }

    public void PlaySFX(AudioClip clip)
    {
        sfxSource.PlayOneShot(clip);
    }

    public void SetMusicVolume(float volume)
    {
        musicSource.volume = Mathf.Clamp01(volume);
    }

    public void SetSFXVolume(float volume)
    {
        sfxSource.volume = Mathf.Clamp01(volume);
    }

    public void FadeMusic(float targetVolume, float duration)
    {
        StartCoroutine(FadeMusicCoroutine(targetVolume, duration));
    }

    private IEnumerator FadeMusicCoroutine(float targetVolume, float duration)
    {
        float startVolume = musicSource.volume;
        float elapsed = 0f;

        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            musicSource.volume = Mathf.Lerp(startVolume, targetVolume, elapsed / duration);
            yield return null;
        }

        musicSource.volume = targetVolume;
    }
}
```

## Extension Methods

```csharp
public static class VectorExtensions
{
    public static Vector3 WithX(this Vector3 v, float x) => new(x, v.y, v.z);
    public static Vector3 WithY(this Vector3 v, float y) => new(v.x, y, v.z);
    public static Vector3 WithZ(this Vector3 v, float z) => new(v.x, v.y, z);

    public static Vector2 ToVector2XZ(this Vector3 v) => new(v.x, v.z);
    public static Vector3 ToVector3XZ(this Vector2 v) => new(v.x, 0, v.y);
}

public static class TransformExtensions
{
    public static void Reset(this Transform t)
    {
        t.position = Vector3.zero;
        t.rotation = Quaternion.identity;
        t.localScale = Vector3.one;
    }

    public static void DestroyAllChildren(this Transform t)
    {
        for (int i = t.childCount - 1; i >= 0; i--)
        {
            Object.Destroy(t.GetChild(i).gameObject);
        }
    }
}

public static class GameObjectExtensions
{
    public static T GetOrAddComponent<T>(this GameObject go) where T : Component
    {
        return go.TryGetComponent<T>(out var component)
            ? component
            : go.AddComponent<T>();
    }
}
```

---

**Remember**: Use composition over inheritance, leverage ScriptableObjects for data-driven design, use the new Input System, implement object pooling for frequently spawned objects, and follow Unity's component-based architecture.
