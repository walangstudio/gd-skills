# Roblox 2025+ — UI Reference

> Pinned to Roblox 2025+. Verify anything newer against https://create.roblox.com/docs.

## Core types & entry points
- `ScreenGui` is the 2D root; put it in `StarterGui` (cloned into each player's `PlayerGui` on spawn) or create it client-side under `PlayerGui`.
- Elements (all `GuiObject`s): `Frame`, `TextLabel`, `TextButton`, `ImageLabel`, `ImageButton`, `ScrollingFrame`, `TextBox`, `ViewportFrame`.
- Positioning uses `UDim2.new(xScale, xOffset, yScale, yOffset)` for `Position`/`Size` and `UDim` for single axes. `AnchorPoint` (0–1) sets the pivot. Scale is fraction of parent; Offset is pixels.
- Layout/modifier objects parented to a container: `UIListLayout`, `UIGridLayout`, `UIPadding`, `UICorner`, `UIStroke`, `UIAspectRatioConstraint`, `UISizeConstraint`.
- Input events: `TextButton`/`ImageButton` fire `Activated` (any input, recommended), `MouseButton1Click`, `MouseEnter`/`MouseLeave`. `TextBox.FocusLost` for text entry.

## Common tasks
Build a button at runtime and wire its click (`LocalScript` in `StarterPlayerScripts`):
```lua
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local gui = Instance.new("ScreenGui")
gui.ResetOnSpawn = false
gui.Parent = playerGui

local button = Instance.new("TextButton")
button.Size = UDim2.new(0, 200, 0, 50)
button.Position = UDim2.new(0.5, 0, 0.8, 0)
button.AnchorPoint = Vector2.new(0.5, 0.5)
button.Text = "Play"
button.Parent = gui

Instance.new("UICorner").Parent = button

button.Activated:Connect(function()
	print("clicked")
	button.Text = "Loading..."
end)
```

Vertically stack items with a layout (`LocalScript`):
```lua
local list = Instance.new("Frame")
list.Size = UDim2.fromScale(0.3, 0.6)
list.Parent = gui

local layout = Instance.new("UIListLayout")
layout.Padding = UDim.new(0, 8)
layout.SortOrder = Enum.SortOrder.LayoutOrder
layout.Parent = list

for i = 1, 5 do
	local row = Instance.new("TextLabel")
	row.Size = UDim2.new(1, 0, 0, 40)
	row.LayoutOrder = i
	row.Text = "Item " .. i
	row.Parent = list
end
```

## Gotchas
- GUI is client-only. Build/handle it in `LocalScript`s; a server `Script` cannot read clicks or `PlayerGui`. Send clicks to the server via a `RemoteEvent`, and never trust the client's UI state as authoritative.
- `StarterGui` contents are copied to `PlayerGui` each respawn; set `ScreenGui.ResetOnSpawn = false` to persist a GUI across deaths, or build it under `PlayerGui` once.
- Scale vs Offset: Scale resizes with the screen, Offset is fixed pixels. Mixing them wrong breaks on other resolutions — test on phone aspect ratios.
- Prefer `Activated` over `MouseButton1Click`: it also fires for touch/gamepad. `MouseButton1Click` is mouse-only.
- `UIListLayout`/`UIGridLayout` override children `Position` — set `LayoutOrder`, not `Position`, to reorder.
- A `Frame` with `Active=false` lets clicks pass through; buttons under a covering frame won't receive input unless the frame allows it.

## See also
- `roblox-patterns` skill, `roblox-style` rule, `roblox-specialist` agent
- guides/ for cross-engine architecture patterns
