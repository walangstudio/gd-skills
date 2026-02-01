---
name: unreal-patterns
description: Unreal Engine 5.4+ best practices and common patterns. Use for C++ architecture, Blueprints, Enhanced Input, GAS (Gameplay Ability System), Netcode, and UE5-specific design patterns.
---

# Unreal Engine Patterns

Production-ready Unreal Engine 5.4+ patterns covering C++ architecture, Blueprints, multiplayer, and modern UE5 features.

## When to Use

- Building games in Unreal Engine 5.4+
- Need C++/Blueprint architecture guidance
- Implementing GAS (Gameplay Ability System)
- Using Enhanced Input System
- Setting up multiplayer with replication

## Project Structure

### Recommended Folder Organization
```
Content/
├── _Game/                      # Main game folder (underscore keeps at top)
│   ├── Art/
│   │   ├── Characters/
│   │   ├── Environment/
│   │   ├── Props/
│   │   └── UI/
│   ├── Audio/
│   │   ├── Music/
│   │   ├── SFX/
│   │   └── Ambience/
│   ├── Blueprints/
│   │   ├── Characters/
│   │   ├── GameModes/
│   │   ├── Items/
│   │   └── UI/
│   ├── Data/                   # DataAssets, DataTables
│   ├── Effects/                # Niagara, Materials
│   ├── Input/                  # Input Actions, Mapping Contexts
│   ├── Levels/
│   │   ├── MainMenu/
│   │   └── Gameplay/
│   └── UI/
│       ├── Widgets/
│       └── Styles/
├── Developers/                 # Per-developer test content
└── ThirdParty/                 # Marketplace assets

Source/
├── MyGame/
│   ├── Public/                 # Headers
│   │   ├── Characters/
│   │   ├── Components/
│   │   ├── GameModes/
│   │   └── Core/
│   └── Private/                # Implementation
│       ├── Characters/
│       ├── Components/
│       ├── GameModes/
│       └── Core/
```

## Actor Component Architecture

### Character with Components
```cpp
// MyCharacter.h
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "AbilitySystemInterface.h"
#include "MyCharacter.generated.h"

class UHealthComponent;
class UAbilitySystemComponent;
class UMyAttributeSet;

UCLASS()
class MYGAME_API AMyCharacter : public ACharacter, public IAbilitySystemInterface
{
    GENERATED_BODY()

public:
    AMyCharacter();

    // IAbilitySystemInterface
    virtual UAbilitySystemComponent* GetAbilitySystemComponent() const override;

protected:
    virtual void BeginPlay() override;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
    TObjectPtr<UHealthComponent> HealthComponent;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Abilities")
    TObjectPtr<UAbilitySystemComponent> AbilitySystemComponent;

    UPROPERTY()
    TObjectPtr<UMyAttributeSet> AttributeSet;
};

// MyCharacter.cpp
#include "MyCharacter.h"
#include "Components/HealthComponent.h"
#include "AbilitySystemComponent.h"
#include "MyAttributeSet.h"

AMyCharacter::AMyCharacter()
{
    PrimaryActorTick.bCanEverTick = true;

    HealthComponent = CreateDefaultSubobject<UHealthComponent>(TEXT("HealthComponent"));

    AbilitySystemComponent = CreateDefaultSubobject<UAbilitySystemComponent>(TEXT("AbilitySystemComponent"));
    AbilitySystemComponent->SetIsReplicated(true);

    AttributeSet = CreateDefaultSubobject<UMyAttributeSet>(TEXT("AttributeSet"));
}

UAbilitySystemComponent* AMyCharacter::GetAbilitySystemComponent() const
{
    return AbilitySystemComponent;
}

void AMyCharacter::BeginPlay()
{
    Super::BeginPlay();

    if (AbilitySystemComponent)
    {
        AbilitySystemComponent->InitAbilityActorInfo(this, this);
    }
}
```

