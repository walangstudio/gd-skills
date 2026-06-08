// Pure game logic — no DOM, no canvas. Works in the browser (attaches to window)
// and in Node (module.exports), so the mechanics can be unit-tested headless.
// See test.js. The rendering/input lives in game.js.
//
// Top-down tile RPG slice: tile-stepped movement, bump-combat, items, leveling.
// All combat is deterministic — no Math.random here. Inject opts.rng if you want
// variance and keep logic.js testable.

(function (root) {
  "use strict";

  // Tile codes used by the 2D map array.
  const TILE = { FLOOR: 0, WALL: 1, ENEMY: 2, ITEM: 3, EXIT: 4 };

  const DIRS = {
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 },
  };

  function inBounds(map, x, y) {
    return y >= 0 && y < map.length && x >= 0 && x < map[0].length;
  }

  function tileAt(map, x, y) {
    return inBounds(map, x, y) ? map[y][x] : TILE.WALL;
  }

  function enemyAt(g, x, y) {
    return g.enemies.find((e) => e.hp > 0 && e.x === x && e.y === y) || null;
  }

  function itemAt(g, x, y) {
    return g.items.find((it) => !it.taken && it.x === x && it.y === y) || null;
  }

  function xpForLevel(level) {
    // xp needed to advance FROM `level` to `level+1`.
    return level * 10;
  }

  function aliveEnemies(g) {
    return g.enemies.filter((e) => e.hp > 0).length;
  }

  // Deep-ish clone of a row-major map so mutating one game can't bleed into another.
  function cloneMap(map) {
    return map.map((row) => row.slice());
  }

  function createGame(opts) {
    const o = opts || {};
    const map = o.map ? cloneMap(o.map) : [[TILE.FLOOR]];
    return {
      map,
      player: {
        tileX: o.startX != null ? o.startX : 0,
        tileY: o.startY != null ? o.startY : 0,
        hp: o.hp || 20,
        maxHp: o.maxHp || o.hp || 20,
        atk: o.atk || 5,
        xp: 0,
        level: 1,
        gold: 0,
        inventory: o.inventory ? o.inventory.slice() : [],
      },
      enemies: (o.enemies || []).map((e) => ({
        x: e.x,
        y: e.y,
        hp: e.hp,
        maxHp: e.maxHp || e.hp,
        atk: e.atk,
        xp: e.xp != null ? e.xp : 5,
        gold: e.gold != null ? e.gold : 3,
      })),
      items: (o.items || []).map((it) => ({
        x: it.x,
        y: it.y,
        kind: it.kind || "potion",
        heal: it.heal != null ? it.heal : 10,
        taken: false,
      })),
      log: [],
      state: "playing", // playing | won | lost
    };
  }

  function levelUp(p) {
    // Crossing the threshold may apply multiple times if a big kill overshoots.
    while (p.xp >= xpForLevel(p.level)) {
      p.xp -= xpForLevel(p.level);
      p.level += 1;
      p.maxHp += 5;
      p.atk += 2;
      p.hp = p.maxHp; // refill on level up
    }
  }

  // Resolve a bump into an enemy: player hits first; surviving enemy hits back.
  // Counts exactly once per call. Returns the (possibly dead) enemy.
  function fight(g, enemy) {
    const p = g.player;
    enemy.hp -= p.atk;
    if (enemy.hp <= 0) {
      enemy.hp = 0;
      p.xp += enemy.xp;
      p.gold += enemy.gold;
      g.log.push("defeated enemy");
      levelUp(p);
      return enemy;
    }
    // Enemy survived — it strikes back.
    p.hp -= enemy.atk;
    if (p.hp <= 0) {
      p.hp = 0;
      g.state = "lost";
      g.log.push("you died");
    }
    return enemy;
  }

  // Use one potion from inventory, healing up to maxHp (no overheal).
  function usePotion(g) {
    if (g.state !== "playing") return false;
    const p = g.player;
    const idx = p.inventory.findIndex((i) => i.kind === "potion");
    if (idx < 0) return false;
    const potion = p.inventory[idx];
    p.inventory.splice(idx, 1); // consume exactly one
    p.hp = Math.min(p.maxHp, p.hp + (potion.heal != null ? potion.heal : 10));
    g.log.push("used potion");
    return true;
  }

  // Advance one tile-step in the given direction ("up"|"down"|"left"|"right").
  // Frozen once the game is over. Returns the game.
  function step(g, dir) {
    if (g.state !== "playing") return g;
    const d = DIRS[dir];
    if (!d) return g;

    const p = g.player;
    const nx = p.tileX + d.dx;
    const ny = p.tileY + d.dy;

    // Off-map edge: no-op, never an out-of-bounds access.
    if (!inBounds(g.map, nx, ny)) return g;

    // Enemy on the target tile: bump-combat, no movement.
    const enemy = enemyAt(g, nx, ny);
    if (enemy) {
      fight(g, enemy);
      return g;
    }

    // Wall blocks movement.
    if (tileAt(g.map, nx, ny) === TILE.WALL) return g;

    // Floor / item / exit: move onto the tile.
    p.tileX = nx;
    p.tileY = ny;

    // Pick up an item standing on this tile.
    const item = itemAt(g, nx, ny);
    if (item) {
      item.taken = true;
      p.inventory.push({ kind: item.kind, heal: item.heal });
      g.log.push("picked up " + item.kind);
    }

    // Win: reach the exit tile with every enemy cleared.
    if (tileAt(g.map, nx, ny) === TILE.EXIT && aliveEnemies(g) === 0) {
      g.state = "won";
      g.log.push("you escaped");
    }

    return g;
  }

  const Logic = {
    TILE,
    DIRS,
    inBounds,
    tileAt,
    enemyAt,
    itemAt,
    xpForLevel,
    aliveEnemies,
    createGame,
    levelUp,
    fight,
    usePotion,
    step,
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Logic;
  } else {
    root.Logic = Logic;
  }
})(typeof window !== "undefined" ? window : globalThis);
