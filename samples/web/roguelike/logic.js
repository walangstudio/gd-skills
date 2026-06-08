// Pure game logic — no DOM, no canvas. Works in the browser (attaches to window)
// and in Node (module.exports), so the mechanics can be unit-tested headless.
// See test.js. The rendering/input lives in game.js.
//
// Turn-based: the world only advances when the player acts. step(g, action)
// resolves the player's action, then every living enemy takes ONE turn. No dt.

(function (root) {
  "use strict";

  const WALL = 1;
  const FLOOR = 0;

  // Deterministic PRNG (mulberry32). Injected into generateDungeon so logic.js
  // never touches Math.random — same seed → same dungeon, every time.
  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randInt(rng, lo, hi) {
    return lo + Math.floor(rng() * (hi - lo + 1));
  }

  // Map a direction name to a grid delta. "wait" → no movement.
  const DIRS = {
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 },
    wait: { dx: 0, dy: 0 },
  };

  function inBounds(grid, x, y) {
    return y >= 0 && y < grid.length && x >= 0 && x < grid[0].length;
  }

  function isWall(grid, x, y) {
    return !inBounds(grid, x, y) || grid[y][x] === WALL;
  }

  // True if any *living* enemy stands on (x,y).
  function enemyAt(enemies, x, y) {
    for (const e of enemies) {
      if (e.hp > 0 && e.x === x && e.y === y) return e;
    }
    return null;
  }

  // A tile a creature may step onto: in bounds, floor, no other enemy.
  // The player's own tile is never passable (no creature stacks on the player).
  function isPassable(g, x, y) {
    if (isWall(g.grid, x, y)) return false;
    if (g.player.x === x && g.player.y === y) return false;
    if (enemyAt(g.enemies, x, y)) return false;
    return true;
  }

  // Carve a rectangular dungeon: solid wall border, rooms of FLOOR joined by
  // corridors. Returns { grid, rooms }. rng is injected (no Math.random here).
  function generateDungeon(w, h, rng) {
    const grid = [];
    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) row.push(WALL);
      grid.push(row);
    }

    const rooms = [];
    const tries = 24;
    for (let i = 0; i < tries; i++) {
      // Clamp room size to fit inside the 1-tile wall border on every side.
      const rw = Math.min(randInt(rng, 3, 6), Math.max(1, w - 2));
      const rh = Math.min(randInt(rng, 3, 5), Math.max(1, h - 2));
      const rx = randInt(rng, 1, Math.max(1, w - rw - 1));
      const ry = randInt(rng, 1, Math.max(1, h - rh - 1));
      const room = { x: rx, y: ry, w: rw, h: rh };
      for (let y = ry; y < ry + rh; y++) {
        for (let x = rx; x < rx + rw; x++) grid[y][x] = FLOOR;
      }
      if (rooms.length) {
        // L-shaped corridor from the previous room's center to this one's.
        const prev = rooms[rooms.length - 1];
        const ax = Math.floor(prev.x + prev.w / 2);
        const ay = Math.floor(prev.y + prev.h / 2);
        const bx = Math.floor(rx + rw / 2);
        const by = Math.floor(ry + rh / 2);
        for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) grid[ay][x] = FLOOR;
        for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) grid[y][bx] = FLOOR;
      }
      rooms.push(room);
    }
    return { grid, rooms };
  }

  function roomCenter(r) {
    return { x: Math.floor(r.x + r.w / 2), y: Math.floor(r.y + r.h / 2) };
  }

  // Build a full game state from a seed. Player starts in the first room, the
  // stairs sit in the last room, enemies drop into intermediate room centers.
  function createGame(opts) {
    const o = opts || {};
    const w = o.w || 24;
    const h = o.h || 16;
    const seed = o.seed == null ? 1 : o.seed | 0;
    const depth = o.depth || 1;
    const targetDepth = o.targetDepth || 3;

    const rng = makeRng(seed + depth * 1013904223);
    const { grid, rooms } = generateDungeon(w, h, rng);

    const start = roomCenter(rooms[0]);
    const exit = roomCenter(rooms[rooms.length - 1]);

    const enemies = [];
    for (let i = 1; i < rooms.length - 1; i++) {
      const c = roomCenter(rooms[i]);
      // Skip if a previous enemy already claimed this exact tile.
      if (c.x === start.x && c.y === start.y) continue;
      if (c.x === exit.x && c.y === exit.y) continue;
      if (enemyAt(enemies, c.x, c.y)) continue;
      enemies.push({ x: c.x, y: c.y, hp: 3, atk: 1 });
    }

    return {
      w,
      h,
      seed,
      depth,
      targetDepth,
      grid,
      rooms,
      player: { x: start.x, y: start.y, hp: 10, maxHp: 10, atk: 2 },
      enemies,
      exit,
      state: "playing", // playing | won | lost
      turn: 0,
    };
  }

  // One enemy chases the player: greedy step on the axis with the larger gap.
  // If the player is adjacent in the chosen direction, attack instead of move.
  // If the preferred tile is blocked, try the other axis; else stay put.
  function enemyTurn(g, e) {
    if (e.hp <= 0) return;
    const dx = g.player.x - e.x;
    const dy = g.player.y - e.y;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    // Two candidate single-axis steps, preferred axis first.
    const sx = dx === 0 ? 0 : dx > 0 ? 1 : -1;
    const sy = dy === 0 ? 0 : dy > 0 ? 1 : -1;
    const horizFirst = adx >= ady;
    const moves = horizFirst
      ? [{ x: e.x + sx, y: e.y }, { x: e.x, y: e.y + sy }]
      : [{ x: e.x, y: e.y + sy }, { x: e.x + sx, y: e.y }];

    for (const m of moves) {
      if (m.x === e.x && m.y === e.y) continue; // null step on a zero-gap axis
      // Attack the player if stepping onto their tile.
      if (m.x === g.player.x && m.y === g.player.y) {
        g.player.hp -= e.atk;
        if (g.player.hp <= 0) {
          g.player.hp = 0;
          g.state = "lost";
        }
        return;
      }
      if (isPassable(g, m.x, m.y)) {
        e.x = m.x;
        e.y = m.y;
        return;
      }
    }
    // Both candidates blocked → the enemy waits this turn.
  }

  // Advance the simulation by one turn. action ∈ {up,down,left,right,wait}.
  // Player acts first, then every living enemy takes exactly one turn.
  // A move blocked by a wall/edge does NOT consume a turn (enemies don't act);
  // attacking, waiting, and a successful move all DO consume a turn.
  function step(g, action) {
    if (g.state !== "playing") return g;
    const dir = DIRS[action];
    if (!dir) return g;

    let acted = true; // did the player consume a turn?

    if (dir.dx !== 0 || dir.dy !== 0) {
      const tx = g.player.x + dir.dx;
      const ty = g.player.y + dir.dy;
      const target = enemyAt(g.enemies, tx, ty);
      if (target) {
        // Bump-to-attack: deal damage once, remove a dead enemy once.
        target.hp -= g.player.atk;
        if (target.hp <= 0) {
          const i = g.enemies.indexOf(target);
          if (i !== -1) g.enemies.splice(i, 1);
        }
      } else if (isWall(g.grid, tx, ty)) {
        acted = false; // bonk: a blocked move into a wall/edge is a no-op turn
      } else {
        g.player.x = tx;
        g.player.y = ty;
        // Reaching the stairs descends; the final depth wins.
        if (tx === g.exit.x && ty === g.exit.y) {
          if (g.depth >= g.targetDepth) {
            g.state = "won";
            return g;
          }
          descend(g);
          return g;
        }
      }
    }
    // action === "wait" keeps acted = true.

    if (!acted) return g; // no turn passed → enemies don't move

    g.turn++;
    // Iterate over a snapshot so a splice during the loop can't skip/double an
    // enemy. Each living enemy acts exactly once.
    const actors = g.enemies.slice();
    for (const e of actors) {
      if (g.state !== "playing") break;
      if (e.hp > 0) enemyTurn(g, e);
    }
    return g;
  }

  // Regenerate the level one floor deeper, carrying hp forward.
  function descend(g) {
    g.depth++;
    const next = createGame({
      w: g.w,
      h: g.h,
      seed: g.seed,
      depth: g.depth,
      targetDepth: g.targetDepth,
    });
    g.grid = next.grid;
    g.rooms = next.rooms;
    g.player.x = next.player.x;
    g.player.y = next.player.y;
    g.enemies = next.enemies;
    g.exit = next.exit;
    g.turn = 0;
  }

  const Logic = {
    WALL,
    FLOOR,
    makeRng,
    randInt,
    DIRS,
    inBounds,
    isWall,
    enemyAt,
    isPassable,
    generateDungeon,
    roomCenter,
    createGame,
    enemyTurn,
    step,
    descend,
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Logic;
  } else {
    root.Logic = Logic;
  }
})(typeof window !== "undefined" ? window : globalThis);
