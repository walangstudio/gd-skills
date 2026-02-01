---
name: roblox-style
description: Roblox Luau coding standards with strict typing. Enforces Roblox naming conventions, type annotations, and modern Luau 2025+ practices.
globs: ["*.lua", "*.luau"]
---

# Roblox Luau Style Guide

Mandatory coding standards for Roblox 2025+ projects using Luau with strict typing.

## Strict Mode (MANDATORY)

```lua
-- ✅ CORRECT - Always use strict mode
--!strict

local Players = game:GetService("Players")

-- ❌ WRONG - Missing strict mode
local Players = game:GetService("Players")
```

## Naming Conventions

### Variables and Functions
```lua
--!strict

-- ✅ CORRECT - camelCase for variables and functions
local playerHealth = 100
local maxSpeed = 16
local isAlive = true

local function calculateDamage(baseDamage: number): number
    return baseDamage * 1.5
end

local function onPlayerJoined(player: Player): ()
    print("Welcome", player.Name)
end

-- ❌ WRONG
local PlayerHealth = 100      -- PascalCase for variable
local player_health = 100     -- snake_case
local function CalculateDamage()  -- PascalCase for function
```

### Constants
```lua
--!strict

-- ✅ CORRECT - UPPER_SNAKE_CASE for constants
local MAX_HEALTH = 100
local SPAWN_DELAY = 5
local DEFAULT_WALK_SPEED = 16
local DAMAGE_MULTIPLIER = 1.5

-- ❌ WRONG
local maxHealth = 100         -- Not distinguishable as constant
local MaxHealth = 100         -- PascalCase
```

### Types and Classes
```lua
--!strict

-- ✅ CORRECT - PascalCase for types
export type PlayerData = {
    UserId: number,
    DisplayName: string,
    Level: number,
}

export type WeaponStats = {
    Damage: number,
    FireRate: number,
}

-- ✅ CORRECT - PascalCase for class-like tables
local PlayerController = {}
PlayerController.__index = PlayerController

local EnemySpawner = {}
EnemySpawner.__index = EnemySpawner

-- ❌ WRONG
export type playerData = {}   -- Should be PascalCase
local playerController = {}   -- Class should be PascalCase
```

### Services and Instances
```lua
--!strict

-- ✅ CORRECT - PascalCase for services (matches Roblox API)
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

-- ✅ CORRECT - camelCase for instance references
local player = Players.LocalPlayer
local character = player.Character
local humanoid = character:FindFirstChild("Humanoid")

-- ❌ WRONG
local players = game:GetService("Players")  -- Service should be PascalCase
local Player = Players.LocalPlayer          -- Instance ref should be camelCase
```

### Events and Signals
```lua
--!strict

-- ✅ CORRECT - PascalCase for events (Roblox convention)
local OnDamageReceived = Instance.new("BindableEvent")
local OnPlayerDied = Instance.new("BindableEvent")

-- ✅ CORRECT - camelCase for signal objects from custom Signal class
local onHealthChanged = Signal.new()
local onStateChanged = Signal.new()
```

## Type Annotations (MANDATORY)

### Function Signatures
```lua
--!strict

-- ✅ CORRECT - Full type annotations
local function takeDamage(amount: number, damageType: string?): boolean
    -- Implementation
    return true
end

local function getPlayerData(player: Player): PlayerData?
    -- Implementation
    return nil
end

local function spawnEnemy(position: Vector3, enemyType: string): Model
    -- Implementation
    return Instance.new("Model")
end

-- ✅ CORRECT - Callback types
local function onComplete(callback: (success: boolean, message: string) -> ()): ()
    callback(true, "Done")
end

-- ❌ WRONG - Missing types
local function takeDamage(amount)  -- No types!
    return true
end
```

### Variable Types
```lua
--!strict

-- ✅ CORRECT - Type annotations for clarity
local health: number = 100
local playerName: string = "Player1"
local isReady: boolean = false
local position: Vector3 = Vector3.new(0, 10, 0)

-- ✅ CORRECT - Complex types
local inventory: {string} = {}
local playerScores: {[number]: number} = {}
local enemyData: {[string]: EnemyConfig} = {}

-- ✅ CORRECT - Optional types
local target: Player? = nil
local lastPosition: Vector3? = nil

-- Type inference is OK when obvious
local count = 0  -- Clearly a number
local name = "test"  -- Clearly a string
```

