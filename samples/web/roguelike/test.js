// Headless unit tests for the pure game logic. Run: node test.js
"use strict";
const assert = require("assert");
const L = require("./logic.js");

// Helper: build a tiny hand-made game state on a known grid so movement and
// combat are deterministic and easy to reason about. 1 = wall, 0 = floor.
function world(rows, opts) {
  const o = opts || {};
  const grid = rows.map((r) => r.split("").map((c) => (c === "#" ? L.WALL : L.FLOOR)));
  return {
    w: grid[0].length,
    h: grid.length,
    seed: 1,
    depth: 1,
    targetDepth: 3,
    grid,
    rooms: [],
    player: o.player || { x: 1, y: 1, hp: 10, maxHp: 10, atk: 2 },
    enemies: o.enemies || [],
    exit: o.exit || { x: -1, y: -1 },
    state: "playing",
    turn: 0,
  };
}

// 1. Deterministic RNG: same seed → same stream.
{
  const a = L.makeRng(42);
  const b = L.makeRng(42);
  assert.strictEqual(a(), b(), "same seed yields same first value");
  assert.strictEqual(a(), b(), "and the second value too");
  const c = L.makeRng(7);
  assert.notStrictEqual(L.makeRng(42)(), c(), "different seeds diverge");
}

// 2. Determinism: generateDungeon with the same seed twice → identical grid.
{
  const g1 = L.generateDungeon(24, 16, L.makeRng(123));
  const g2 = L.generateDungeon(24, 16, L.makeRng(123));
  assert.deepStrictEqual(g1.grid, g2.grid, "same seed → identical dungeon grid");
  const g3 = L.generateDungeon(24, 16, L.makeRng(999));
  assert.notDeepStrictEqual(g1.grid, g3.grid, "different seed → different grid");
}

// 3. Determinism end-to-end: same seed + same actions → identical outcome.
{
  const acts = ["right", "down", "right", "wait", "left", "up"];
  const run = (seed) => {
    const g = L.createGame({ seed, w: 24, h: 16 });
    for (const a of acts) L.step(g, a);
    return g;
  };
  const x = run(2024);
  const y = run(2024);
  assert.deepStrictEqual(x.grid, y.grid, "same seed → same grid");
  assert.deepStrictEqual(x.player, y.player, "same seed+actions → same player");
  assert.deepStrictEqual(x.enemies, y.enemies, "same seed+actions → same enemies");
  assert.strictEqual(x.state, y.state, "same final state");
}

// 4. Player blocked by a wall: position unchanged, and the bonk does NOT pass a
//    turn (documented choice: a blocked move into a wall is a no-op).
{
  const g = world(["#####", "#...#", "#####"], {
    player: { x: 1, y: 1, hp: 10, maxHp: 10, atk: 2 },
    enemies: [{ x: 3, y: 1, hp: 3, atk: 1 }],
  });
  L.step(g, "up"); // wall above
  assert.strictEqual(g.player.y, 1, "blocked by wall above, no move");
  assert.strictEqual(g.turn, 0, "blocked move does not consume a turn");
  assert.strictEqual(g.enemies[0].x, 3, "enemy did not act on a wasted bonk");
}

// 5. Player blocked at the map edge: never indexes out of bounds.
{
  const g = world(["...", "...", "..."], {
    player: { x: 0, y: 0, hp: 10, maxHp: 10, atk: 2 },
  });
  L.step(g, "left"); // x would be -1
  assert.strictEqual(g.player.x, 0, "clamped at left edge");
  L.step(g, "up"); // y would be -1
  assert.strictEqual(g.player.y, 0, "clamped at top edge");
}

// 6. Enemy does not walk through a wall: a wall between enemy and player blocks
//    the greedy step, and the enemy holds position rather than phasing through.
{
  const g = world(["#####", "#.#.#", "#####"], {
    player: { x: 1, y: 1, hp: 10, maxHp: 10, atk: 2 },
    enemies: [{ x: 3, y: 1, hp: 3, atk: 1 }],
  });
  L.step(g, "wait"); // player passes the turn; enemy tries to chase left
  assert.strictEqual(g.enemies[0].x, 3, "enemy blocked by wall, stays put");
  assert.strictEqual(g.enemies[0].y, 1, "enemy did not phase through wall");
}

// 7. Enemy moves toward the player exactly ONE tile per player turn.
{
  const g = world(["#######", "#.....#", "#######"], {
    player: { x: 1, y: 1, hp: 10, maxHp: 10, atk: 2 },
    enemies: [{ x: 5, y: 1, hp: 3, atk: 1 }],
  });
  L.step(g, "wait");
  assert.strictEqual(g.enemies[0].x, 4, "enemy stepped exactly one tile closer");
  L.step(g, "wait");
  assert.strictEqual(g.enemies[0].x, 3, "and exactly one more on the next turn");
}

