# Roblox 2025+ — Physics Reference

> Pinned to Roblox 2025+. Verify anything newer against https://create.roblox.com/docs.

## Core types & entry points
- `BasePart` (base of `Part`/`MeshPart`/etc.) carries physics props: `Anchored`, `CanCollide`, `CanTouch`, `Massless`, `AssemblyLinearVelocity`, `AssemblyAngularVelocity`.
- A character is a `Model` with a `Humanoid` and a `HumanoidRootPart` (the root driving part). Move it via `Humanoid:MoveTo(pos)` or `Humanoid.WalkToPoint`, not by setting CFrame each frame.
- Forces use **constraints**, not the deprecated BodyMovers (`BodyVelocity`/`BodyForce`/`BodyPosition`): `VectorForce`, `LinearVelocity`, `AlignPosition`, `AlignOrientation`, `AngularVelocity`, `Rope`/`Spring`/`Weld`Constraint. Constraints need `Attachment`s.
- Raycasting: `workspace:Raycast(origin, direction, RaycastParams)` returns a `RaycastResult` (`.Instance`, `.Position`, `.Normal`, `.Material`) or `nil`. `direction`'s magnitude is the ray length. Also `:Blockcast`, `:Spherecast`, `:Shapecast`.
- Overlap: `Touched`/`TouchEnded` on a part, or `workspace:GetPartBoundsInBox` / `:GetPartsInPart` with `OverlapParams`.
- Collision groups via `PhysicsService:RegisterCollisionGroup(name)` + `:CollisionGroupSetCollidable(a, b, bool)`; assign with `part.CollisionGroup = name`.

## Common tasks
Raycast downward to find ground (`Script`):
```lua
local params = RaycastParams.new()
params.FilterType = Enum.RaycastFilterType.Exclude
params.FilterDescendantsInstances = { character }

local origin = character:GetPivot().Position
local result = workspace:Raycast(origin, Vector3.new(0, -50, 0), params)
if result then
	print("ground:", result.Instance.Name, "at", result.Position)
end
```

Move a Humanoid to a point and wait for arrival (`Script`):
```lua
local humanoid = character:WaitForChild("Humanoid") :: Humanoid

humanoid:MoveTo(Vector3.new(10, 0, 25))
local reached = humanoid.MoveToFinished:Wait() -- true if arrived, false on timeout
print("arrived:", reached)
```

Push a part with a constraint instead of a BodyMover:
```lua
local part = workspace.Projectile
local attachment = Instance.new("Attachment")
attachment.Parent = part

local force = Instance.new("VectorForce")
force.Attachment0 = attachment
force.RelativeTo = Enum.ActuatorRelativeTo.World
force.Force = Vector3.new(0, part.AssemblyMass * workspace.Gravity, 0) -- counteract gravity
force.Parent = part
```

## Gotchas
- BodyMovers (`BodyVelocity`, `BodyForce`, `BodyPosition`, `BodyGyro`) are deprecated — use constraints (`LinearVelocity`, `VectorForce`, `AlignPosition`, `AlignOrientation`).
- Physics ownership: an unanchored part is simulated by whichever machine owns it (often the nearby client). The owner's results replicate; setting velocity on a non-owner is ignored. Set ownership with `part:SetNetworkOwner(player)` / `(nil)` for server.
- `Touched` fires only for unanchored parts brushing a collidable part, can fire many times, and is **not** a reliable hit-test — debounce it and validate, or use `GetPartsInPart`/spatial queries for precise checks.
- `Raycast` direction length **is** the ray distance — a unit vector only reaches 1 stud. `FilterType` Exclude vs Include is easy to invert.
- `Anchored` parts don't fall or respond to forces; constraints need both an `Attachment` and (for two-body constraints) a second attachment.
- Heavy per-frame raycasts belong in `Heartbeat`, not `RenderStepped`; the latter is client-render-only.

## See also
- `roblox-patterns` skill, `roblox-style` rule, `roblox-specialist` agent
- guides/ for cross-engine architecture patterns
