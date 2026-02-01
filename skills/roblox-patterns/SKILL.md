---
name: roblox-patterns
description: Roblox 2025+ best practices and common patterns. Use for Luau architecture, client-server communication, DataStores, ModuleScripts, and Roblox-specific design patterns.
---

# Roblox Patterns

Production-ready Roblox 2025+ patterns covering Luau with strict typing, client-server architecture, data persistence, and modern Roblox development.

## When to Use

- Building games on Roblox 2025+
- Need client-server architecture guidance
- Implementing DataStore persistence
- Creating ModuleScript systems
- Setting up proper project structure

## Project Structure

### Recommended Organization
```
game/
├── ReplicatedStorage/           # Shared between client and server
│   ├── Modules/                 # Shared ModuleScripts
│   │   ├── Types.lua           # Type definitions
│   │   ├── Config.lua          # Game configuration
│   │   └── Utils.lua           # Utility functions
│   ├── Assets/                  # Models, animations, sounds
│   └── Events/                  # RemoteEvents, RemoteFunctions
│       ├── GameEvents/
│       └── PlayerEvents/
├── ServerScriptService/         # Server-only scripts
│   ├── Services/               # Server services (singletons)
│   │   ├── DataService.lua
│   │   ├── MatchService.lua
│   │   └── ShopService.lua
│   ├── Components/             # Server-side components
│   └── Main.server.lua         # Server entry point
├── ServerStorage/               # Server-only assets
│   ├── Modules/                # Server-only modules
│   └── Assets/                 # Server-side models
├── StarterPlayerScripts/        # Client scripts
│   ├── Controllers/            # Client controllers
│   │   ├── InputController.lua
│   │   └── UIController.lua
│   └── Main.client.lua         # Client entry point
├── StarterGui/                  # UI
│   ├── MainMenu/
│   ├── HUD/
│   └── Shop/
└── Workspace/                   # Game world
    ├── Map/
    ├── Spawns/
    └── Interactables/
```

## Type Definitions (Strict Mode)

### Types Module
```lua
-- ReplicatedStorage/Modules/Types.lua
--!strict

export type PlayerData = {
    UserId: number,
    DisplayName: string,
    Coins: number,
    Experience: number,
    Level: number,
    Inventory: {string},
    Settings: PlayerSettings,
}

export type PlayerSettings = {
    MusicVolume: number,
    SFXVolume: number,
    ShowDamageNumbers: boolean,
}

export type WeaponData = {
    Id: string,
    Name: string,
    Damage: number,
    FireRate: number,
    ReloadTime: number,
    MaxAmmo: number,
}

export type EnemyData = {
    Id: string,
    Name: string,
    Health: number,
    Speed: number,
    Damage: number,
    LootTable: {LootEntry},
}

export type LootEntry = {
    ItemId: string,
    Weight: number,
    MinAmount: number,
    MaxAmount: number,
}

return {}
```

## Service Pattern (Server)

