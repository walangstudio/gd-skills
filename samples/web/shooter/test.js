// Headless unit tests for the pure game logic. Run: node test.js
"use strict";
const assert = require("assert");
const L = require("./logic.js");

// A deterministic rng so spawns are reproducible. Returns the supplied values
// in order, repeating the last one (or 0) once exhausted.
function seqRng(values) {
  let i = 0;
  return () => {
    const v = values[Math.min(i, values.length - 1)];
    i++;
    return v === undefined ? 0 : v;
  };
}

// --- Group 1: helpers (clamp, hitsBox, inputVector) ---
assert.strictEqual(L.clamp(5, 0, 10), 5);
assert.strictEqual(L.clamp(-3, 0, 10), 0);
assert.strictEqual(L.clamp(99, 0, 10), 10);
assert.ok(
  L.hitsBox({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 }),
  "overlapping boxes collide"
);
assert.ok(
  !L.hitsBox({ x: 0, y: 0, w: 10, h: 10 }, { x: 50, y: 50, w: 10, h: 10 }),
  "distant boxes don't collide"
);
assert.strictEqual(L.inputVector({ right: true }), 1);
assert.strictEqual(L.inputVector({ left: true }), -1);
assert.strictEqual(L.inputVector({ left: true, right: true }), 0);

// --- Group 2: movement clamps to the play area ---
let g = L.createGame({ w: 200, h: 200 });
g.player.x = 0;
L.step(g, { left: true }, 1, null);
assert.strictEqual(g.player.x, 0, "clamped at left edge");
g.player.x = 0;
L.step(g, { right: true }, 10, null);
assert.strictEqual(g.player.x, g.w - g.player.w, "clamped at right edge");

// --- Group 3: fire cooldown — 1s of held fire at 0.25s cooldown = 4 shots ---
g = L.createGame({ fireCooldown: 0.25 });
let shots = 0;
for (let t = 0; t < 1; t += 0.05) {
  const before = g.bullets.length;
  L.step(g, { fire: true }, 0.05, null);
  if (g.bullets.length > before) shots++;
}
assert.strictEqual(shots, 4, "exactly 4 shots in 1s at 0.25s cooldown");

// --- Group 4: bullet-vs-enemy hit removes both, score increments ---
g = L.createGame({ goal: 99 });
g.bullets = [{ x: 50, y: 100, w: 4, h: 10, dead: false }];
g.enemies = [{ x: 44, y: 95, w: 28, h: 22, dead: false }];
L.step(g, {}, 0.016, null);
assert.strictEqual(g.score, 1, "one kill scored");
assert.strictEqual(g.bullets.length, 0, "bullet removed on hit");
assert.strictEqual(g.enemies.length, 0, "enemy removed on hit");

// --- Group 5: tunneling regression — fast bullet must not skip an enemy ---
// Bullet starts below the enemy and at a huge dt would jump far past it in one
// frame. Sub-stepping must still register the hit.
g = L.createGame({ goal: 99, bulletSpeed: 5000, enemySpeed: 0 });
g.bullets = [{ x: 50, y: 300, w: 4, h: 10, dead: false }];
g.enemies = [{ x: 44, y: 50, w: 28, h: 22, dead: false }];
// At dt=0.1, displacement = 500px, far beyond the 22px enemy — would tunnel
// without sub-stepping.
L.step(g, {}, 0.1, null);
assert.strictEqual(g.score, 1, "fast bullet hit the enemy in its path (no tunneling)");
assert.strictEqual(g.enemies.length, 0, "enemy destroyed by fast bullet");

// --- Group 6: enemy reaching the bottom costs a life ---
g = L.createGame({ lives: 3, enemySpeed: 1000 });
g.enemies = [{ x: 10, y: g.h - 30, w: 28, h: 22, dead: false }];
L.step(g, {}, 0.1, null);
assert.strictEqual(g.lives, 2, "bottom-reaching enemy costs a life");
assert.strictEqual(g.enemies.length, 0, "that enemy is removed");

// --- Group 7: enemy colliding with the player costs a life ---
g = L.createGame({ lives: 3, enemySpeed: 0 });
g.enemies = [
  { x: g.player.x, y: g.player.y - 5, w: 28, h: 22, dead: false },
];
L.step(g, {}, 0.016, null);
assert.strictEqual(g.lives, 2, "enemy touching the player costs a life");

// --- Group 8: win at target score ---
g = L.createGame({ goal: 1 });
g.bullets = [{ x: 50, y: 100, w: 4, h: 10, dead: false }];
g.enemies = [{ x: 44, y: 95, w: 28, h: 22, dead: false }];
L.step(g, {}, 0.016, null);
assert.strictEqual(g.state, "won", "reaching goal wins");

// --- Group 9: lose at 0 lives ---
g = L.createGame({ lives: 1, enemySpeed: 1000 });
g.enemies = [{ x: 10, y: g.h - 30, w: 28, h: 22, dead: false }];
L.step(g, {}, 0.1, null);
assert.strictEqual(g.lives, 0, "last life gone");
assert.strictEqual(g.state, "lost", "0 lives loses");

// --- Group 10: win/lose precedence — last-life loss wins over same-step goal ---
// On one step: a bullet kills an enemy (reaching the goal) while another enemy
// reaches the bottom and drains the last life. Survival is checked first => lost.
g = L.createGame({ goal: 1, lives: 1, enemySpeed: 1000 });
g.bullets = [{ x: 50, y: 100, w: 4, h: 10, dead: false }];
g.enemies = [
  { x: 44, y: 95, w: 28, h: 22, dead: false }, // killed by the bullet -> score 1
  { x: 200, y: g.h - 30, w: 28, h: 22, dead: false }, // reaches bottom -> -1 life
];
L.step(g, {}, 0.1, null);
assert.strictEqual(g.score, 1, "the kill still scored");
assert.strictEqual(g.lives, 0, "the last life was lost");
assert.strictEqual(g.state, "lost", "losing the last life takes precedence over the goal");

// --- Group 11: frozen after the game ends (no movement, spawning, or firing) ---
g = L.createGame();
g.state = "won";
const px = g.player.x;
const rng = seqRng([0.5]);
L.step(g, { right: true, fire: true }, 1, rng);
assert.strictEqual(g.player.x, px, "player frozen after win");
assert.strictEqual(g.bullets.length, 0, "no firing after win");
assert.strictEqual(g.enemies.length, 0, "no spawning after win");

// --- Group 12: a kill counts exactly once (one bullet, one enemy) ---
g = L.createGame({ goal: 99, bulletSpeed: 100, enemySpeed: 100 });
g.bullets = [{ x: 50, y: 100, w: 4, h: 10, dead: false }];
g.enemies = [{ x: 44, y: 95, w: 28, h: 22, dead: false }];
L.step(g, {}, 0.016, null); // hit + removal
L.step(g, {}, 0.016, null); // nothing left to hit
assert.strictEqual(g.score, 1, "kill counted exactly once across steps");

// --- Group 13: deterministic spawning via injected rng ---
g = L.createGame({ spawnInterval: 0.5 });
const r = seqRng([0, 1]); // first enemy at x=0, second at far right
L.step(g, {}, 0.5, r); // spawnTimer hits 0 -> one spawn
assert.strictEqual(g.enemies.length, 1, "one enemy spawned at the interval");
assert.strictEqual(g.enemies[0].x, 0, "first spawn x is deterministic from rng");

console.log("ok - all logic tests passed (13 groups)");