### Export Types
```lua
--!strict

-- ✅ CORRECT - Export types for module interfaces
export type Config = {
    MaxHealth: number,
    WalkSpeed: number,
    JumpPower: number,
}

export type ItemData = {
    Id: string,
    Name: string,
    Description: string,
    Price: number,
    Icon: string?,
}

-- ✅ CORRECT - Generic types
export type Result<T> = {
    Success: boolean,
    Data: T?,
    Error: string?,
}

export type Signal<T...> = {
    Connect: (self: Signal<T...>, callback: (T...) -> ()) -> Connection,
    Fire: (self: Signal<T...>, T...) -> (),
}
```

## Code Organization

### Module Structure
```lua
--!strict

-- 1. Services at top
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- 2. Module imports
local Types = require(ReplicatedStorage.Modules.Types)
local Signal = require(ReplicatedStorage.Modules.Signal)

-- 3. Type aliases
type PlayerData = Types.PlayerData

-- 4. Constants
local MAX_HEALTH = 100
local RESPAWN_TIME = 5

-- 5. Module table
local PlayerService = {}

-- 6. Private state
local playerDataCache: {[number]: PlayerData} = {}

-- 7. Private functions
local function validatePlayer(player: Player): boolean
    return player and player.Parent ~= nil
end

-- 8. Public functions
function PlayerService.GetPlayerData(player: Player): PlayerData?
    return playerDataCache[player.UserId]
end

function PlayerService.Init(): ()
    -- Initialization code
end

-- 9. Return module
return PlayerService
```

### Script Types
```lua
-- Server script: *.server.lua
-- Client script: *.client.lua
-- Module script: *.lua (no suffix)

-- ✅ CORRECT naming
-- Main.server.lua (server entry point)
-- Main.client.lua (client entry point)
-- DataService.lua (module)
-- Types.lua (module)

-- ❌ WRONG
-- DataService.server.lua (modules shouldn't have .server/.client)
```

## Instance Handling

### Type-Safe Instance Access
```lua
--!strict

-- ✅ CORRECT - Type casting for known instances
local humanoid = character:FindFirstChild("Humanoid") :: Humanoid?
if humanoid then
    humanoid.Health = 100
end

-- ✅ CORRECT - WaitForChild with type cast
local rootPart = character:WaitForChild("HumanoidRootPart") :: BasePart

-- ✅ CORRECT - FindFirstChildOfClass (already typed)
local humanoid = character:FindFirstChildOfClass("Humanoid")

-- ✅ CORRECT - Safe navigation
local player = Players.LocalPlayer
local character = player.Character
if character then
    local humanoid = character:FindFirstChildOfClass("Humanoid")
    if humanoid then
        humanoid:TakeDamage(10)
    end
end

-- ❌ WRONG - Assuming instance exists
local humanoid = character.Humanoid  -- Could be nil!
humanoid:TakeDamage(10)  -- Runtime error if nil
```

### Creating Instances
```lua
--!strict

-- ✅ CORRECT - Set Parent last for performance
local part = Instance.new("Part")
part.Size = Vector3.new(4, 1, 4)
part.Position = Vector3.new(0, 10, 0)
part.Anchored = true
part.Color = Color3.fromRGB(255, 0, 0)
part.Parent = workspace  -- Parent LAST

-- ❌ WRONG - Parent first (triggers events multiple times)
local part = Instance.new("Part")
part.Parent = workspace  -- BAD: parent first
part.Size = Vector3.new(4, 1, 4)  -- Each change triggers events
```

## Error Handling

```lua
--!strict

-- ✅ CORRECT - pcall for potentially failing operations
local success, result = pcall(function()
    return dataStore:GetAsync(key)
end)

if success then
    -- Use result
else
    warn("Failed to load data:", result)
end

-- ✅ CORRECT - xpcall with error handler
local success, result = xpcall(function()
    return riskyOperation()
end, function(err)
    warn("Error:", err)
    warn(debug.traceback())
    return nil
end)

-- ✅ CORRECT - Assert for invariants
local function setHealth(health: number): ()
    assert(health >= 0, "Health cannot be negative")
    assert(health <= MAX_HEALTH, "Health cannot exceed max")
    currentHealth = health
end

-- ❌ WRONG - No error handling for DataStore
local data = dataStore:GetAsync(key)  -- Can fail!
```

## Remote Events Security

