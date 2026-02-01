---
name: unreal-style
description: Unreal Engine C++ coding standards following Epic Games conventions. Enforces UE5 naming, UPROPERTY/UFUNCTION macros, and modern UE5.4+ practices.
globs: ["*.h", "*.cpp"]
---

# Unreal Engine C++ Style Guide

Mandatory coding standards for Unreal Engine 5.4+ projects following Epic Games conventions.

## Naming Conventions

### Classes and Structs
```cpp
// ✅ CORRECT - Prefix indicates type
class AMyCharacter : public ACharacter { };     // A = Actor
class UHealthComponent : public UActorComponent { };  // U = UObject
class FDamageInfo { };                          // F = Struct (non-UObject)
class IInteractable { };                        // I = Interface
class EGameState { };                           // E = Enum
class TMyTemplate<T> { };                       // T = Template

// ✅ CORRECT - Specific UE types
struct FMyStruct { };                           // F for all structs
struct FTableRowBase { };                       // Data table rows
class UMyDataAsset : public UDataAsset { };    // U for UObject-derived

// ❌ WRONG
class MyCharacter { };      // Missing A prefix
class HealthComp { };       // Missing U prefix, abbreviated
class DamageInfo { };       // Missing F prefix
```

### Type Prefixes Reference
| Prefix | Type | Example |
|--------|------|---------|
| A | Actor | `APlayerCharacter` |
| U | UObject | `UInventoryComponent` |
| F | Struct | `FWeaponStats` |
| E | Enum | `EWeaponType` |
| I | Interface | `IDamageable` |
| T | Template | `TArray`, `TMap` |
| S | Slate Widget | `SMainMenuWidget` |

### Variables and Properties
```cpp
// ✅ CORRECT - PascalCase for all
class AMyCharacter : public ACharacter
{
    // Member variables - PascalCase
    UPROPERTY()
    int32 Health;

    UPROPERTY()
    float MaxHealth;

    UPROPERTY()
    FVector SpawnLocation;

    // Booleans - b prefix
    UPROPERTY()
    bool bIsAlive;

    UPROPERTY()
    bool bCanJump;

    UPROPERTY()
    bool bHasWeapon;

    // Pointers - PascalCase (no prefix needed in UE5)
    UPROPERTY()
    TObjectPtr<UHealthComponent> HealthComponent;

    UPROPERTY()
    TObjectPtr<AActor> TargetActor;
};

// ❌ WRONG
int32 health;           // Should be PascalCase
float m_maxHealth;      // No Hungarian notation
bool IsAlive;           // Booleans need b prefix
bool hasWeapon;         // Wrong: needs b prefix and PascalCase
UHealthComponent* pHealth;  // No p prefix for pointers
```

### Functions
```cpp
// ✅ CORRECT - PascalCase, descriptive verbs
void TakeDamage(float DamageAmount);
void SpawnEnemy(const FVector& Location);
bool IsAlive() const;
float GetHealthPercent() const;
void SetMaxHealth(float NewMaxHealth);

// ✅ CORRECT - Event handlers
void OnHealthChanged(float NewHealth);
void OnDeath();
void HandleDamage(const FDamageEvent& Event);

// ❌ WRONG
void takeDamage();      // Not PascalCase
void Damage();          // Not descriptive
void spawn_enemy();     // Snake_case not allowed
```

### Parameters
```cpp
// ✅ CORRECT - PascalCase for parameters
void Initialize(int32 StartHealth, float SpawnDelay);
void SetPosition(const FVector& NewPosition);
void ApplyDamage(AActor* DamagedActor, float DamageAmount);

// ✅ CORRECT - Out parameters
void GetStats(int32& OutHealth, int32& OutMaxHealth) const;
bool TryGetTarget(AActor*& OutTarget) const;

// ❌ WRONG
void Initialize(int32 startHealth);  // Should be PascalCase
void GetStats(int32& health);        // Out params need Out prefix
```

### Enums
```cpp
// ✅ CORRECT - E prefix, PascalCase values
UENUM(BlueprintType)
enum class EWeaponType : uint8
{
    Melee,
    Ranged,
    Magic,
    None
};

UENUM(BlueprintType)
enum class EGameState : uint8
{
    MainMenu,
    Playing,
    Paused,
    GameOver
};

// ❌ WRONG
enum WeaponType { MELEE, RANGED };  // Missing E prefix, wrong value casing
enum class EState { playing };      // Values should be PascalCase
```

## UPROPERTY Specifiers