### Reusable Actor Component
```cpp
// HealthComponent.h
#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "HealthComponent.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnHealthChanged, float, CurrentHealth, float, MaxHealth);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnDeath);

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class MYGAME_API UHealthComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UHealthComponent();

    UFUNCTION(BlueprintCallable, Category = "Health")
    void TakeDamage(float DamageAmount);

    UFUNCTION(BlueprintCallable, Category = "Health")
    void Heal(float HealAmount);

    UFUNCTION(BlueprintPure, Category = "Health")
    float GetHealthPercent() const;

    UFUNCTION(BlueprintPure, Category = "Health")
    bool IsAlive() const { return CurrentHealth > 0.f; }

    UPROPERTY(BlueprintAssignable, Category = "Health")
    FOnHealthChanged OnHealthChanged;

    UPROPERTY(BlueprintAssignable, Category = "Health")
    FOnDeath OnDeath;

protected:
    virtual void BeginPlay() override;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Health")
    float MaxHealth = 100.f;

    UPROPERTY(ReplicatedUsing = OnRep_CurrentHealth, BlueprintReadOnly, Category = "Health")
    float CurrentHealth;

    UFUNCTION()
    void OnRep_CurrentHealth();

    virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;
};

// HealthComponent.cpp
#include "HealthComponent.h"
#include "Net/UnrealNetwork.h"

UHealthComponent::UHealthComponent()
{
    PrimaryComponentTick.bCanEverTick = false;
    SetIsReplicatedByDefault(true);
}

void UHealthComponent::BeginPlay()
{
    Super::BeginPlay();
    CurrentHealth = MaxHealth;
}

void UHealthComponent::TakeDamage(float DamageAmount)
{
    if (!GetOwner()->HasAuthority()) return;

    CurrentHealth = FMath::Clamp(CurrentHealth - DamageAmount, 0.f, MaxHealth);
    OnHealthChanged.Broadcast(CurrentHealth, MaxHealth);

    if (CurrentHealth <= 0.f)
    {
        OnDeath.Broadcast();
    }
}

void UHealthComponent::Heal(float HealAmount)
{
    if (!GetOwner()->HasAuthority()) return;

    CurrentHealth = FMath::Clamp(CurrentHealth + HealAmount, 0.f, MaxHealth);
    OnHealthChanged.Broadcast(CurrentHealth, MaxHealth);
}

float UHealthComponent::GetHealthPercent() const
{
    return MaxHealth > 0.f ? CurrentHealth / MaxHealth : 0.f;
}

void UHealthComponent::OnRep_CurrentHealth()
{
    OnHealthChanged.Broadcast(CurrentHealth, MaxHealth);
}

void UHealthComponent::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);
    DOREPLIFETIME(UHealthComponent, CurrentHealth);
}
```

## Enhanced Input System

### Input Setup
```cpp
// MyPlayerController.h
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/PlayerController.h"
#include "InputActionValue.h"
#include "MyPlayerController.generated.h"

class UInputMappingContext;
class UInputAction;

UCLASS()
class MYGAME_API AMyPlayerController : public APlayerController
{
    GENERATED_BODY()

protected:
    virtual void BeginPlay() override;
    virtual void SetupInputComponent() override;

    // Input Actions
    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Input")
    TObjectPtr<UInputMappingContext> DefaultMappingContext;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Input")
    TObjectPtr<UInputAction> MoveAction;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Input")
    TObjectPtr<UInputAction> LookAction;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Input")
    TObjectPtr<UInputAction> JumpAction;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Input")
    TObjectPtr<UInputAction> AttackAction;

    // Input Handlers
    void HandleMove(const FInputActionValue& Value);
    void HandleLook(const FInputActionValue& Value);
    void HandleJumpStart();
    void HandleJumpStop();
    void HandleAttack();
};

// MyPlayerController.cpp
#include "MyPlayerController.h"
#include "EnhancedInputComponent.h"
#include "EnhancedInputSubsystems.h"

void AMyPlayerController::BeginPlay()
{
    Super::BeginPlay();

    // Add Input Mapping Context
    if (UEnhancedInputLocalPlayerSubsystem* Subsystem =
        ULocalPlayer::GetSubsystem<UEnhancedInputLocalPlayerSubsystem>(GetLocalPlayer()))
    {
        Subsystem->AddMappingContext(DefaultMappingContext, 0);
    }
}

void AMyPlayerController::SetupInputComponent()
{
    Super::SetupInputComponent();

    if (UEnhancedInputComponent* EnhancedInput = Cast<UEnhancedInputComponent>(InputComponent))
    {
        // Movement
        EnhancedInput->BindAction(MoveAction, ETriggerEvent::Triggered, this, &AMyPlayerController::HandleMove);

        // Look
        EnhancedInput->BindAction(LookAction, ETriggerEvent::Triggered, this, &AMyPlayerController::HandleLook);

        // Jump
        EnhancedInput->BindAction(JumpAction, ETriggerEvent::Started, this, &AMyPlayerController::HandleJumpStart);
        EnhancedInput->BindAction(JumpAction, ETriggerEvent::Completed, this, &AMyPlayerController::HandleJumpStop);

        // Attack
        EnhancedInput->BindAction(AttackAction, ETriggerEvent::Triggered, this, &AMyPlayerController::HandleAttack);
    }
}

void AMyPlayerController::HandleMove(const FInputActionValue& Value)
{
    const FVector2D MoveVector = Value.Get<FVector2D>();

    if (APawn* ControlledPawn = GetPawn())
    {
        const FRotator Rotation = GetControlRotation();
        const FRotator YawRotation(0, Rotation.Yaw, 0);

        const FVector ForwardDirection = FRotationMatrix(YawRotation).GetUnitAxis(EAxis::X);
        const FVector RightDirection = FRotationMatrix(YawRotation).GetUnitAxis(EAxis::Y);

        ControlledPawn->AddMovementInput(ForwardDirection, MoveVector.Y);
        ControlledPawn->AddMovementInput(RightDirection, MoveVector.X);
    }
}

void AMyPlayerController::HandleLook(const FInputActionValue& Value)
{
    const FVector2D LookVector = Value.Get<FVector2D>();
    AddYawInput(LookVector.X);
    AddPitchInput(LookVector.Y);
}

void AMyPlayerController::HandleJumpStart()
{
    if (ACharacter* Character = Cast<ACharacter>(GetPawn()))
    {
        Character->Jump();
    }
}

void AMyPlayerController::HandleJumpStop()
{
    if (ACharacter* Character = Cast<ACharacter>(GetPawn()))
    {
        Character->StopJumping();
    }
}

void AMyPlayerController::HandleAttack()
{
    // Trigger attack ability or animation
}
```

