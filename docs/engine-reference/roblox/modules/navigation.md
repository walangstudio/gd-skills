# Roblox 2025+ — Navigation Reference

> Pinned to Roblox 2025+. Verify anything newer against https://create.roblox.com/docs.

## Core types & entry points
- `PathfindingService` (server-side): `:CreatePath(agentParams)` returns a `Path`.
- Agent params table: `AgentRadius`, `AgentHeight`, `AgentCanJump`, `AgentCanClimb`, `WaypointSpacing`, `Costs` (per-material/label cost overrides for `PathfindingModifier` labels).
- `Path:ComputeAsync(startPos, finishPos)` (yields). Check `Path.Status == Enum.PathStatus.Success` before reading waypoints. `Path:GetWaypoints()` returns `PathWaypoint`s, each with `.Position` and `.Action` (`Enum.PathWaypointAction.Walk`/`Jump`).
- Drive the character with `Humanoid:MoveTo(waypoint.Position)` and await `Humanoid.MoveToFinished:Wait()` per waypoint; trigger `Humanoid:ChangeState(Enum.HumanoidStateType.Jumping)` on `Jump` actions.
- `Path.Blocked` event fires with the blocked waypoint index — recompute from the current position. `PathfindingModifier` instances mark regions/materials as cheaper/costlier or pass-through.

## Common tasks
Compute a path and walk it (`Script`):
```lua
local PathfindingService = game:GetService("PathfindingService")

local function walkTo(character: Model, destination: Vector3)
	local humanoid = character:WaitForChild("Humanoid") :: Humanoid

	local path = PathfindingService:CreatePath({
		AgentRadius = 2,
		AgentHeight = 5,
		AgentCanJump = true,
		WaypointSpacing = 4,
	})

	path:ComputeAsync(character:GetPivot().Position, destination)
	if path.Status ~= Enum.PathStatus.Success then
		warn("no path:", path.Status)
		return
	end

	for _, waypoint in path:GetWaypoints() do
		if waypoint.Action == Enum.PathWaypointAction.Jump then
			humanoid:ChangeState(Enum.HumanoidStateType.Jumping)
		end
		humanoid:MoveTo(waypoint.Position)
		humanoid.MoveToFinished:Wait()
	end
end
```

Recompute when the path is blocked (`Script`):
```lua
path.Blocked:Connect(function(blockedIndex: number)
	-- something moved into the route; recompute from where we are now
	path:ComputeAsync(character:GetPivot().Position, destination)
end)
```

## Gotchas
- `ComputeAsync` yields and can fail — always check `Path.Status == Enum.PathStatus.Success`; `NoPath`/`ClosestNoPath` mean no full route was found.
- Run pathfinding on the **server**; `MoveTo`/`MoveToFinished` drive the authoritative Humanoid. Pathing on the client only moves that client's view and won't replicate authority.
- `Humanoid.MoveToFinished` also fires after an ~8-second internal timeout returning `false` even if not arrived — handle the `false` case so an NPC doesn't stall on one waypoint.
- The agent params must roughly match the character's real size; too small an `AgentRadius` plots paths the body can't fit through.
- Paths are static snapshots of geometry at compute time — moving obstacles need the `Blocked` event or periodic recompute; the path won't self-update.
- `AgentCanJump` only allows `Jump` waypoints to be generated; you still must trigger the jump state yourself when walking them.

## See also
- `roblox-patterns` skill, `roblox-style` rule, `roblox-specialist` agent
- guides/ for cross-engine architecture patterns
