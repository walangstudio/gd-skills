# Roblox 2025+ — Animation Reference

> Pinned to Roblox 2025+. Verify anything newer against https://create.roblox.com/docs.

## Core types & entry points
- Skeletal animation pipeline: an `Animation` instance holds an `AnimationId` (`rbxassetid://...`); load it through an `Animator` to get an `AnimationTrack`, then `:Play()`.
- `Animator` is the object that actually plays tracks; it lives under a `Humanoid` (characters) or an `AnimationController` (non-Humanoid rigs). `LoadAnimation` lives on the `Animator` — `Humanoid:LoadAnimation` / `AnimationController:LoadAnimation` are deprecated.
- `AnimationTrack` controls: `:Play(fadeTime, weight, speed)`, `:Stop(fadeTime)`, `:AdjustSpeed(n)`, `:AdjustWeight(w)`, `.Looped`, `.Priority`, `.TimePosition`. Events: `Stopped`, `Ended`, `:GetMarkerReachedSignal(name)`, `KeyframeReached`.
- `Priority` (`Enum.AnimationPriority`: Idle < Movement < Action < Action2..4) decides which track wins when several play on the same rig.
- `TweenService:Create(instance, TweenInfo.new(...), goalProps)` returns a `Tween` for non-skeletal property animation (position, color, size, transparency).

## Common tasks
Load and play a Humanoid animation (`Script` or `LocalScript`):
```lua
local character = script.Parent
local humanoid = character:WaitForChild("Humanoid") :: Humanoid
local animator = humanoid:WaitForChild("Animator") :: Animator

local anim = Instance.new("Animation")
anim.AnimationId = "rbxassetid://507771019"

local track = animator:LoadAnimation(anim)
track.Priority = Enum.AnimationPriority.Action
track.Looped = false
track:Play()
track.Stopped:Wait()
```

Tween a part's properties (`Script`):
```lua
local TweenService = game:GetService("TweenService")
local part = workspace.Door

local info = TweenInfo.new(
	0.5,                          -- duration
	Enum.EasingStyle.Quad,
	Enum.EasingDirection.Out
)
local tween = TweenService:Create(part, info, { CFrame = part.CFrame * CFrame.Angles(0, math.rad(90), 0) })
tween:Play()
tween.Completed:Connect(function(state)
	print("door open:", state == Enum.PlaybackState.Completed)
end)
```

## Gotchas
- Call `LoadAnimation` on the `Animator`, not on `Humanoid`/`AnimationController` (those overloads are deprecated). The `Animator` may take a frame to exist — `WaitForChild` it.
- Load each `Animation` once and reuse the `AnimationTrack`; calling `LoadAnimation` repeatedly leaks tracks and degrades performance.
- Animation assets must be owned by you or your group, or they fail to play. Animations authored on a different rig type may not retarget cleanly.
- `Priority` ties break by play order/weight — an idle that won't yield to a movement track usually has the wrong priority.
- `TweenService` cannot tween nested/structured values (e.g. partial CFrame components individually) — give it the final goal value; tweens conflict if two target the same property.
- Replication: a track played on the server replicates to clients; one played in a `LocalScript` shows only on that client. Pick the side deliberately.

## See also
- `roblox-patterns` skill, `roblox-style` rule, `roblox-specialist` agent
- guides/ for cross-engine architecture patterns
