// Headless unit tests for the pure game logic. Run: node test.js
"use strict";
const assert = require("assert");
const L = require("./logic.js");
const T = L.TILE;

// A small map factory: F floor, # wall, X exit. Enemies/items are passed separately.
function mapFrom(rows) {
  return rows.map((r) =>
    r.split("").map((ch) => (ch === "#" ? T.WALL : ch === "X" ? T.EXIT : T.FLOOR))
  );
}

// 1. inBounds / tileAt: off-map reads never throw and read as WALL
{
  const map = mapFrom(["FF", "FF"]);
  assert.ok(L.inBounds(map, 0, 0));
  assert.ok(!L.inBounds(map, -1, 0));
  assert.ok(!L.inBounds(map, 0, 2));
  assert.strictEqual(L.tileAt(map, 99, 99), T.WALL, "out-of-bounds reads as wall");
}

// 2. movement onto floor advances exactly one tile
{
  const g = L.createGame({ map: mapFrom(["FFF"]), startX: 0, startY: 0 });
  L.step(g, "right");
  assert.strictEqual(g.player.tileX, 1);
  assert.strictEqual(g.player.tileY, 0);
}

// 3. bounds-check: a move into each edge is a no-op, no crash
{
  const g = L.createGame({ map: mapFrom(["F"]), startX: 0, startY: 0 });
  L.step(g, "up");
  L.step(g, "down");
  L.step(g, "left");
  L.step(g, "right");
  assert.strictEqual(g.player.tileX, 0, "no movement off left/right edge");
  assert.strictEqual(g.player.tileY, 0, "no movement off top/bottom edge");
}

// 4. wall blocks movement (no-op)
{
  const g = L.createGame({ map: mapFrom(["F#"]), startX: 0, startY: 0 });
  L.step(g, "right");
  assert.strictEqual(g.player.tileX, 0, "wall blocks the step");
}

// 5. bump-combat: walking into an enemy attacks instead of moving
{
  const g = L.createGame({
    map: mapFrom(["FF"]),
    startX: 0,
    startY: 0,
    atk: 5,
    enemies: [{ x: 1, y: 0, hp: 30, atk: 4 }],
  });
  L.step(g, "right");
  assert.strictEqual(g.player.tileX, 0, "did not move onto enemy tile");
  assert.strictEqual(g.enemies[0].hp, 25, "enemy took player atk once");
  assert.strictEqual(g.player.hp, 16, "enemy struck back once (20-4)");
}

// 6. combat counts once per bump; kill removes enemy + grants xp/gold exactly once
{
  const g = L.createGame({
    map: mapFrom(["FF"]),
    startX: 0,
    startY: 0,
    atk: 5,
    enemies: [{ x: 1, y: 0, hp: 5, atk: 99, xp: 4, gold: 7 }],
  });
  L.step(g, "right");
  assert.strictEqual(g.enemies[0].hp, 0, "enemy dead");
  assert.strictEqual(g.player.hp, 20, "no counterattack from a dead enemy");
  assert.strictEqual(g.player.xp, 4, "xp granted once");
  assert.strictEqual(g.player.gold, 7, "gold granted once");
  // bumping the dead tile again does nothing (enemy is gone, tile is floor)
  L.step(g, "right");
  assert.strictEqual(g.player.tileX, 1, "moved onto now-empty tile");
  assert.strictEqual(g.player.xp, 4, "xp not granted twice");
}

// 7. level-up: a kill that crosses the threshold raises stats, refills hp, carries xp
{
  // threshold to leave level 1 is xpForLevel(1) = 10
  assert.strictEqual(L.xpForLevel(1), 10);
  const g = L.createGame({
    map: mapFrom(["FF"]),
    startX: 0,
    startY: 0,
    hp: 20,
    maxHp: 20,
    atk: 50,
    enemies: [{ x: 1, y: 0, hp: 1, atk: 0, xp: 12, gold: 0 }],
  });
  g.player.hp = 7; // damaged before the kill
  L.step(g, "right");
  assert.strictEqual(g.player.level, 2, "leveled up once");
  assert.strictEqual(g.player.xp, 2, "remaining xp carried over (12-10)");
  assert.strictEqual(g.player.maxHp, 25, "maxHp increased");
  assert.strictEqual(g.player.atk, 52, "atk increased");
  assert.strictEqual(g.player.hp, 25, "hp refilled to new maxHp");
}