## Gameplay Ability System (GAS)

### Attribute Set
```cpp
// MyAttributeSet.h
#pragma once

#include "CoreMinimal.h"
#include "AttributeSet.h"
#include "AbilitySystemComponent.h"
#include "MyAttributeSet.generated.h"

#define ATTRIBUTE_ACCESSORS(ClassName, PropertyName) \
    GAMEPLAYATTRIBUTE_PROPERTY_GETTER(ClassName, PropertyName) \
    GAMEPLAYATTRIBUTE_VALUE_GETTER(PropertyName) \
    GAMEPLAYATTRIBUTE_VALUE_SETTER(PropertyName) \
    GAMEPLAYATTRIBUTE_VALUE_INITTER(PropertyName)

UCLASS()
class MYGAME_API UMyAttributeSet : public UAttributeSet
{
    GENERATED_BODY()

public:
    UMyAttributeSet();

    virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;
    virtual void PreAttributeChange(const FGameplayAttribute& Attribute, float& NewValue) override;
    virtual void PostGameplayEffectExecute(const FGameplayEffectModCallbackData& Data) override;

    // Health
    UPROPERTY(BlueprintReadOnly, ReplicatedUsing = OnRep_Health, Category = "Attributes")
    FGameplayAttributeData Health;
    ATTRIBUTE_ACCESSORS(UMyAttributeSet, Health)

    UPROPERTY(BlueprintReadOnly, ReplicatedUsing = OnRep_MaxHealth, Category = "Attributes")
    FGameplayAttributeData MaxHealth;
    ATTRIBUTE_ACCESSORS(UMyAttributeSet, MaxHealth)

    // Stamina
    UPROPERTY(BlueprintReadOnly, ReplicatedUsing = OnRep_Stamina, Category = "Attributes")
    FGameplayAttributeData Stamina;
    ATTRIBUTE_ACCESSORS(UMyAttributeSet, Stamina)

    UPROPERTY(BlueprintReadOnly, ReplicatedUsing = OnRep_MaxStamina, Category = "Attributes")
    FGameplayAttributeData MaxStamina;
    ATTRIBUTE_ACCESSORS(UMyAttributeSet, MaxStamina)

    // Damage (meta attribute)
    UPROPERTY(BlueprintReadOnly, Category = "Attributes")
    FGameplayAttributeData Damage;
    ATTRIBUTE_ACCESSORS(UMyAttributeSet, Damage)

protected:
    UFUNCTION()
    void OnRep_Health(const FGameplayAttributeData& OldHealth);

    UFUNCTION()
    void OnRep_MaxHealth(const FGameplayAttributeData& OldMaxHealth);

    UFUNCTION()
    void OnRep_Stamina(const FGameplayAttributeData& OldStamina);

    UFUNCTION()
    void OnRep_MaxStamina(const FGameplayAttributeData& OldMaxStamina);
};

// MyAttributeSet.cpp
#include "MyAttributeSet.h"
#include "Net/UnrealNetwork.h"
#include "GameplayEffectExtension.h"

UMyAttributeSet::UMyAttributeSet()
{
    InitHealth(100.f);
    InitMaxHealth(100.f);
    InitStamina(100.f);
    InitMaxStamina(100.f);
}

void UMyAttributeSet::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);

    DOREPLIFETIME_CONDITION_NOTIFY(UMyAttributeSet, Health, COND_None, REPNOTIFY_Always);
    DOREPLIFETIME_CONDITION_NOTIFY(UMyAttributeSet, MaxHealth, COND_None, REPNOTIFY_Always);
    DOREPLIFETIME_CONDITION_NOTIFY(UMyAttributeSet, Stamina, COND_None, REPNOTIFY_Always);
    DOREPLIFETIME_CONDITION_NOTIFY(UMyAttributeSet, MaxStamina, COND_None, REPNOTIFY_Always);
}

void UMyAttributeSet::PreAttributeChange(const FGameplayAttribute& Attribute, float& NewValue)
{
    Super::PreAttributeChange(Attribute, NewValue);

    // Clamp health and stamina
    if (Attribute == GetHealthAttribute())
    {
        NewValue = FMath::Clamp(NewValue, 0.f, GetMaxHealth());
    }
    else if (Attribute == GetStaminaAttribute())
    {
        NewValue = FMath::Clamp(NewValue, 0.f, GetMaxStamina());
    }
}

void UMyAttributeSet::PostGameplayEffectExecute(const FGameplayEffectModCallbackData& Data)
{
    Super::PostGameplayEffectExecute(Data);

    // Handle damage meta attribute
    if (Data.EvaluatedData.Attribute == GetDamageAttribute())
    {
        const float DamageDone = GetDamage();
        SetDamage(0.f);

        if (DamageDone > 0.f)
        {
            const float NewHealth = GetHealth() - DamageDone;
            SetHealth(FMath::Clamp(NewHealth, 0.f, GetMaxHealth()));

            if (GetHealth() <= 0.f)
            {
                // Handle death
            }
        }
    }
}

void UMyAttributeSet::OnRep_Health(const FGameplayAttributeData& OldHealth)
{
    GAMEPLAYATTRIBUTE_REPNOTIFY(UMyAttributeSet, Health, OldHealth);
}

void UMyAttributeSet::OnRep_MaxHealth(const FGameplayAttributeData& OldMaxHealth)
{
    GAMEPLAYATTRIBUTE_REPNOTIFY(UMyAttributeSet, MaxHealth, OldMaxHealth);
}

void UMyAttributeSet::OnRep_Stamina(const FGameplayAttributeData& OldStamina)
{
    GAMEPLAYATTRIBUTE_REPNOTIFY(UMyAttributeSet, Stamina, OldStamina);
}

void UMyAttributeSet::OnRep_MaxStamina(const FGameplayAttributeData& OldMaxStamina)
{
    GAMEPLAYATTRIBUTE_REPNOTIFY(UMyAttributeSet, MaxStamina, OldMaxStamina);
}
```

