# Roblox 2025+ — Scripting Reference

> Pinned to Roblox 2025+. Verify anything newer against https://create.roblox.com/docs.

## Core types & entry points
- Luau with `--!strict` as the first line enables static type checking. Annotate where it helps: `local x: number`, function params/returns, `type` aliases.
- `task` library replaces legacy globals: `task.wait(t)`, `task.spawn(fn)`, `task.defer(fn)`, `task.delay(t, fn)`. Do not use deprecated `wait`/`spawn`/`delay`.
- `Instance.new("ClassName")` creates an instance; set props before parenting for fewer replication updates.
- Events use `:Connect(fn)` returning an `RBXScriptConnection` (call `:Disconnect()` to clean up); one-shot via `event:Wait()`.
- Cross-boundary messaging: `RemoteEvent` (fire-and-forget, both ways) and `RemoteFunction` (request/response, returns a value). `BindableEvent`/`BindableFunction` are same-side only.
- `ModuleScript` returns exactly one value (usually a table); `require` caches per environment so the module runs once per side.
- Attributes: `instance:SetAttribute("Key", value)` / `:GetAttribute` / `:GetAttributeChangedSignal` — replicated, typed metadata without extra `Value` objects.

## Common tasks
A typed ModuleScript:
```lua
--!strict
local Combat = {}

export type Hit = { target: Instance, damage: number }

function Combat.apply(hit: Hit): number
	local humanoid = hit.target:FindFirstChildOfClass("Humanoid")
	if humanoid then
		humanoid.Health -= hit.damage
	end
	return hit.damage
end

return Combat
```

Server: receive a RemoteEvent, validate, then act (`Script` in `ServerScriptService`):
```lua
--!strict
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local fireWeapon = ReplicatedStorage:WaitForChild("FireWeapon") :: RemoteEvent

fireWeapon.OnServerEvent:Connect(function(player: Player, target: Instance)
	if not target:IsA("BasePart") then return end -- never trust client args
	print(player.Name, "hit", target.Name)
end)
```

Client: fire the RemoteEvent and use `task` (`LocalScript`):
```lua
--!strict
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local fireWeapon = ReplicatedStorage:WaitForChild("FireWeapon") :: RemoteEvent

task.spawn(function()
	task.wait(1)
	fireWeapon:FireServer(workspace:WaitForChild("Dummy"))
end)
```

## Gotchas
- `OnServerEvent` always passes the firing `Player` as the first arg — never trust later args; validate types and ownership server-side.
- `RemoteFunction:InvokeClient` is dangerous: a malicious or disconnecting client can hang or error the server. Prefer `RemoteEvent` for server→client.
- A connection leaks if you never `:Disconnect()` it; connections tied to a destroyed instance are cleaned up automatically, but those on persistent services are not.
- `require` caches: a ModuleScript's top-level code runs once per environment (once on server, once per client), so don't rely on it re-running.
- `--!strict` only affects static analysis — it does not enforce types at runtime. Casts (`:: T`) silence the checker, they don't validate.
- `task.wait()` yields at least one frame even with `0`; it does not resume instantly.

## See also
- `roblox-patterns` skill, `roblox-style` rule, `roblox-specialist` agent
- guides/ for cross-engine architecture patterns