// 8. item pickup: stepping onto an item tile adds it to inventory
{
  const g = L.createGame({
    map: mapFrom(["FF"]),
    startX: 0,
    startY: 0,
    items: [{ x: 1, y: 0, kind: "potion", heal: 8 }],
  });
  L.step(g, "right");
  assert.strictEqual(g.player.inventory.length, 1, "picked up one item");
  assert.strictEqual(g.player.inventory[0].kind, "potion");
  assert.ok(g.items[0].taken, "item marked taken");
  // stepping off and back does not duplicate
  L.step(g, "left");
  L.step(g, "right");
  assert.strictEqual(g.player.inventory.length, 1, "no duplicate pickup");
}

// 9. potion heals, caps at maxHp (no overheal), consumes exactly one
{
  const g = L.createGame({ map: mapFrom(["F"]), hp: 20, maxHp: 20 });
  g.player.hp = 18;
  g.player.inventory = [
    { kind: "potion", heal: 10 },
    { kind: "potion", heal: 10 },
  ];
  const ok = L.usePotion(g);
  assert.ok(ok, "potion used");
  assert.strictEqual(g.player.hp, 20, "healed but capped at maxHp");
  assert.strictEqual(g.player.inventory.length, 1, "consumed exactly one");
}

// 10. potion with no potion in inventory is a no-op
{
  const g = L.createGame({ map: mapFrom(["F"]) });
  g.player.inventory = [];
  assert.strictEqual(L.usePotion(g), false, "nothing to use");
}

// 11. player death: hp<=0 sets state "lost"
{
  const g = L.createGame({
    map: mapFrom(["FF"]),
    startX: 0,
    startY: 0,
    hp: 3,
    atk: 1,
    enemies: [{ x: 1, y: 0, hp: 99, atk: 10 }],
  });
  L.step(g, "right");
  assert.strictEqual(g.player.hp, 0, "hp floored at 0");
  assert.strictEqual(g.state, "lost", "player lost");
}

// 12. win requires all enemies cleared; reaching exit early does NOT win
{
  const g = L.createGame({
    map: mapFrom(["FXF"]),
    startX: 0,
    startY: 0,
    atk: 100,
    enemies: [{ x: 2, y: 0, hp: 5, atk: 0 }],
  });
  L.step(g, "right"); // step onto exit at x=1 with enemy alive
  assert.strictEqual(g.player.tileX, 1, "stepped onto exit tile");
  assert.strictEqual(g.state, "playing", "no win while an enemy lives");
  // clear the enemy, then re-enter the exit
  L.step(g, "right"); // bump-kill enemy at x=2 (no move)
  assert.strictEqual(L.aliveEnemies(g), 0, "enemy cleared");
  L.step(g, "left"); // move to x=0
  L.step(g, "right"); // back onto exit at x=1
  assert.strictEqual(g.state, "won", "won after clearing enemies and reaching exit");
}

// 13. frozen after win: no movement/combat/pickup
{
  const g = L.createGame({ map: mapFrom(["FF"]), startX: 0, startY: 0 });
  g.state = "won";
  L.step(g, "right");
  assert.strictEqual(g.player.tileX, 0, "frozen after win");
  assert.strictEqual(L.usePotion(g), false, "no potion use after win");
}

// 14. frozen after loss: no movement
{
  const g = L.createGame({ map: mapFrom(["FF"]), startX: 0, startY: 0 });
  g.state = "lost";
  L.step(g, "right");
  assert.strictEqual(g.player.tileX, 0, "frozen after loss");
}

console.log("ok - all logic tests passed (14 groups)");