### Gameplay Ability
```cpp
// MyGameplayAbility.h
#pragma once

#include "CoreMinimal.h"
#include "Abilities/GameplayAbility.h"
#include "MyGameplayAbility.generated.h"

UCLASS()
class MYGAME_API UMyGameplayAbility : public UGameplayAbility
{
    GENERATED_BODY()

public:
    UMyGameplayAbility();

    // Ability input binding
    UPROPERTY(BlueprintReadOnly, EditAnywhere, Category = "Ability")
    EAbilityInputID AbilityInputID = EAbilityInputID::None;

protected:
    virtual void ActivateAbility(const FGameplayAbilitySpecHandle Handle,
        const FGameplayAbilityActorInfo* ActorInfo,
        const FGameplayAbilityActivationInfo ActivationInfo,
        const FGameplayEventData* TriggerEventData) override;

    virtual void EndAbility(const FGameplayAbilitySpecHandle Handle,
        const FGameplayAbilityActorInfo* ActorInfo,
        const FGameplayAbilityActivationInfo ActivationInfo,
        bool bReplicateEndAbility, bool bWasCancelled) override;
};
```

## Data Assets

### Item Data Asset
```cpp
// ItemDataAsset.h
#pragma once

#include "CoreMinimal.h"
#include "Engine/DataAsset.h"
#include "ItemDataAsset.generated.h"

UENUM(BlueprintType)
enum class EItemType : uint8
{
    Weapon,
    Armor,
    Consumable,
    Material
};

UCLASS(BlueprintType)
class MYGAME_API UItemDataAsset : public UPrimaryDataAsset
{
    GENERATED_BODY()

public:
    // Identification
    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Item")
    FName ItemID;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Item")
    FText DisplayName;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Item", meta = (MultiLine = true))
    FText Description;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Item")
    EItemType ItemType;

    // Visuals
    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Item")
    TObjectPtr<UTexture2D> Icon;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Item")
    TObjectPtr<UStaticMesh> Mesh;

    // Gameplay
    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Item")
    int32 MaxStackSize = 1;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Item")
    bool bCanBeDropped = true;

    // Asset Manager
    virtual FPrimaryAssetId GetPrimaryAssetId() const override
    {
        return FPrimaryAssetId("Item", GetFName());
    }
};
```

