# Defold 1.9+ — Navigation Reference

> Pinned to Defold 1.9+. Verify anything newer against https://defold.com/manuals/ and https://defold.com/ref/stable/.

## Core types & entry points
- **Defold has no built-in navmesh or pathfinding system.** This is honest and important — do not invent a `nav.*` API.
- Pathfinding is done with community/native extensions or hand-rolled algorithms:
  - **`defold-astar`** — a native A* extension (grid/graph pathfinding) added via the project dependency URL.
  - Tilemap-grid A* / BFS / Dijkstra implemented in plain Lua over `tilemap.get_tile` data.
  - Steering/avoidance written manually on top of physics raycasts (`physics.raycast`).
- Movement itself uses `go.set_position` / `go.animate` / physics velocity along the computed waypoints.

## Common tasks
Grid pathfinding pattern (plain Lua A* over a tile grid — sketch):
```lua
-- build a passable grid from the tilemap, then A* over it
local grid = build_grid_from_tilemap("/level#tilemap")
local path = astar.find(grid, start_xy, goal_xy)  -- your A* module
for _, cell in ipairs(path) do
    -- convert cell -> world pos and move the agent toward it
end
```

Using the defold-astar extension (add the dependency in `game.project`):
```lua
-- after configuring the map with astar.set_map_data(...)
local result = astar.get_path(from_x, from_y, to_x, to_y)
```

Manual line-of-sight via physics raycast:
```lua
local hit = physics.raycast(go.get_position(), target_pos, { hash("wall") })
local can_see = hit == nil
```

## Gotchas
- There is no engine `NavigationAgent`/navmesh — claims of one are hallucinated. Verify any pathfinding call against the specific extension's docs.
- `defold-astar` is a third-party native extension; its exact API depends on the version pinned in `game.project` dependencies — check that repo, not the engine ref.
- For tile-based games, rolling A* over the tilemap grid is the common, dependency-free approach.
- Movement is still your responsibility — pathfinding gives waypoints; you move the game object with `go.*`/physics.
- LuaJIT helps, but a naive per-frame full-grid A* will stutter — cache paths and recompute only on change.

## See also
- `defold-patterns` skill, `defold-style` rule, `defold-specialist` agent
- guides/ for cross-engine architecture patterns
