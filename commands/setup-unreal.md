---
description: Set up Unreal Engine C++ project structure with proper module layout, game framework classes, and common gameplay systems.
---

# Setup Unreal Command

## What This Command Does

Creates a properly structured Unreal Engine project:
- ✅ Module and folder structure
- ✅ Game framework classes (GameMode, GameState, PlayerController)
- ✅ Common gameplay components (Health, Inventory)
- ✅ Input mapping context and actions
- ✅ Build configuration
- ✅ .gitignore for Unreal

## Folder Structure Created

```
Source/ProjectName/
├── Core/
│   ├── ProjectNameGameMode.h/cpp
│   ├── ProjectNameGameState.h/cpp
│   ├── ProjectNamePlayerController.h/cpp
│   └── ProjectNameGameInstance.h/cpp
├── Player/
│   ├── PlayerCharacter.h/cpp
│   └── PlayerAnimInstance.h/cpp
├── Enemies/
│   ├── EnemyBase.h/cpp
│   └── EnemyAIController.h/cpp
├── Components/
│   ├── HealthComponent.h/cpp
│   └── InteractionComponent.h/cpp
├── UI/
│   ├── HUDWidget.h/cpp
│   └── MainMenuWidget.h/cpp
└── Utils/
Content/
├── Blueprints/
├── Maps/
├── Materials/
├── Meshes/
├── Audio/
├── UI/
├── Input/
│   └── IMC_Default, IA_Move, IA_Look, etc.
└── VFX/
```

## Usage

```
User: /setup-unreal

Agent: Setting up Unreal project! What type?
→ Third-person action
→ First-person shooter
→ Top-down strategy

[Creating project structure...]

✅ Unreal project structure ready! Open in UE 5.3+
```

---

**Set up your Unreal project!** Run `/setup-unreal` to get started.