### Data Table Row
```cpp
// EnemyDataRow.h
#pragma once

#include "CoreMinimal.h"
#include "Engine/DataTable.h"
#include "EnemyDataRow.generated.h"

USTRUCT(BlueprintType)
struct FEnemyDataRow : public FTableRowBase
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Enemy")
    FName EnemyID;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Enemy")
    FText DisplayName;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stats")
    float MaxHealth = 100.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stats")
    float BaseDamage = 10.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stats")
    float MoveSpeed = 300.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Enemy")
    TSoftClassPtr<AActor> EnemyClass;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Loot")
    TArray<FName> LootTableIDs;
};
```

## Subsystems

### Game Instance Subsystem
```cpp
// SaveGameSubsystem.h
#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "SaveGameSubsystem.generated.h"

class UMySaveGame;

UCLASS()
class MYGAME_API USaveGameSubsystem : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;
    virtual void Deinitialize() override;

    UFUNCTION(BlueprintCallable, Category = "Save")
    bool SaveGame(const FString& SlotName);

    UFUNCTION(BlueprintCallable, Category = "Save")
    bool LoadGame(const FString& SlotName);

    UFUNCTION(BlueprintCallable, Category = "Save")
    bool DoesSaveExist(const FString& SlotName) const;

    UFUNCTION(BlueprintCallable, Category = "Save")
    bool DeleteSave(const FString& SlotName);

    UFUNCTION(BlueprintPure, Category = "Save")
    UMySaveGame* GetCurrentSaveGame() const { return CurrentSaveGame; }

protected:
    UPROPERTY()
    TObjectPtr<UMySaveGame> CurrentSaveGame;

    static constexpr int32 UserIndex = 0;
};
```

### World Subsystem
```cpp
// EnemyManagerSubsystem.h
#pragma once

#include "CoreMinimal.h"
#include "Subsystems/WorldSubsystem.h"
#include "EnemyManagerSubsystem.generated.h"

UCLASS()
class MYGAME_API UEnemyManagerSubsystem : public UWorldSubsystem
{
    GENERATED_BODY()

public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;

    void RegisterEnemy(AActor* Enemy);
    void UnregisterEnemy(AActor* Enemy);

    UFUNCTION(BlueprintPure, Category = "Enemies")
    int32 GetEnemyCount() const { return ActiveEnemies.Num(); }

    UFUNCTION(BlueprintPure, Category = "Enemies")
    TArray<AActor*> GetAllEnemies() const { return ActiveEnemies; }

protected:
    UPROPERTY()
    TArray<TObjectPtr<AActor>> ActiveEnemies;
};
```

## Replication

