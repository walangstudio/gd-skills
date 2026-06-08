# Roblox 2025+ — Audio Reference

> Pinned to Roblox 2025+. Verify anything newer against https://create.roblox.com/docs.

## Core types & entry points
- `Sound` instance holds `SoundId`, `.Volume`, `.PlaybackSpeed`, `.Looped`, `.TimePosition`, `.PlaybackLoudness` (read-only live amplitude 0–1000). Controls: `:Play()`, `:Stop()`, `:Pause()`, `:Resume()`. Events: `Played`, `Ended`, `Loaded`.
- Spatialization is decided by the `Sound`'s parent: parent it to a `BasePart` or `Attachment` for **3D positional** audio (distance attenuation via `RollOffMode`/`RollOffMinDistance`/`RollOffMaxDistance`); parent to `SoundService` or a `PlayerGui` for **2D/global** audio that ignores position.
- `SoundGroup` for buses: set `Sound.SoundGroup`, adjust the group `.Volume`, and add effect children (`EqualizerSoundEffect`, `ReverbSoundEffect`, `CompressorSoundEffect`, etc.).
- `SoundService` global config: `.AmbientReverb`, `.DistanceFactor`, `.DopplerScale`, `.RolloffScale`; `:PlayLocalSound(sound)` plays a 2D sound on the local client without parenting.

## Common tasks
3D positional sound attached to a part (`Script`):
```lua
local part = workspace:WaitForChild("Engine")

local sound = Instance.new("Sound")
sound.SoundId = "rbxassetid://9120386436"
sound.Looped = true
sound.RollOffMode = Enum.RollOffMode.InverseTapered
sound.RollOffMaxDistance = 100
sound.Parent = part -- parenting to a part makes it spatial
sound:Play()
```

2D UI click sound, local to one client (`LocalScript`):
```lua
local SoundService = game:GetService("SoundService")

local click = Instance.new("Sound")
click.SoundId = "rbxassetid://876939830"
click.Volume = 0.6
SoundService:PlayLocalSound(click) -- no parenting needed, plays 2D on this client
```

Route music through a SoundGroup and react to loudness (`LocalScript`):
```lua
local RunService = game:GetService("RunService")

local group = Instance.new("SoundGroup")
group.Name = "Music"
group.Volume = 0.5
group.Parent = game:GetService("SoundService")

local music = Instance.new("Sound")
music.SoundId = "rbxassetid://1837879082"
music.Looped = true
music.SoundGroup = group
music.Parent = group
music:Play()

RunService.RenderStepped:Connect(function()
	local level = music.PlaybackLoudness -- 0..1000, drive a visualizer
end)
```

## Gotchas
- Parent placement is the spatial switch: a `Sound` under a part is 3D and attenuates with distance; under `SoundService`/`PlayerGui` it's 2D and global. There is no boolean for this.
- A `Sound` parented in `Workspace` or replicated containers plays for **all** clients; `SoundService:PlayLocalSound` and sounds under `PlayerGui` play only on the local client. Use the latter for per-player UI/feedback.
- `PlaybackLoudness` only updates while the sound is actually audible and playing on that client — it's `0` on the server and before `IsLoaded`.
- `SoundId` must be a valid `rbxassetid://` audio asset you have permission to use; private/unapproved audio fails to load silently (check the `Loaded` event / `IsLoaded`).
- `PlaybackSpeed` changes pitch and effective length; looping seamless audio requires a clip authored to loop.

## See also
- `roblox-patterns` skill, `roblox-style` rule, `roblox-specialist` agent
- guides/ for cross-engine architecture patterns