### Common Specifiers
```cpp
// ✅ Editor-visible, instance editable
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stats")
float MaxHealth = 100.f;

// ✅ Editor-visible, not editable at runtime
UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Config")
TSubclassOf<AActor> ProjectileClass;

// ✅ Blueprint read-only (set in C++ only)
UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
TObjectPtr<UHealthComponent> HealthComponent;

// ✅ Replicated property
UPROPERTY(ReplicatedUsing = OnRep_Health, BlueprintReadOnly, Category = "Stats")
float Health;

// ✅ Transient (not saved)
UPROPERTY(Transient)
TObjectPtr<AActor> CachedTarget;

// ✅ With metadata
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stats", meta = (ClampMin = "0", ClampMax = "100"))
int32 HealthPercent;
```

### Specifier Reference
| Specifier | Usage |
|-----------|-------|
| `EditAnywhere` | Editable everywhere |
| `EditDefaultsOnly` | Editable in defaults only |
| `EditInstanceOnly` | Editable per-instance only |
| `VisibleAnywhere` | Visible but not editable |
| `BlueprintReadWrite` | Full Blueprint access |
| `BlueprintReadOnly` | Blueprint can read |
| `Replicated` | Network replicated |
| `ReplicatedUsing` | Replicated with callback |
| `Transient` | Not serialized |
| `Category` | Inspector organization |

## UFUNCTION Specifiers

### Common Specifiers
```cpp
// ✅ Blueprint callable from anywhere
UFUNCTION(BlueprintCallable, Category = "Combat")
void Attack();

// ✅ Pure function (no side effects)
UFUNCTION(BlueprintPure, Category = "Stats")
float GetHealthPercent() const;

// ✅ Blueprint implementable event
UFUNCTION(BlueprintNativeEvent, Category = "Events")
void OnDamageReceived(float Damage);

// ✅ Server RPC
UFUNCTION(Server, Reliable, WithValidation)
void Server_TakeDamage(float DamageAmount);

// ✅ Client RPC
UFUNCTION(Client, Reliable)
void Client_PlayHitEffect();

// ✅ Multicast RPC
UFUNCTION(NetMulticast, Unreliable)
void Multicast_PlayFootstep();

// ✅ Blueprint assignable delegate
UFUNCTION(BlueprintCallable, BlueprintAssignable, Category = "Events")
void BindOnDeath(FOnDeathSignature Callback);
```

### RPC Validation
```cpp
// Server RPC with validation
UFUNCTION(Server, Reliable, WithValidation)
void Server_UseItem(int32 ItemIndex);

bool Server_UseItem_Validate(int32 ItemIndex)
{
    return ItemIndex >= 0 && ItemIndex < InventorySize;
}

void Server_UseItem_Implementation(int32 ItemIndex)
{
    // Use item
}
```

## Modern UE5.4+ Practices

### TObjectPtr (Required in UE5)
```cpp
// ✅ CORRECT - Use TObjectPtr for UPROPERTY pointers
UPROPERTY()
TObjectPtr<UHealthComponent> HealthComponent;

UPROPERTY()
TObjectPtr<AActor> TargetActor;

UPROPERTY()
TArray<TObjectPtr<AActor>> Enemies;

// ❌ WRONG - Raw pointers in UPROPERTY (UE4 style)
UPROPERTY()
UHealthComponent* HealthComponent;  // Use TObjectPtr

// ✅ CORRECT - Raw pointers still OK for local/non-UPROPERTY
AActor* LocalTarget = FindTarget();
```

### Forward Declarations
```cpp
// Header file
#pragma once

// ✅ CORRECT - Forward declare in headers
class UHealthComponent;
class AEnemy;
struct FDamageInfo;

class AMyCharacter : public ACharacter
{
    UPROPERTY()
    TObjectPtr<UHealthComponent> Health;  // Forward declared
};

// ❌ WRONG - Including in header when forward declare works
#include "HealthComponent.h"  // Include in .cpp instead
```

### Include Order
```cpp
// ✅ CORRECT - Include order
#include "MyClass.h"  // Matching header first

#include "CoreMinimal.h"  // Core UE headers
#include "GameFramework/Actor.h"

#include "Components/HealthComponent.h"  // Project headers
#include "Data/WeaponData.h"

#include "MyClass.generated.h"  // Generated header last (in .h only)
```

### Const Correctness
```cpp
// ✅ CORRECT - Use const appropriately
float GetHealth() const { return Health; }

void ProcessDamage(const FDamageInfo& DamageInfo);

const TArray<AActor*>& GetEnemies() const { return Enemies; }

// ✅ CORRECT - Const pointers
void Analyze(const AActor* Target) const;
```