```lua
--!strict

-- ✅ CORRECT - Server-side validation
RemoteEvent.OnServerEvent:Connect(function(player: Player, itemId: string, quantity: number)
    -- Validate types
    if typeof(itemId) ~= "string" then return end
    if typeof(quantity) ~= "number" then return end

    -- Validate values
    if quantity <= 0 or quantity > 99 then return end
    if not isValidItemId(itemId) then return end

    -- Validate player state
    local playerData = DataService.GetPlayerData(player)
    if not playerData then return end

    -- Process request
    processItemRequest(player, itemId, quantity)
end)

-- ✅ CORRECT - Rate limiting
local lastRequest: {[number]: number} = {}
local COOLDOWN = 0.5

RemoteEvent.OnServerEvent:Connect(function(player: Player, ...)
    local now = os.clock()
    local last = lastRequest[player.UserId] or 0

    if now - last < COOLDOWN then
        return -- Rate limited
    end
    lastRequest[player.UserId] = now

    -- Process request
end)

-- ❌ WRONG - Trusting client data
RemoteEvent.OnServerEvent:Connect(function(player, damage)
    target:TakeDamage(damage)  -- Client controls damage!
end)
```

## Common Anti-Patterns

```lua
--!strict

-- ❌ WRONG - wait() deprecated
wait(1)

-- ✅ CORRECT - Use task library
task.wait(1)

-- ❌ WRONG - spawn() deprecated
spawn(function()
    -- code
end)

-- ✅ CORRECT - Use task.spawn
task.spawn(function()
    -- code
end)

-- ❌ WRONG - delay() deprecated
delay(1, function()
    -- code
end)

-- ✅ CORRECT - Use task.delay
task.delay(1, function()
    -- code
end)

-- ❌ WRONG - Busy waiting
while not condition do
    task.wait()
end

-- ✅ CORRECT - Event-based waiting
local event = Instance.new("BindableEvent")
event.Event:Wait()

-- ❌ WRONG - Global variables
_G.playerData = {}

-- ✅ CORRECT - Module-scoped state
local PlayerModule = {}
local playerData = {}  -- Private to module

-- ❌ WRONG - String concatenation in loops
local result = ""
for i = 1, 1000 do
    result = result .. tostring(i)  -- Creates new string each time
end

-- ✅ CORRECT - Use table.concat
local parts = {}
for i = 1, 1000 do
    parts[i] = tostring(i)
end
local result = table.concat(parts)
```

## Memory Management

```lua
--!strict

-- ✅ CORRECT - Disconnect events when done
local connection: RBXScriptConnection
connection = RunService.Heartbeat:Connect(function(dt)
    -- Update logic
end)

-- Later, when cleaning up:
connection:Disconnect()

-- ✅ CORRECT - Clean up on player leaving
Players.PlayerRemoving:Connect(function(player)
    playerData[player.UserId] = nil
    playerConnections[player.UserId]:Disconnect()
    playerConnections[player.UserId] = nil
end)

-- ✅ CORRECT - Use Janitor/Maid pattern for complex cleanup
local janitor = Janitor.new()
janitor:Add(connection, "Disconnect")
janitor:Add(instance, "Destroy")

-- Clean everything at once
janitor:Destroy()
```

## Performance

```lua
--!strict

-- ✅ CORRECT - Cache service references
local RunService = game:GetService("RunService")  -- Once at top

-- ❌ WRONG - Getting service every frame
RunService.Heartbeat:Connect(function()
    local Players = game:GetService("Players")  -- BAD: every frame
end)

-- ✅ CORRECT - Use local variables
local sqrt = math.sqrt
local insert = table.insert

-- ✅ CORRECT - Batch instance operations
workspace:BulkMoveTo(parts, cframes, Enum.BulkMoveMode.FireCFrameChanged)

-- ✅ CORRECT - Object pooling for frequently created objects
local bulletPool: {BasePart} = {}

local function getBullet(): BasePart
    if #bulletPool > 0 then
        return table.remove(bulletPool) :: BasePart
    end
    return createBullet()
end

local function returnBullet(bullet: BasePart): ()
    bullet.Parent = nil
    table.insert(bulletPool, bullet)
end
```

## Summary

| Element | Convention | Example |
|---------|------------|---------|
| Variables | camelCase | `playerHealth` |
| Functions | camelCase | `calculateDamage()` |
| Constants | UPPER_SNAKE_CASE | `MAX_HEALTH` |
| Types | PascalCase | `PlayerData` |
| Classes/Modules | PascalCase | `PlayerController` |
| Services | PascalCase | `Players`, `RunService` |
| Booleans | is/has/can prefix | `isAlive`, `hasWeapon` |

---

**Key Rules**:
1. Always use `--!strict` mode
2. Type ALL function parameters and returns
3. Validate ALL remote event data on server
4. Use `task.*` instead of deprecated `wait/spawn/delay`
5. Set Parent LAST when creating instances
6. Disconnect events when no longer needed
7. Use `pcall` for operations that can fail
