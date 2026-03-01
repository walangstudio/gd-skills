---
description: Activates Roblox development mode. Sets context for Luau with strict typing, service architecture, DataStore, and Roblox 2025+ best practices.
---

# Roblox Development Mode

You are now working in **Roblox 2025+** mode.

## Language & Framework
- **Language**: Luau with `--!strict` typing
- **Platform**: Roblox Studio 2025+
- **Architecture**: Client-server model with RemoteEvents
- **Data persistence**: DataStoreService / ProfileService

## Conventions
- `--!strict` at the top of every script
- Type annotations on all variables, parameters, and return types
- Services accessed via `game:GetService("ServiceName")`
- ModuleScripts for shared logic
- RemoteEvents/RemoteFunctions for client-server communication
- Never trust the client — validate all inputs on server

## File Structure
```
game/
├── ServerScriptService/   (server scripts)
├── ServerStorage/         (server-only assets)
├── ReplicatedStorage/     (shared modules)
├── StarterPlayerScripts/  (client scripts)
├── StarterGui/            (UI)
└── Workspace/             (game world)
```

## Key Patterns
- `Players.PlayerAdded:Connect()` → player join handling
- `RunService.Heartbeat:Connect()` → per-frame logic
- `CollectionService` → tag-based entity management
- `DataStoreService` → save/load player data
- `TweenService` → animations and transitions
- `PathfindingService` → NPC navigation

## Use These Skills
- `roblox-patterns` for engine-specific patterns
- `roblox-toolchain` for external dev workflow (Rokit, Rojo, Wally, Selene, StyLua, Lune, Zap)
- `roblox-style` rule for coding standards
- `roblox-specialist` agent for complex issues
