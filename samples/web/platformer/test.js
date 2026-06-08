// Headless unit tests for the pure game logic. Run: node test.js
"use strict";
const assert = require("assert");
const L = require("./logic.js");

// clamp
assert.strictEqual(L.clamp(5, 0, 10), 5);
assert.strictEqual(L.clamp(-3, 0, 10), 0);
assert.strictEqual(L.clamp(99, 0, 10), 10);

// overlaps: AABB intersection vs disjoint boxes
assert.ok(L.overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 }));
assert.ok(!L.overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 50, y: 50, w: 10, h: 10 }));

// gravity increases vy while airborne (no platform under the player)
let g = L.createGame({ w: 400, h: 300, platforms: [] });
g.player = { x: 10, y: 10, w: 20, h: 24, vx: 0, vy: 0, onGround: false };
const vyBefore = g.player.vy;
L.step(g, {}, 0.1);
assert.ok(g.player.vy > vyBefore, "gravity increased vy while airborne");

// moving right increases x
g = L.createGame({ w: 400, h: 300, platforms: [] });
g.player = { x: 50, y: 10, w: 20, h: 24, vx: 0, vy: 0, onGround: false };
const xBefore = g.player.x;
L.step(g, { right: true }, 0.1);
assert.ok(g.player.x > xBefore, "moving right increased x");

// landing on a platform sets onGround=true and stops vy
g = L.createGame({
  w: 400,
  h: 300,
  platforms: [{ x: 0, y: 200, w: 400, h: 20 }],
});
// Place the player just above the platform, falling fast.
g.player = { x: 50, y: 170, w: 20, h: 24, vx: 0, vy: 300, onGround: false };
L.step(g, {}, 0.1);
assert.strictEqual(g.player.onGround, true, "landed: onGround set");
assert.strictEqual(g.player.vy, 0, "landed: vy stopped");
assert.strictEqual(g.player.y, 200 - 24, "landed: snapped to platform top");

// jump only works when onGround — no mid-air double jump
g = L.createGame({
  w: 400,
  h: 300,
  platforms: [{ x: 0, y: 200, w: 400, h: 20 }],
  jumpSpeed: 400,
});
// Resting on the platform.
g.player = { x: 50, y: 200 - 24, w: 20, h: 24, vx: 0, vy: 0, onGround: true };
L.step(g, { jump: true }, 0.016);
const vyAfterFirstJump = g.player.vy;
assert.ok(vyAfterFirstJump < 0, "first jump from ground moved player upward");
// Now airborne — a second jump must NOT add upward velocity again.
const vyBeforeSecondJump = g.player.vy;
L.step(g, { jump: true }, 0.016);
assert.ok(
  g.player.vy > vyBeforeSecondJump,
  "mid-air second jump did not boost upward (gravity still pulls down)"
);
assert.strictEqual(g.player.onGround, false, "still airborne after second jump attempt");

// player cannot fall through the world floor
g = L.createGame({ w: 400, h: 300, platforms: [] });
g.player = { x: 50, y: 250, w: 20, h: 24, vx: 0, vy: 5000, onGround: false };
L.step(g, {}, 0.5);
assert.ok(g.player.y + g.player.h <= g.h, "did not fall through the floor");
assert.strictEqual(g.player.onGround, true, "floor counts as ground");

// reaching the goal sets state "won"
g = L.createGame({
  w: 400,
  h: 300,
  platforms: [],
  goal: { x: 50, y: 10, w: 24, h: 40 },
});
g.player = { x: 48, y: 12, w: 20, h: 24, vx: 0, vy: 0, onGround: false };
L.step(g, {}, 0.016);
assert.strictEqual(g.state, "won", "overlapping the goal won the game");

// no movement after won
g = L.createGame({ w: 400, h: 300, platforms: [] });
g.state = "won";
g.player = { x: 50, y: 50, w: 20, h: 24, vx: 0, vy: 0, onGround: false };
const frozenX = g.player.x;
const frozenY = g.player.y;
L.step(g, { right: true, jump: true }, 0.5);
assert.strictEqual(g.player.x, frozenX, "x frozen after win");
assert.strictEqual(g.player.y, frozenY, "y frozen after win");

// regression: a fast faller must land on a thin platform, not tunnel through it
g = L.createGame({
  w: 200,
  h: 400,
  platforms: [{ x: 0, y: 200, w: 200, h: 12 }],
  goal: { x: -100, y: -100, w: 1, h: 1 }, // out of the way
});
g.player = { x: 80, y: 150, w: 20, h: 24, vx: 0, vy: 3000, onGround: false };
L.step(g, {}, 1 / 60); // ~50px of fall in one step, far more than the 12px platform
assert.strictEqual(g.player.onGround, true, "fast faller lands on the thin platform (no tunneling)");
assert.strictEqual(g.player.y, 200 - 24, "snapped to the platform top");

console.log("ok - all logic tests passed (10 groups)");
