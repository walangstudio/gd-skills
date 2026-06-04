// Headless unit tests for the pure game logic. Run: node test.js
"use strict";
const assert = require("assert");
const L = require("./logic.js");

// A simple straight path for deterministic movement: (0,0) -> (100,0) -> (200,0)
function straight() {
  return L.createGame({
    path: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 200, y: 0 }],
    waves: [{ count: 1, hp: 30, speed: 50, interval: 0 }],
    gold: 100,
    lives: 3,
  });
}

// enemy advances along the path toward the next waypoint
let g = straight();
g.enemies.push({ x: 0, y: 0, wp: 1, hp: 30, maxHp: 30, speed: 50, traveled: 0 });
g.waves = [{ count: 0, hp: 0, speed: 0, interval: 1 }]; // no spawning during this test
g.spawnedThisWave = 0;
L.step(g, 1); // 50px along the straight path
assert.ok(g.enemies.length === 1 && g.enemies[0].x === 50, "enemy advanced 50px along path");
assert.strictEqual(g.enemies[0].traveled, 50, "traveled tracked");

// reaching the end leaks: a life is lost and the enemy is removed
g = straight();
g.waves = [{ count: 0, hp: 0, speed: 0, interval: 1 }];
g.enemies.push({ x: 190, y: 0, wp: 2, hp: 30, maxHp: 30, speed: 50, traveled: 190 });
const livesBefore = g.lives;
L.step(g, 1); // 50px > remaining 10px → walks off the end
assert.strictEqual(g.enemies.length, 0, "leaked enemy removed");
assert.strictEqual(g.lives, livesBefore - 1, "leak cost a life");

// placeTower deducts gold; rejects when funds are insufficient or cell occupied
g = straight();
g.gold = 50;
g.towerCost = 50;
assert.strictEqual(L.placeTower(g, 100, 40), true, "tower placed");
assert.strictEqual(g.gold, 0, "gold deducted");
assert.strictEqual(L.placeTower(g, 100, 40), false, "rejected: no gold");
g.gold = 50;
assert.strictEqual(L.placeTower(g, 100, 40), false, "rejected: occupied cell");

// a tower in range damages and kills an enemy and grants gold
g = straight();
g.waves = [{ count: 0, hp: 0, speed: 0, interval: 1 }];
g.gold = 0;
g.killReward = 10;
g.towers.push({ x: 50, y: 0, range: 60, damage: 100, cooldown: 0.5, timer: 0 });
g.enemies.push({ x: 50, y: 0, wp: 1, hp: 30, maxHp: 30, speed: 0, traveled: 0 });
L.step(g, 0.016);
assert.strictEqual(g.enemies.length, 0, "enemy killed");
assert.strictEqual(g.gold, 10, "kill reward granted");

// tower targets the furthest-progressed in-range enemy
g = straight();
g.waves = [{ count: 0, hp: 0, speed: 0, interval: 1 }];
g.towers.push({ x: 50, y: 0, range: 200, damage: 5, cooldown: 0.5, timer: 0 });
const near = { x: 30, y: 0, wp: 1, hp: 30, maxHp: 30, speed: 0, traveled: 30 };
const far = { x: 70, y: 0, wp: 1, hp: 30, maxHp: 30, speed: 0, traveled: 70 };
g.enemies.push(near, far);
L.step(g, 0.016);
assert.strictEqual(far.hp, 25, "furthest enemy was targeted");
assert.strictEqual(near.hp, 30, "nearer-but-less-progressed enemy untouched");

// clearing all waves sets state "won"
g = L.createGame({
  path: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
  waves: [{ count: 1, hp: 10, speed: 0, interval: 0 }],
});
g.towers.push({ x: 0, y: 0, range: 50, damage: 100, cooldown: 0.1, timer: 0 });
L.step(g, 0.016); // spawn one, tower kills it, wave clears, only wave → won
assert.strictEqual(g.state, "won", "won when all waves cleared");

// leaking with the last life sets state "lost" (loss beats a same-step clear)
g = L.createGame({
  path: [{ x: 0, y: 0 }, { x: 10, y: 0 }],
  waves: [{ count: 1, hp: 10, speed: 0, interval: 1 }],
  lives: 1,
});
g.waves = [{ count: 0, hp: 0, speed: 0, interval: 1 }];
g.enemies.push({ x: 5, y: 0, wp: 1, hp: 10, maxHp: 10, speed: 50, traveled: 5 });
L.step(g, 1);
assert.strictEqual(g.lives, 0, "last life lost");
assert.strictEqual(g.state, "lost", "lost state at zero lives");

// no movement after won
g = straight();
g.state = "won";
g.enemies.push({ x: 10, y: 0, wp: 1, hp: 30, maxHp: 30, speed: 50, traveled: 0 });
L.step(g, 1);
assert.strictEqual(g.enemies[0].x, 10, "enemy frozen after win");

console.log("ok - all logic tests passed (9 groups)");