### Base Service Structure
```lua
-- ServerScriptService/Services/DataService.lua
--!strict

local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Types = require(ReplicatedStorage.Modules.Types)

type PlayerData = Types.PlayerData

local DataService = {}
DataService.__index = DataService

-- Private state
local playerDataCache: {[number]: PlayerData} = {}
local dataStore = DataStoreService:GetDataStore("PlayerData_v1")

-- Default data template
local DEFAULT_DATA: PlayerData = {
    UserId = 0,
    DisplayName = "",
    Coins = 0,
    Experience = 0,
    Level = 1,
    Inventory = {},
    Settings = {
        MusicVolume = 0.5,
        SFXVolume = 0.5,
        ShowDamageNumbers = true,
    },
}

-- Initialize service
function DataService.Init(): ()
    Players.PlayerAdded:Connect(function(player)
        DataService.LoadPlayerData(player)
    end)

    Players.PlayerRemoving:Connect(function(player)
        DataService.SavePlayerData(player)
        playerDataCache[player.UserId] = nil
    end)

    -- Auto-save loop
    task.spawn(function()
        while true do
            task.wait(300) -- Save every 5 minutes
            DataService.SaveAllPlayers()
        end
    end)
end

-- Load player data
function DataService.LoadPlayerData(player: Player): PlayerData
    local userId = player.UserId
    local success, data = pcall(function()
        return dataStore:GetAsync("Player_" .. userId)
    end)

    local playerData: PlayerData
    if success and data then
        playerData = data :: PlayerData
    else
        playerData = table.clone(DEFAULT_DATA)
        playerData.UserId = userId
        playerData.DisplayName = player.DisplayName
    end

    playerDataCache[userId] = playerData
    return playerData
end

-- Save player data
function DataService.SavePlayerData(player: Player): boolean
    local userId = player.UserId
    local data = playerDataCache[userId]
    if not data then return false end

    local success, err = pcall(function()
        dataStore:SetAsync("Player_" .. userId, data)
    end)

    if not success then
        warn("Failed to save data for", player.Name, ":", err)
    end

    return success
end

-- Save all players
function DataService.SaveAllPlayers(): ()
    for _, player in Players:GetPlayers() do
        DataService.SavePlayerData(player)
    end
end

-- Get player data (cached)
function DataService.GetPlayerData(player: Player): PlayerData?
    return playerDataCache[player.UserId]
end

-- Update player data
function DataService.UpdatePlayerData(player: Player, callback: (PlayerData) -> ()): ()
    local data = playerDataCache[player.UserId]
    if data then
        callback(data)
    end
end

return DataService
```

### Game Service Example
```lua
-- ServerScriptService/Services/CombatService.lua
--!strict

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local Types = require(ReplicatedStorage.Modules.Types)
local DataService = require(script.Parent.DataService)

type WeaponData = Types.WeaponData

local CombatService = {}

-- Remote events
local Events = ReplicatedStorage:WaitForChild("Events")
local AttackEvent = Events:WaitForChild("Attack") :: RemoteEvent
local DamageEvent = Events:WaitForChild("Damage") :: RemoteEvent

-- Weapon registry
local weapons: {[string]: WeaponData} = {}

function CombatService.Init(): ()
    -- Register weapons
    CombatService.RegisterWeapon({
        Id = "sword_basic",
        Name = "Basic Sword",
        Damage = 25,
        FireRate = 1.5,
        ReloadTime = 0,
        MaxAmmo = 0,
    })

    -- Handle attack requests
    AttackEvent.OnServerEvent:Connect(function(player, targetId)
        CombatService.HandleAttack(player, targetId)
    end)
end

function CombatService.RegisterWeapon(data: WeaponData): ()
    weapons[data.Id] = data
end

function CombatService.HandleAttack(attacker: Player, targetId: number): ()
    -- Validate target
    local target = Players:GetPlayerByUserId(targetId)
    if not target then return end

    local attackerChar = attacker.Character
    local targetChar = target.Character
    if not attackerChar or not targetChar then return end

    -- Distance check
    local attackerRoot = attackerChar:FindFirstChild("HumanoidRootPart") :: BasePart?
    local targetRoot = targetChar:FindFirstChild("HumanoidRootPart") :: BasePart?
    if not attackerRoot or not targetRoot then return end

    local distance = (attackerRoot.Position - targetRoot.Position).Magnitude
    if distance > 10 then return end -- Too far

    -- Apply damage
    local damage = 25 -- Get from equipped weapon
    CombatService.ApplyDamage(target, damage, attacker)
end

function CombatService.ApplyDamage(target: Player, damage: number, source: Player?): ()
    local character = target.Character
    if not character then return end

    local humanoid = character:FindFirstChild("Humanoid") :: Humanoid?
    if not humanoid then return end

    humanoid:TakeDamage(damage)

    -- Notify clients
    DamageEvent:FireAllClients(target.UserId, damage)
end

return CombatService
```

## Controller Pattern (Client)

