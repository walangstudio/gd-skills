---
description: Set up a new Unity project with proper structure, managers, input system, audio mixers, and assembly definitions. Quick-start for any Unity game.
---

# Setup Unity Command

## What This Command Does

Creates a properly structured Unity project layout:
- ✅ Folder structure (Scripts, Scenes, Prefabs, etc.)
- ✅ Manager singletons (GameManager, AudioManager, UIManager)
- ✅ New Input System setup with common actions
- ✅ Audio mixer with groups (Master, Music, SFX, UI)
- ✅ Assembly definitions for faster compilation
- ✅ .gitignore and .gitattributes for Unity

## Folder Structure Created

```
Assets/
├── _Project/
│   ├── Scripts/
│   │   ├── Core/
│   │   │   ├── GameManager.cs
│   │   │   ├── AudioManager.cs
│   │   │   └── SceneLoader.cs
│   │   ├── Player/
│   │   ├── Enemies/
│   │   ├── UI/
│   │   └── Utils/
│   ├── Scenes/
│   │   ├── MainMenu.unity
│   │   ├── Game.unity
│   │   └── Loading.unity
│   ├── Prefabs/
│   │   ├── Player/
│   │   ├── Enemies/
│   │   ├── UI/
│   │   └── Effects/
│   ├── Art/
│   │   ├── Sprites/
│   │   ├── Materials/
│   │   └── Animations/
│   ├── Audio/
│   │   ├── Music/
│   │   ├── SFX/
│   │   └── Mixers/
│   ├── Input/
│   │   └── GameInput.inputactions
│   └── Resources/
├── .gitignore
└── .gitattributes
```

## Usage

```
User: /setup-unity

Agent: Setting up Unity project! What type?
→ 2D Game (URP)
→ 3D Game (URP)
→ 3D Game (HDRP)

[Creating project structure...]

✅ Unity project structure ready! Open in Unity 2022.3+
```

---

**Set up your Unity project!** Run `/setup-unity` to get started.
