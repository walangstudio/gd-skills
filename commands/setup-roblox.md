---
description: Set up a Roblox Studio project with proper service architecture, ModuleScript organization, RemoteEvent networking, and DataStore persistence.
---

# Setup Roblox Command

## What This Command Does

Creates a complete Roblox Studio project structure:
- Service-based architecture (ServerScriptService, ReplicatedStorage)
- ModuleScript templates (GameManager, DataManager, UIManager)
- RemoteEvent/RemoteFunction setup for client-server communication
- DataStore configuration for player persistence
- Proper security model (server authority)

## Folder Structure Created

```
game/
├── ServerScriptService/
│   ├── GameServer.server.lua        # Main server script
│   ├── DataManager.module.lua       # DataStore persistence
│   └── Services/
│       ├── CombatService.module.lua
│       └── InventoryService.module.lua
├── ReplicatedStorage/
│   ├── Modules/
│   │   ├── GameConfig.module.lua    # Shared constants
│   │   └── Utils.module.lua         # Shared utilities
│   ├── Remotes/                     # RemoteEvents folder
│   │   ├── CombatRemotes
│   │   └── UIRemotes
│   └── Assets/
│       ├── Models/
│       └── Sounds/
├── StarterGui/
│   ├── MainMenu.lua
│   ├── HUD.lua
│   └── SettingsUI.lua
├── StarterPlayerScripts/
│   ├── PlayerController.client.lua
│   └── CameraController.client.lua
├── Workspace/
│   └── Maps/
└── ServerStorage/
    └── Templates/                   # Server-only assets
```

## Key Patterns

### Client-Server Communication
```lua
-- Server: ServerScriptService/GameServer.server.lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local remotes = ReplicatedStorage:WaitForChild("Remotes")

remotes.CombatRemotes.AttackRequest.OnServerEvent:Connect(function(player, targetId)
    -- Validate and process on server
end)

-- Client: StarterPlayerScripts/PlayerController.client.lua
local remotes = game:GetService("ReplicatedStorage"):WaitForChild("Remotes")
remotes.CombatRemotes.AttackRequest:FireServer(targetId)
```

### DataStore Persistence
```lua
-- ServerScriptService/DataManager.module.lua
local DataStoreService = game:GetService("DataStoreService")
local playerStore = DataStoreService:GetDataStore("PlayerData")

local DataManager = {}

function DataManager:LoadPlayer(player: Player)
    local key = "Player_" .. player.UserId
    local data = playerStore:GetAsync(key) or { coins = 0, level = 1 }
    return data
end

function DataManager:SavePlayer(player: Player, data)
    local key = "Player_" .. player.UserId
    playerStore:SetAsync(key, data)
end

return DataManager
```

## Usage

```
User: /setup-roblox

Agent: Setting up Roblox project structure...

1. Creating service folders
2. Setting up ModuleScripts
3. Configuring RemoteEvents
4. Adding DataStore template
5. Creating StarterGui templates

Done! Open in Roblox Studio and start building.
```

## Next Steps
- Open the place file in Roblox Studio
- Configure game settings (Players, Lighting)
- Use `/create-game` to add gameplay systems
- Test with Play Solo and Play (server + client)

---

**Set up your Roblox project!** Run `/setup-roblox` to get started.