### Input Controller
```lua
-- StarterPlayerScripts/Controllers/InputController.lua
--!strict

local UserInputService = game:GetService("UserInputService")
local ContextActionService = game:GetService("ContextActionService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local InputController = {}

-- Input state
local inputState = {
    moveDirection = Vector3.zero,
    isJumping = false,
    isSprinting = false,
}

-- Keybinds
local KEYBINDS = {
    Jump = {Enum.KeyCode.Space},
    Sprint = {Enum.KeyCode.LeftShift},
    Attack = {Enum.UserInputType.MouseButton1},
    Interact = {Enum.KeyCode.E},
    Inventory = {Enum.KeyCode.I},
}

-- Events
local Events = ReplicatedStorage:WaitForChild("Events")
local AttackEvent = Events:WaitForChild("Attack") :: RemoteEvent

function InputController.Init(): ()
    -- Bind actions
    ContextActionService:BindAction("Jump", InputController.OnJump, false, table.unpack(KEYBINDS.Jump))
    ContextActionService:BindAction("Sprint", InputController.OnSprint, false, table.unpack(KEYBINDS.Sprint))
    ContextActionService:BindAction("Attack", InputController.OnAttack, false, table.unpack(KEYBINDS.Attack))
    ContextActionService:BindAction("Interact", InputController.OnInteract, false, table.unpack(KEYBINDS.Interact))

    -- Movement input
    UserInputService.InputBegan:Connect(InputController.OnInputBegan)
    UserInputService.InputEnded:Connect(InputController.OnInputEnded)
end

function InputController.OnJump(actionName: string, inputState: Enum.UserInputState): Enum.ContextActionResult
    if inputState == Enum.UserInputState.Begin then
        local player = game:GetService("Players").LocalPlayer
        local character = player.Character
        if character then
            local humanoid = character:FindFirstChild("Humanoid") :: Humanoid?
            if humanoid then
                humanoid.Jump = true
            end
        end
    end
    return Enum.ContextActionResult.Sink
end

function InputController.OnSprint(actionName: string, state: Enum.UserInputState): Enum.ContextActionResult
    inputState.isSprinting = state == Enum.UserInputState.Begin
    InputController.UpdateMovementSpeed()
    return Enum.ContextActionResult.Sink
end

function InputController.OnAttack(actionName: string, state: Enum.UserInputState): Enum.ContextActionResult
    if state == Enum.UserInputState.Begin then
        -- Get target under cursor
        local target = InputController.GetTargetUnderCursor()
        if target then
            AttackEvent:FireServer(target.UserId)
        end
    end
    return Enum.ContextActionResult.Sink
end

function InputController.OnInteract(actionName: string, state: Enum.UserInputState): Enum.ContextActionResult
    if state == Enum.UserInputState.Begin then
        InputController.TryInteract()
    end
    return Enum.ContextActionResult.Sink
end

function InputController.OnInputBegan(input: InputObject, gameProcessed: boolean): ()
    if gameProcessed then return end
    -- Handle additional inputs
end

function InputController.OnInputEnded(input: InputObject, gameProcessed: boolean): ()
    if gameProcessed then return end
    -- Handle input release
end

function InputController.UpdateMovementSpeed(): ()
    local player = game:GetService("Players").LocalPlayer
    local character = player.Character
    if not character then return end

    local humanoid = character:FindFirstChild("Humanoid") :: Humanoid?
    if humanoid then
        humanoid.WalkSpeed = inputState.isSprinting and 24 or 16
    end
end

function InputController.GetTargetUnderCursor(): Player?
    local mouse = game:GetService("Players").LocalPlayer:GetMouse()
    local target = mouse.Target
    if target then
        local character = target:FindFirstAncestorOfClass("Model")
        if character then
            local player = game:GetService("Players"):GetPlayerFromCharacter(character)
            return player
        end
    end
    return nil
end

function InputController.TryInteract(): ()
    -- Find nearest interactable
    local player = game:GetService("Players").LocalPlayer
    local character = player.Character
    if not character then return end

    local root = character:FindFirstChild("HumanoidRootPart") :: BasePart?
    if not root then return end

    -- Find interactables in range
    local interactables = workspace:FindFirstChild("Interactables")
    if not interactables then return end

    local nearest: BasePart? = nil
    local nearestDist = 5 -- Max interact distance

    for _, obj in interactables:GetChildren() do
        if obj:IsA("BasePart") then
            local dist = (obj.Position - root.Position).Magnitude
            if dist < nearestDist then
                nearest = obj
                nearestDist = dist
            end
        end
    end

    if nearest then
        -- Fire interact event
        local InteractEvent = ReplicatedStorage.Events:FindFirstChild("Interact") :: RemoteEvent?
        if InteractEvent then
            InteractEvent:FireServer(nearest)
        end
    end
end

return InputController
```