// 8. Enemies act exactly once per turn — each of several enemies moves at most
//    one tile after a single player action.
{
  const g = world(["#########", "#.......#", "#.......#", "#########"], {
    player: { x: 1, y: 1, hp: 10, maxHp: 10, atk: 2 },
    enemies: [
      { x: 6, y: 1, hp: 3, atk: 1 },
      { x: 6, y: 2, hp: 3, atk: 1 },
    ],
  });
  const before = g.enemies.map((e) => ({ x: e.x, y: e.y }));
  L.step(g, "wait");
  for (let i = 0; i < g.enemies.length; i++) {
    const d = Math.abs(g.enemies[i].x - before[i].x) + Math.abs(g.enemies[i].y - before[i].y);
    assert.ok(d <= 1, "enemy " + i + " moved at most one tile");
  }
}

// 9. No stacking: two enemies cannot end on the same tile. The second enemy's
//    greedy target is taken, so it falls back to the other axis (or waits).
{
  const g = world(["#####", "#...#", "#...#", "#####"], {
    player: { x: 1, y: 1, hp: 10, maxHp: 10, atk: 2 },
    enemies: [
      { x: 3, y: 1, hp: 3, atk: 1 }, // moves left to (2,1)
      { x: 3, y: 2, hp: 3, atk: 1 }, // wants (2,2)/(3,1); must not land on the first
    ],
  });
  L.step(g, "wait");
  const occ = new Set(g.enemies.map((e) => e.x + "," + e.y));
  assert.strictEqual(occ.size, g.enemies.length, "no two enemies share a tile");
}

// 10. Combat: bumping an enemy deals damage exactly once per bump.
{
  const g = world(["####", "#..#", "####"], {
    player: { x: 1, y: 1, hp: 10, maxHp: 10, atk: 2 },
    enemies: [{ x: 2, y: 1, hp: 3, atk: 1 }],
  });
  L.step(g, "right"); // bump → 3-2 = 1 hp
  assert.strictEqual(g.enemies[0].hp, 1, "one bump applies damage once");
  assert.strictEqual(g.player.x, 1, "attacking does not move the player");
}

// 11. A dead enemy is removed exactly once (no double splice / phantom).
{
  const g = world(["####", "#..#", "####"], {
    player: { x: 1, y: 1, hp: 10, maxHp: 10, atk: 5 },
    enemies: [{ x: 2, y: 1, hp: 3, atk: 1 }],
  });
  L.step(g, "right"); // 3 - 5 ≤ 0 → removed
  assert.strictEqual(g.enemies.length, 0, "dead enemy removed exactly once");
}

// 12. Attacking is a turn: the player attacks one enemy, and OTHER enemies
//     still take their turn (the attack consumed the player's action).
{
  const g = world(["#######", "#.....#", "#######"], {
    player: { x: 1, y: 1, hp: 10, maxHp: 10, atk: 2 },
    enemies: [
      { x: 2, y: 1, hp: 3, atk: 1 }, // adjacent → gets attacked, then chases
      { x: 5, y: 1, hp: 3, atk: 1 }, // far → should step one tile closer
    ],
  });
  L.step(g, "right"); // attack the adjacent enemy
  assert.strictEqual(g.enemies[1].x, 4, "far enemy still acted after the attack");
  assert.strictEqual(g.turn, 1, "the attack consumed a turn");
}

// 13. Enemy moving into the player attacks: player loses hp; hp<=0 → lost.
{
  const g = world(["####", "#..#", "####"], {
    player: { x: 1, y: 1, hp: 1, maxHp: 10, atk: 2 },
    enemies: [{ x: 2, y: 1, hp: 3, atk: 1 }],
  });
  L.step(g, "wait"); // enemy bumps player for 1 → hp 0 → lost
  assert.strictEqual(g.player.hp, 0, "enemy attack dropped player to 0");
  assert.strictEqual(g.state, "lost", "player death → lost state");
}

// 14. Frozen after the game ends: no turns process once state != "playing".
{
  const g = world(["####", "#..#", "####"], {
    player: { x: 1, y: 1, hp: 10, maxHp: 10, atk: 2 },
    enemies: [{ x: 2, y: 1, hp: 3, atk: 1 }],
  });
  g.state = "won";
  const snap = JSON.stringify({ p: g.player, e: g.enemies, t: g.turn });
  L.step(g, "right");
  L.step(g, "wait");
  assert.strictEqual(JSON.stringify({ p: g.player, e: g.enemies, t: g.turn }), snap, "frozen after game over");
}

// 15. Reaching the stairs descends; reaching them at target depth wins.
{
  const g = world(["####", "#..#", "####"], {
    player: { x: 1, y: 1, hp: 10, maxHp: 10, atk: 2 },
    exit: { x: 2, y: 1 },
  });
  g.depth = 1;
  g.targetDepth = 2;
  L.step(g, "right"); // onto stairs → descend to depth 2
  assert.strictEqual(g.depth, 2, "stepping on stairs descended");
  assert.strictEqual(g.state, "playing", "still playing after a descent");

  const g2 = world(["####", "#..#", "####"], {
    player: { x: 1, y: 1, hp: 10, maxHp: 10, atk: 2 },
    exit: { x: 2, y: 1 },
  });
  g2.depth = 2;
  g2.targetDepth = 2;
  L.step(g2, "right"); // stairs at the final depth → win
  assert.strictEqual(g2.state, "won", "stairs at target depth → won");
}

console.log("ok - all logic tests passed (15 groups)");
