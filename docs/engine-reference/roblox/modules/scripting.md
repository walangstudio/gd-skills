# Roblox 2025+ — Scripting Reference

> Pinned to Roblox 2025+. Verify anything newer against https://create.roblox.com/docs.

## Core types & entry points
- Luau with `--!strict`; type annotations `local x: number`
- `task.wait()`/`task.spawn()`/`task.defer()` (NOT deprecated `wait`/`spawn`)
- Events: `Instance.Event:Connect(fn)`; `BindableEvent`/`RemoteEvent`
- ModuleScripts return a table

## See also
- `roblox-patterns` skill, `roblox-style` rule, `roblox-specialist` agent
- guides/ for cross-engine architecture patterns

> TODO: expand verified snippets and gotchas.
