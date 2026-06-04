// Headless unit tests for the pure game logic. Run: node test.js
"use strict";
const assert = require("assert");
const L = require("./logic.js");

// clamp
assert.strictEqual(L.clamp(5, 0, 10), 5);
assert.strictEqual(L.clamp(-3, 0, 10), 0);
assert.strictEqual(L.clamp(99, 0, 10), 10);

// inputVector: diagonals are unit length, single axis is ±1
let v = L.inputVector({ right: true, down: true });
assert.ok(Math.abs(Math.hypot(v.vx, v.vy) - 1) < 1e-9, "diagonal normalized");
assert.deepStrictEqual(L.inputVector({ right: true }), { vx: 1, vy: 0 });
assert.deepStrictEqual(L.inputVector({ left: true, right: true }), { vx: 0, vy: 0 });

// hitsCircle: overlap vs no overlap
assert.ok(L.hitsCircle({ x: 0, y: 0, w: 24, h: 24 }, { x: 12, y: 12, r: 9 }));
assert.ok(!L.hitsCircle({ x: 0, y: 0, w: 24, h: 24 }, { x: 200, y: 200, r: 9 }));

// movement clamps to the play area
let g = L.createGame({ w: 100, h: 100 });
g.player.x = 0;
L.step(g, { left: true }, 1);
assert.strictEqual(g.player.x, 0, "clamped at left edge");
g.player.x = 0;
L.step(g, { right: true }, 10);
assert.strictEqual(g.player.x, g.w - g.player.w, "clamped at right edge");

// collecting all coins reaches the win state
g = L.createGame({ goal: 2 });
g.player = { x: 0, y: 0, w: 24, h: 24 };
g.coins = [
  { x: 10, y: 10, r: 9, taken: false },
  { x: 12, y: 12, r: 9, taken: false },
];
L.step(g, {}, 0.016);
assert.strictEqual(g.score, 2, "both coins collected");
assert.strictEqual(g.state, "won", "win state reached");

// a coin is only counted once
g = L.createGame({ goal: 1 });
g.player = { x: 0, y: 0, w: 24, h: 24 };
g.coins = [{ x: 10, y: 10, r: 9, taken: false }];
L.step(g, {}, 0.016);
L.step(g, {}, 0.016);
assert.strictEqual(g.score, 1, "coin counted once");

// no movement once won
g = L.createGame();
g.state = "won";
const px = g.player.x;
L.step(g, { right: true }, 1);
assert.strictEqual(g.player.x, px, "frozen after win");

console.log("ok - all logic tests passed (8 groups)");
