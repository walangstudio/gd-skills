# Web (Phaser / Three.js / Babylon.js) — Navigation Reference

> Pinned to Phaser 3.80+, Three.js r160+, Babylon.js 7.0+. Verify anything newer against https://phaser.io/ and https://threejs.org/docs/.

## Core types & entry points
- No built-in pathfinding/navmesh in Phaser — you roll grid A* by hand or use a plugin.
- `easystarjs`: drop-in 2D grid A* (`new EasyStar.js()`, `setGrid(2d-array)`, `setAcceptableTiles([...])`, `findPath(x0,y0,x1,y1, cb)`, then `calculate()` to run the async search).
- A tilemap maps to a grid by layer dimensions; mark blocked tiles (walls) as unwalkable.
- Movement is decoupled from pathfinding: A* returns a list of waypoints; you tween/step the sprite along them.
- Three.js: `three-pathfinding` (recast/detour-style navmesh) — `Pathfinding.createZone(geometry)`, `pathfinder.findPath(start, target, zoneId, groupId)`.

## Common tasks
Hand-rolled grid A* (heuristic + open/closed), engine-agnostic core:
```javascript
function astar(grid, start, goal) { // grid: 2D, 0 = walkable
  const key = (n) => `${n.x},${n.y}`;
  const h = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y); // Manhattan
  const open = [{ ...start, g: 0, f: h(start, goal), parent: null }];
  const came = new Map();
  const gScore = new Map([[key(start), 0]]);

  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const cur = open.shift();
    if (cur.x === goal.x && cur.y === goal.y) {
      const path = []; let n = cur;
      while (n) { path.unshift({ x: n.x, y: n.y }); n = n.parent; }
      return path;
    }
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = cur.x + dx, ny = cur.y + dy;
      if (grid[ny]?.[nx] !== 0) continue; // wall or out of bounds
      const ng = cur.g + 1;
      const nk = `${nx},${ny}`;
      if (ng < (gScore.get(nk) ?? Infinity)) {
        gScore.set(nk, ng);
        open.push({ x: nx, y: ny, g: ng, f: ng + h({ x: nx, y: ny }, goal), parent: cur });
      }
    }
  }
  return null; // no path
}
```

Follow the returned waypoints with tweens (Phaser):
```javascript
function followPath(scene, sprite, path, tileSize) {
  const tweens = path.map((p) => ({
    x: p.x * tileSize + tileSize / 2,
    y: p.y * tileSize + tileSize / 2,
    duration: 200,
  }));
  scene.tweens.chain({ targets: sprite, tweens });
}
```

## Gotchas
- `easystarjs` `findPath` is **async** — the callback only fires after you call `calculate()` (typically once per tick); don't expect a synchronous return.
- Recompute paths when the grid changes (doors, destroyed walls); a cached path can route an enemy into a now-blocked tile.
- Grid coords vs world/pixel coords are different spaces — convert (`tileX * tileSize + tileSize/2`) when moving the sprite or it snaps to the corner.
- A* cost scales with grid size; for large maps throttle searches (one per few frames), cache results, or use a coarser grid to avoid frame hitches.
- Diagonal movement needs diagonal neighbors **and** a corner-cutting check, plus Euclidean/octile heuristic — the Manhattan version above is 4-directional only.

## See also
- `web-patterns` skill, `web-style` rule, `web-specialist` agent
- guides/ for cross-engine architecture patterns