## Remote Events Pattern

### Event Setup
```lua
-- ServerScriptService/SetupEvents.server.lua
--!strict

local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Create events folder
local Events = Instance.new("Folder")
Events.Name = "Events"
Events.Parent = ReplicatedStorage

-- Game events
local gameEvents = {
    "Attack",
    "Damage",
    "Interact",
    "SpawnEnemy",
    "EnemyDied",
}

for _, eventName in gameEvents do
    local event = Instance.new("RemoteEvent")
    event.Name = eventName
    event.Parent = Events
end

-- Player events
local playerEvents = {
    "UpdateStats",
    "UpdateInventory",
    "Notification",
}

for _, eventName in playerEvents do
    local event = Instance.new("RemoteEvent")
    event.Name = eventName
    event.Parent = Events
end

-- Remote functions (for request/response)
local functions = {
    "GetShopItems",
    "PurchaseItem",
    "GetLeaderboard",
}

for _, funcName in functions do
    local func = Instance.new("RemoteFunction")
    func.Name = funcName
    func.Parent = Events
end
```

### Secure Remote Handling
```lua
-- Server-side validation
--!strict

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Events = ReplicatedStorage:WaitForChild("Events")

local PurchaseItem = Events:WaitForChild("PurchaseItem") :: RemoteFunction

-- Rate limiting
local lastPurchase: {[number]: number} = {}
local PURCHASE_COOLDOWN = 1

PurchaseItem.OnServerInvoke = function(player: Player, itemId: string): (boolean, string)
    -- Rate limit check
    local now = os.clock()
    local last = lastPurchase[player.UserId] or 0
    if now - last < PURCHASE_COOLDOWN then
        return false, "Please wait before purchasing again"
    end
    lastPurchase[player.UserId] = now

    -- Validate item exists
    local item = ShopService.GetItem(itemId)
    if not item then
        return false, "Item not found"
    end

    -- Check player has enough currency
    local playerData = DataService.GetPlayerData(player)
    if not playerData then
        return false, "Data not loaded"
    end

    if playerData.Coins < item.Price then
        return false, "Not enough coins"
    end

    -- Process purchase
    DataService.UpdatePlayerData(player, function(data)
        data.Coins -= item.Price
        table.insert(data.Inventory, itemId)
    end)

    return true, "Purchase successful"
end
```

## Object Pooling

```lua
-- ReplicatedStorage/Modules/ObjectPool.lua
--!strict

export type ObjectPool<T> = {
    Get: (self: ObjectPool<T>) -> T,
    Return: (self: ObjectPool<T>, object: T) -> (),
    Clear: (self: ObjectPool<T>) -> (),
}

local ObjectPool = {}
ObjectPool.__index = ObjectPool

function ObjectPool.new<T>(createFunc: () -> T, resetFunc: (T) -> (), initialSize: number?): ObjectPool<T>
    local self = setmetatable({}, ObjectPool)

    self._createFunc = createFunc
    self._resetFunc = resetFunc
    self._pool = {} :: {T}
    self._active = {} :: {T}

    -- Pre-populate pool
    local size = initialSize or 10
    for _ = 1, size do
        local obj = createFunc()
        table.insert(self._pool, obj)
    end

    return self :: any
end

function ObjectPool:Get<T>(): T
    local obj: T
    if #self._pool > 0 then
        obj = table.remove(self._pool) :: T
    else
        obj = self._createFunc()
    end

    table.insert(self._active, obj)
    return obj
end

function ObjectPool:Return<T>(object: T): ()
    local index = table.find(self._active, object)
    if index then
        table.remove(self._active, index)
        self._resetFunc(object)
        table.insert(self._pool, object)
    end
end

function ObjectPool:Clear(): ()
    for _, obj in self._active do
        self._resetFunc(obj)
        table.insert(self._pool, obj)
    end
    table.clear(self._active)
end

return ObjectPool

-- Usage example:
--[[
local bulletPool = ObjectPool.new(
    function()
        local bullet = Instance.new("Part")
        bullet.Size = Vector3.new(0.2, 0.2, 1)
        bullet.Anchored = true
        bullet.CanCollide = false
        return bullet
    end,
    function(bullet)
        bullet.Parent = nil
        bullet.CFrame = CFrame.new(0, -1000, 0)
    end,
    50
)

local bullet = bulletPool:Get()
bullet.CFrame = spawnCFrame
bullet.Parent = workspace

task.delay(2, function()
    bulletPool:Return(bullet)
end)
]]
```

