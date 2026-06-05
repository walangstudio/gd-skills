# Roblox 2025+ — Core Reference

> Pinned to Roblox 2025+. Verify anything newer against https://create.roblox.com/docs.

## Core types & entry points
- `game` is the root DataModel. Get services with `game:GetService("Name")` — never index them by name directly (some only exist after the first `GetService`).
- `Instance` is the base of everything in the tree: `Instance.new("Part")`, `:Clone()`, `:Destroy()`, `.Parent`, `:FindFirstChild`, `:WaitForChild`.
- Key containers: `Workspace` (3D world), `ReplicatedStorage` (shared client+server), `ServerScriptService` / `ServerStorage` (server-only, never replicated), `StarterPlayer` (`StarterPlayerScripts`, `StarterCharacterScripts`), `StarterGui`.
- Script classes: `Script` (server, runs in Workspace/ServerScriptService), `LocalScript` (client, runs under a Player/character/PlayerGui/StarterPlayerScripts), `ModuleScript` (shared library, returns one value via `require`).
- `RunService` events: `Heartbeat` (after physics, server+client), `RenderStepped` (client only, before render), `Stepped` (before physics). Use `RunService:IsServer()` / `:IsClient()` to branch.
- `Players` service: `Players.PlayerAdded`, `player.CharacterAdded`, `Players.LocalPlayer` (client only).

## Common tasks
Server-side player join handling (`Script` in `ServerScriptService`):
```lua
local Players = game:GetService("Players")

local function onCharacter(character: Model)
	local humanoid = character:WaitForChild("Humanoid") :: Humanoid
	humanoid.WalkSpeed = 24
end

Players.PlayerAdded:Connect(function(player: Player)
	player.CharacterAdded:Connect(onCharacter)
	if player.Character then
		onCharacter(player.Character)
	end
end)
```

Client-side per-frame update (`LocalScript` in `StarterPlayerScripts`):
```lua
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local player = Players.LocalPlayer

RunService.RenderStepped:Connect(function(dt: number)
	local char = player.Character
	if char then
		-- runs every rendered frame on this client only
	end
end)
```

Shared ModuleScript in `ReplicatedStorage`, required from either side:
```lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Config = require(ReplicatedStorage:WaitForChild("Config"))
print(Config.MaxHealth)
```

## Gotchas
- `Workspace` instances replicate to clients; `ServerStorage`/`ServerScriptService` do **not** — put shared assets/modules in `ReplicatedStorage`.
- Clients cannot be trusted: a `LocalScript` setting state only affects that client. Authoritative state must live on the server and travel via `RemoteEvent`/`RemoteFunction`.
- `Players.LocalPlayer` is `nil` on the server. `RenderStepped` exists only on the client.
- Use `:WaitForChild` (not `:FindFirstChild`) for things that stream/replicate in, or you'll get `nil` on a race.
- `StarterPlayerScripts`/`StarterGui` contents are *copied* into each player on spawn — edit the live copy under the Player, not the Starter template, at runtime.
- Never `wait()` for a service to exist; `GetService` is synchronous and creates the service if needed.

## See also
- `roblox-patterns` skill, `roblox-style` rule, `roblox-specialist` agent
- guides/ for cross-engine architecture patterns