### Replicated Actor
```cpp
// ReplicatedProjectile.h
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "ReplicatedProjectile.generated.h"

UCLASS()
class MYGAME_API AReplicatedProjectile : public AActor
{
    GENERATED_BODY()

public:
    AReplicatedProjectile();

    virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;

    UFUNCTION(BlueprintCallable, Category = "Projectile")
    void Launch(const FVector& Direction, float Speed);

protected:
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    TObjectPtr<UProjectileMovementComponent> ProjectileMovement;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    TObjectPtr<USphereComponent> CollisionComponent;

    UPROPERTY(Replicated, BlueprintReadOnly, Category = "Projectile")
    float Damage = 20.f;

    UPROPERTY(ReplicatedUsing = OnRep_HasHit)
    bool bHasHit = false;

    UFUNCTION()
    void OnRep_HasHit();

    UFUNCTION()
    void OnHit(UPrimitiveComponent* HitComp, AActor* OtherActor,
        UPrimitiveComponent* OtherComp, FVector NormalImpulse, const FHitResult& Hit);

    UFUNCTION(NetMulticast, Reliable)
    void Multicast_PlayImpactEffects(const FVector& Location);
};

// ReplicatedProjectile.cpp
void AReplicatedProjectile::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);

    DOREPLIFETIME(AReplicatedProjectile, Damage);
    DOREPLIFETIME(AReplicatedProjectile, bHasHit);
}
```

## Object Pooling

### Actor Pool
```cpp
// ActorPool.h
#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "ActorPool.generated.h"

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class MYGAME_API UActorPool : public UActorComponent
{
    GENERATED_BODY()

public:
    UActorPool();

    UFUNCTION(BlueprintCallable, Category = "Pool")
    AActor* GetPooledActor();

    UFUNCTION(BlueprintCallable, Category = "Pool")
    void ReturnToPool(AActor* Actor);

protected:
    virtual void BeginPlay() override;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Pool")
    TSubclassOf<AActor> ActorClass;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Pool")
    int32 PoolSize = 20;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Pool")
    bool bExpandIfEmpty = true;

private:
    UPROPERTY()
    TArray<TObjectPtr<AActor>> PooledActors;

    UPROPERTY()
    TArray<TObjectPtr<AActor>> ActiveActors;

    AActor* CreatePooledActor();
};
```

## Async Loading

### Soft References and Async Loading
```cpp
// AssetLoader.h
#pragma once

#include "CoreMinimal.h"
#include "Engine/StreamableManager.h"
#include "AssetLoader.generated.h"

UCLASS()
class MYGAME_API UAssetLoader : public UObject
{
    GENERATED_BODY()

public:
    // Async load single asset
    template<typename T>
    void AsyncLoadAsset(TSoftObjectPtr<T> AssetPtr, TFunction<void(T*)> OnLoaded)
    {
        if (AssetPtr.IsNull())
        {
            OnLoaded(nullptr);
            return;
        }

        if (AssetPtr.IsValid())
        {
            OnLoaded(AssetPtr.Get());
            return;
        }

        FStreamableManager& StreamableManager = UAssetManager::GetStreamableManager();
        StreamableManager.RequestAsyncLoad(
            AssetPtr.ToSoftObjectPath(),
            FStreamableDelegate::CreateLambda([AssetPtr, OnLoaded]()
            {
                OnLoaded(AssetPtr.Get());
            })
        );
    }

    // Async load multiple assets
    void AsyncLoadAssets(const TArray<FSoftObjectPath>& AssetPaths, TFunction<void()> OnAllLoaded)
    {
        FStreamableManager& StreamableManager = UAssetManager::GetStreamableManager();
        StreamableManager.RequestAsyncLoad(
            AssetPaths,
            FStreamableDelegate::CreateLambda([OnAllLoaded]()
            {
                OnAllLoaded();
            })
        );
    }
};
```

## Common Macros and Patterns

### Logging
```cpp
// MyGame.h
#pragma once

#include "CoreMinimal.h"

DECLARE_LOG_CATEGORY_EXTERN(LogMyGame, Log, All);

// Usage
UE_LOG(LogMyGame, Log, TEXT("Player spawned: %s"), *PlayerName);
UE_LOG(LogMyGame, Warning, TEXT("Health below 20%%"));
UE_LOG(LogMyGame, Error, TEXT("Failed to load asset: %s"), *AssetPath);
```

### Useful Macros
```cpp
// Null checks
if (!ensure(MyPointer != nullptr))
{
    return;
}

// Assertions (dev only)
check(Condition);
checkf(Condition, TEXT("Error message: %s"), *Info);

// Verify (stays in shipping)
verify(ImportantOperation());
```

---

**Remember**: Use TObjectPtr for UPROPERTY pointers in UE5.4+, prefer Enhanced Input over legacy input, use GAS for complex ability systems, leverage Subsystems for global managers, use Soft References for async loading, and always handle replication properly for multiplayer.