## Signal/Event System

```lua
-- ReplicatedStorage/Modules/Signal.lua
--!strict

export type Connection = {
    Disconnect: (self: Connection) -> (),
    Connected: boolean,
}

export type Signal<T...> = {
    Connect: (self: Signal<T...>, callback: (T...) -> ()) -> Connection,
    Once: (self: Signal<T...>, callback: (T...) -> ()) -> Connection,
    Fire: (self: Signal<T...>, T...) -> (),
    Wait: (self: Signal<T...>) -> T...,
    DisconnectAll: (self: Signal<T...>) -> (),
}

local Signal = {}
Signal.__index = Signal

function Signal.new<T...>(): Signal<T...>
    local self = setmetatable({}, Signal)
    self._connections = {} :: {(T...) -> ()}
    self._waiting = {} :: {thread}
    return self :: any
end

function Signal:Connect<T...>(callback: (T...) -> ()): Connection
    table.insert(self._connections, callback)

    local connection = {
        Connected = true,
        Disconnect = function(conn)
            if not conn.Connected then return end
            conn.Connected = false
            local index = table.find(self._connections, callback)
            if index then
                table.remove(self._connections, index)
            end
        end,
    }

    return connection
end

function Signal:Once<T...>(callback: (T...) -> ()): Connection
    local connection: Connection
    connection = self:Connect(function(...)
        connection:Disconnect()
        callback(...)
    end)
    return connection
end

function Signal:Fire<T...>(...: T...): ()
    for _, callback in self._connections do
        task.spawn(callback, ...)
    end

    for _, thread in self._waiting do
        task.spawn(thread, ...)
    end
    table.clear(self._waiting)
end

function Signal:Wait<T...>(): T...
    local thread = coroutine.running()
    table.insert(self._waiting, thread)
    return coroutine.yield()
end

function Signal:DisconnectAll(): ()
    table.clear(self._connections)
    table.clear(self._waiting)
end

return Signal
```

## State Machine

```lua
-- ReplicatedStorage/Modules/StateMachine.lua
--!strict

local Signal = require(script.Parent.Signal)

export type State = {
    Name: string,
    Enter: ((any) -> ())?,
    Update: ((any, number) -> ())?,
    Exit: ((any) -> ())?,
}

export type StateMachine = {
    CurrentState: State?,
    OnStateChanged: Signal.Signal<string, string>,
    AddState: (self: StateMachine, state: State) -> (),
    SetState: (self: StateMachine, stateName: string) -> (),
    Update: (self: StateMachine, dt: number) -> (),
}

local StateMachine = {}
StateMachine.__index = StateMachine

function StateMachine.new(owner: any): StateMachine
    local self = setmetatable({}, StateMachine)

    self._owner = owner
    self._states = {} :: {[string]: State}
    self.CurrentState = nil :: State?
    self.OnStateChanged = Signal.new()

    return self :: any
end

function StateMachine:AddState(state: State): ()
    self._states[state.Name] = state
end

function StateMachine:SetState(stateName: string): ()
    local newState = self._states[stateName]
    if not newState then
        warn("State not found:", stateName)
        return
    end

    local oldStateName = if self.CurrentState then self.CurrentState.Name else "None"

    -- Exit current state
    if self.CurrentState and self.CurrentState.Exit then
        self.CurrentState.Exit(self._owner)
    end

    -- Enter new state
    self.CurrentState = newState
    if newState.Enter then
        newState.Enter(self._owner)
    end

    self.OnStateChanged:Fire(oldStateName, stateName)
end

function StateMachine:Update(dt: number): ()
    if self.CurrentState and self.CurrentState.Update then
        self.CurrentState.Update(self._owner, dt)
    end
end

return StateMachine

-- Usage:
--[[
local sm = StateMachine.new(enemy)

sm:AddState({
    Name = "Idle",
    Enter = function(owner)
        owner.Humanoid.WalkSpeed = 0
    end,
    Update = function(owner, dt)
        if owner:CanSeePlayer() then
            owner.StateMachine:SetState("Chase")
        end
    end,
})

sm:AddState({
    Name = "Chase",
    Enter = function(owner)
        owner.Humanoid.WalkSpeed = 16
    end,
    Update = function(owner, dt)
        local target = owner:GetTarget()
        if target then
            owner.Humanoid:MoveTo(target.Position)
        end
    end,
})

sm:SetState("Idle")
]]
```