## Code Organization

### Header File Structure
```cpp
// MyCharacter.h
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "Interfaces/Damageable.h"
#include "MyCharacter.generated.h"

// Forward declarations
class UHealthComponent;
class UAbilitySystemComponent;

// Delegates
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnHealthChanged, float, NewHealth);

UCLASS()
class MYGAME_API AMyCharacter : public ACharacter, public IDamageable
{
    GENERATED_BODY()

public:
    // Constructor
    AMyCharacter();

    // Public interface
    UFUNCTION(BlueprintCallable, Category = "Combat")
    virtual void TakeDamage(float Amount) override;

    // Delegates
    UPROPERTY(BlueprintAssignable, Category = "Events")
    FOnHealthChanged OnHealthChanged;

protected:
    // Lifecycle
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;

    // Components
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
    TObjectPtr<UHealthComponent> HealthComponent;

    // Config
    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Config")
    float MaxHealth = 100.f;

private:
    // Internal state
    float CurrentHealth;

    // Internal methods
    void UpdateHealthUI();
};
```

### API Macro
```cpp
// ✅ CORRECT - Always include API macro for DLL export
UCLASS()
class MYGAME_API AMyCharacter : public ACharacter
{
    GENERATED_BODY()
};

USTRUCT(BlueprintType)
struct MYGAME_API FWeaponData
{
    GENERATED_BODY()
};
```

## Common Patterns

### Null Checks
```cpp
// ✅ CORRECT - Check validity
if (IsValid(TargetActor))
{
    TargetActor->TakeDamage(10.f);
}

// ✅ CORRECT - Ensure macro (logs + returns if false)
if (!ensure(HealthComponent != nullptr))
{
    return;
}

// ✅ CORRECT - Check macro (fatal in dev, removed in shipping)
check(ImportantPointer != nullptr);

// ✅ CORRECT - Verify macro (stays in shipping)
verify(CriticalOperation());

// ❌ WRONG - Plain null check for UObjects
if (TargetActor != nullptr)  // Use IsValid() instead
```

### Logging
```cpp
// ✅ CORRECT - Use UE_LOG
UE_LOG(LogTemp, Log, TEXT("Player spawned"));
UE_LOG(LogTemp, Warning, TEXT("Health low: %f"), Health);
UE_LOG(LogTemp, Error, TEXT("Failed to find target"));

// ✅ CORRECT - Custom log category
DECLARE_LOG_CATEGORY_EXTERN(LogMyGame, Log, All);

// In .cpp
DEFINE_LOG_CATEGORY(LogMyGame);

UE_LOG(LogMyGame, Log, TEXT("Custom category log"));
```

### String Formatting
```cpp
// ✅ CORRECT - FString formatting
FString Message = FString::Printf(TEXT("Player %s has %d HP"), *PlayerName, Health);

// ✅ CORRECT - FName for identifiers
FName WeaponID = TEXT("Sword_01");

// ✅ CORRECT - FText for UI (localizable)
FText DisplayName = FText::FromString(TEXT("Magic Sword"));
FText FormattedText = FText::Format(LOCTEXT("DamageFormat", "{0} dealt {1} damage"), PlayerName, Damage);
```

## Anti-Patterns to Avoid

```cpp
// ❌ WRONG - Tick when not needed
virtual void Tick(float DeltaTime) override
{
    // Empty or rarely used - disable tick instead
}

// ✅ CORRECT - Disable tick if not used
AMyActor::AMyActor()
{
    PrimaryActorTick.bCanEverTick = false;
}

// ❌ WRONG - GetWorld() in constructor
AMyActor::AMyActor()
{
    GetWorld()->SpawnActor();  // World doesn't exist yet!
}

// ❌ WRONG - Hard references to assets
UPROPERTY()
UStaticMesh* HardRef;  // Loads with class

// ✅ CORRECT - Soft references for optional/large assets
UPROPERTY()
TSoftObjectPtr<UStaticMesh> SoftRef;  // Loaded on demand

// ❌ WRONG - Blueprint callable with raw pointer return
UFUNCTION(BlueprintCallable)
AActor* GetTarget();  // Can crash BP if null

// ✅ CORRECT - Use validity checks or out params
UFUNCTION(BlueprintCallable)
bool TryGetTarget(AActor*& OutTarget);
```

---

**Summary**: Use type prefixes (A/U/F/E/I/T), PascalCase for everything, b-prefix for booleans, Out-prefix for out parameters, TObjectPtr for UPROPERTY pointers, and always include the API macro. Follow Epic's coding standard for consistency with engine code.
