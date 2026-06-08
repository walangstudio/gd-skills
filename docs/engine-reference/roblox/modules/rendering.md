# Roblox 2025+ — Rendering Reference

> Pinned to Roblox 2025+. Verify anything newer against https://create.roblox.com/docs.

## Core types & entry points
- Geometry: `Part` (primitives), `MeshPart` (imported mesh + `TextureID`), `UnionOperation`/`NegateOperation` (solid modeling). `SurfaceAppearance` (PBR maps) on a MeshPart overrides its color/texture.
- Surfaces: `Decal` (image on one face) and `Texture` (tiling image with `StudsPerTileU/V`), parented to a part.
- `Lighting` service: global `Technology` (Voxel/ShadowMap/Future), `ClockTime`/`TimeOfDay`, `Brightness`, `Ambient`, plus child effects `Atmosphere`, `Sky`, `Bloom`, `ColorCorrection`, `DepthOfField`, `SunRays`.
- Camera: `workspace.CurrentCamera` (client-side), `.CameraType` (`Enum.CameraType.Custom`/`Scriptable`/etc.), `.CFrame`, `.FieldOfView`, `:WorldToScreenPoint`.
- Effects: `ParticleEmitter`, `Beam` (between two `Attachment`s), `Trail`, `Sparkles`/`Smoke`/`Fire` (legacy), `Highlight`, `SelectionBox`.
- `ViewportFrame` (a GUI object) renders 3D instances inside UI. Instance streaming controlled by `Workspace.StreamingEnabled` + `StreamingTargetRadius`.

## Common tasks
Scriptable camera that orbits a target (`LocalScript`):
```lua
local RunService = game:GetService("RunService")
local camera = workspace.CurrentCamera
local target = workspace:WaitForChild("Focus")

camera.CameraType = Enum.CameraType.Scriptable

RunService.RenderStepped:Connect(function()
	local t = os.clock()
	local offset = Vector3.new(math.cos(t) * 20, 10, math.sin(t) * 20)
	camera.CFrame = CFrame.lookAt(target.Position + offset, target.Position)
end)
```

Tune lighting and add atmosphere (`Script`):
```lua
local Lighting = game:GetService("Lighting")
Lighting.Technology = Enum.Technology.Future
Lighting.ClockTime = 14
Lighting.Brightness = 2

local atmosphere = Instance.new("Atmosphere")
atmosphere.Density = 0.35
atmosphere.Haze = 1.5
atmosphere.Parent = Lighting
```

A Beam between two attachments (`Script`):
```lua
local function linkBeam(a: Attachment, b: Attachment)
	local beam = Instance.new("Beam")
	beam.Attachment0 = a
	beam.Attachment1 = b
	beam.Color = ColorSequence.new(Color3.fromRGB(0, 170, 255))
	beam.Width0, beam.Width1 = 0.5, 0.5
	beam.Parent = a.Parent
	return beam
end
```

## Gotchas
- `workspace.CurrentCamera` is per-client and `nil` on the server — never script the camera from a server `Script`. Switching `CameraType` away from `Custom` disables the default follow camera until you set it back.
- `Future` lighting is the most expensive technology; on low-end/mobile clients prefer `ShadowMap` or `Voxel`.
- A `Beam` needs both `Attachment0` and `Attachment1`; a `Texture`/`Decal` needs a valid `Face` and shows nothing if the asset id is wrong or the part is too small.
- With `StreamingEnabled`, far parts may not exist on the client yet — `:WaitForChild` and code defensively; the server always sees the full world.
- `ParticleEmitter`/`Beam`/`Trail` are visual only and do not replicate per-particle state; they're driven locally on each client from their properties.
- `SurfaceAppearance` replaces the MeshPart's color/`TextureID` entirely — partial overrides aren't possible.

## See also
- `roblox-patterns` skill, `roblox-style` rule, `roblox-specialist` agent
- guides/ for cross-engine architecture patterns
