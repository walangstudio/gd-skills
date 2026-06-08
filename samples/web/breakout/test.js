// Headless unit tests for the pure game logic. Run: node test.js
"use strict";
const assert = require("assert");
const L = require("./logic.js");

// clamp
assert.strictEqual(L.clamp(5, 0, 10), 5);
assert.strictEqual(L.clamp(-3, 0, 10), 0);
assert.strictEqual(L.clamp(99, 0, 10), 10);

// setPaddle clamps to [0, w - paddle.w]
let g = L.createGame({ w: 480, h: 320 });
L.setPaddle(g, -50);
assert.strictEqual(g.paddle.x, 0, "paddle clamped at left");
L.setPaddle(g, 9999);
assert.strictEqual(g.paddle.x, g.w - g.paddle.w, "paddle clamped at right");

// ball reflects off the right wall (vx sign flips at the edge)
g = L.createGame({ w: 480, h: 320 });
g.bricks = [];
g.ball = { x: g.w - 6, y: 100, vx: 60, vy: 0, r: 6 };
L.step(g, 0.1);
assert.ok(g.ball.vx < 0, "vx flips negative at right wall");

// ball reflects off the left wall
g = L.createGame({ w: 480, h: 320 });
g.bricks = [];
g.ball = { x: 6, y: 100, vx: -60, vy: 0, r: 6 };
L.step(g, 0.1);
assert.ok(g.ball.vx > 0, "vx flips positive at left wall");

// ball reflects off the ceiling (vy flips at top)
g = L.createGame({ w: 480, h: 320 });
g.bricks = [];
g.ball = { x: 100, y: 6, vx: 0, vy: -60, r: 6 };
L.step(g, 0.1);
assert.ok(g.ball.vy > 0, "vy flips positive at ceiling");

// hitting a brick kills it and increments score
g = L.createGame({ w: 480, h: 320 });
g.bricks = [{ x: 100, y: 100, w: 40, h: 16, alive: true }];
g.ball = { x: 120, y: 90, vx: 0, vy: 60, r: 6 };
const before = g.score;
L.step(g, 0.1);
assert.strictEqual(g.bricks[0].alive, false, "brick killed on hit");
assert.strictEqual(g.score, before + 1, "score incremented on brick hit");

// clearing the last brick sets state "won"
g = L.createGame({ w: 480, h: 320 });
g.bricks = [{ x: 100, y: 100, w: 40, h: 16, alive: true }];
g.ball = { x: 120, y: 90, vx: 0, vy: 60, r: 6 };
L.step(g, 0.1);
assert.strictEqual(g.state, "won", "win state when no bricks remain");

// ball below the bottom decrements lives (and survives with > 0 left)
g = L.createGame({ w: 480, h: 320, lives: 2 });
g.bricks = [{ x: 0, y: 0, w: 10, h: 10, alive: true }];
g.ball = { x: 240, y: g.h + 5, vx: 0, vy: 60, r: 6 };
L.step(g, 0.1);
assert.strictEqual(g.lives, 1, "life lost when ball passes bottom");
assert.strictEqual(g.state, "playing", "still playing with lives left");

// last life lost sets state "lost"
g = L.createGame({ w: 480, h: 320, lives: 1 });
g.bricks = [{ x: 0, y: 0, w: 10, h: 10, alive: true }];
g.ball = { x: 240, y: g.h + 5, vx: 0, vy: 60, r: 6 };
L.step(g, 0.1);
assert.strictEqual(g.lives, 0, "lives reach zero");
assert.strictEqual(g.state, "lost", "lost state at zero lives");

// no movement after won
g = L.createGame({ w: 480, h: 320 });
g.state = "won";
const wx = g.ball.x;
const wy = g.ball.y;
L.step(g, 1);
assert.strictEqual(g.ball.x, wx, "ball frozen x after win");
assert.strictEqual(g.ball.y, wy, "ball frozen y after win");

// no movement after lost
g = L.createGame({ w: 480, h: 320 });
g.state = "lost";
const lx = g.ball.x;
const ly = g.ball.y;
L.step(g, 1);
assert.strictEqual(g.ball.x, lx, "ball frozen x after loss");
assert.strictEqual(g.ball.y, ly, "ball frozen y after loss");

// regression: a fast ball must NOT tunnel through a brick in one step
g = L.createGame({ w: 480, h: 320 });
g.bricks = [{ x: 100, y: 150, w: 40, h: 16, alive: true }];
g.ball = { x: 120, y: 120, vx: 0, vy: 600, r: 6 }; // 60px of travel in one 0.1s step
L.step(g, 0.1);
assert.strictEqual(g.bricks[0].alive, false, "fast ball hits the brick (no tunneling)");

// regression: clearing the last brick wins even if the ball exits the bottom same step
g = L.createGame({ w: 480, h: 320, lives: 1 });
g.bricks = [{ x: 100, y: 100, w: 40, h: 16, alive: true }];
g.ball = { x: 120, y: 95, vx: 0, vy: 60, r: 6 };
L.step(g, 0.1);
assert.strictEqual(g.state, "won", "last brick cleared wins over a same-step bottom-out");

console.log("ok - all logic tests passed (13 groups)");