## Tween Utilities

```lua
-- ReplicatedStorage/Modules/TweenUtils.lua
--!strict

local TweenService = game:GetService("TweenService")

local TweenUtils = {}

function TweenUtils.TweenModel(model: Model, targetCFrame: CFrame, duration: number, easingStyle: Enum.EasingStyle?): Tween
    local primaryPart = model.PrimaryPart
    assert(primaryPart, "Model must have a PrimaryPart")

    local tweenInfo = TweenInfo.new(
        duration,
        easingStyle or Enum.EasingStyle.Quad,
        Enum.EasingDirection.Out
    )

    local cframeValue = Instance.new("CFrameValue")
    cframeValue.Value = primaryPart.CFrame

    cframeValue.Changed:Connect(function()
        model:PivotTo(cframeValue.Value)
    end)

    local tween = TweenService:Create(cframeValue, tweenInfo, {Value = targetCFrame})

    tween.Completed:Connect(function()
        cframeValue:Destroy()
    end)

    tween:Play()
    return tween
end

function TweenUtils.FadeGui(gui: GuiObject, targetTransparency: number, duration: number): Tween
    local tweenInfo = TweenInfo.new(duration, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)

    local properties = {}

    if gui:IsA("Frame") or gui:IsA("TextLabel") or gui:IsA("TextButton") then
        properties.BackgroundTransparency = targetTransparency
    end

    if gui:IsA("TextLabel") or gui:IsA("TextButton") or gui:IsA("TextBox") then
        properties.TextTransparency = targetTransparency
    end

    if gui:IsA("ImageLabel") or gui:IsA("ImageButton") then
        properties.ImageTransparency = targetTransparency
    end

    local tween = TweenService:Create(gui, tweenInfo, properties)
    tween:Play()
    return tween
end

function TweenUtils.Shake(object: BasePart | GuiObject, intensity: number, duration: number): ()
    local originalCFrame: CFrame?
    local originalPosition: UDim2?

    if object:IsA("BasePart") then
        originalCFrame = object.CFrame
    elseif object:IsA("GuiObject") then
        originalPosition = object.Position
    end

    local elapsed = 0
    local connection: RBXScriptConnection

    connection = game:GetService("RunService").Heartbeat:Connect(function(dt)
        elapsed += dt
        if elapsed >= duration then
            connection:Disconnect()
            if object:IsA("BasePart") and originalCFrame then
                object.CFrame = originalCFrame
            elseif object:IsA("GuiObject") and originalPosition then
                object.Position = originalPosition
            end
            return
        end

        local progress = elapsed / duration
        local currentIntensity = intensity * (1 - progress)

        local offsetX = (math.random() - 0.5) * 2 * currentIntensity
        local offsetY = (math.random() - 0.5) * 2 * currentIntensity

        if object:IsA("BasePart") and originalCFrame then
            object.CFrame = originalCFrame * CFrame.new(offsetX, offsetY, 0)
        elseif object:IsA("GuiObject") and originalPosition then
            object.Position = originalPosition + UDim2.fromOffset(offsetX, offsetY)
        end
    end)
end

return TweenUtils
```

---

**Remember**: Use `--!strict` mode for type safety, implement proper client-server separation, validate all remote calls on the server, use DataStores with proper error handling and retries, leverage ModuleScripts for code organization, and follow Roblox's security best practices.
