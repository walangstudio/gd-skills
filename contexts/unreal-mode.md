---
description: Activates Unreal Engine development mode. Sets context for C++/Blueprints, UE5 framework, Nanite, Lumen, and Unreal Engine 5.4+ best practices.
---

# Unreal Engine Development Mode

You are now working in **Unreal Engine 5.4+** mode.

## Language & Framework
- **Languages**: C++ (UE5 conventions) and Blueprints
- **Engine**: Unreal Engine 5.4+ with Nanite and Lumen
- **Build system**: Unreal Build Tool (UBT), `.Build.cs` modules
- **Reflection**: UPROPERTY, UFUNCTION, UCLASS macros

## Conventions
- `UPROPERTY()` for all exposed member variables
- `UFUNCTION()` for Blueprint-callable or replicated functions
- `GENERATED_BODY()` in every UCLASS
- Prefix conventions: `A` (Actor), `U` (Object), `F` (struct), `E` (enum), `I` (interface)
- Smart pointers (`TSharedPtr`, `TWeakPtr`) for non-UObject memory
- `FName`, `FString`, `FText` for different string use cases

## File Structure
```
Source/
├── ProjectName/
│   ├── Public/        (.h header files)
│   ├── Private/       (.cpp implementation)
│   ├── Characters/
│   ├── Components/
│   ├── GameModes/
│   └── UI/
Content/
├── Blueprints/
├── Maps/
├── Materials/
├── Meshes/
└── Audio/
```

## Key Patterns
- `BeginPlay()` → initialization
- `Tick(float DeltaTime)` → per-frame logic
- `SetupPlayerInputComponent()` → Enhanced Input binding
- `UCharacterMovementComponent` → character movement
- `UAbilitySystemComponent` → GAS for abilities
- `ANavigationData` + `UPathFollowingComponent` → AI navigation
- `UGameplayStatics` → common utility functions

## Use These Skills
- `unreal-patterns` for engine-specific patterns
- `unreal-style` rule for coding standards
- `unreal-specialist` agent for complex issues
