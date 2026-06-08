// Headless unit tests for the pure game logic. Run: node test.js
"use strict";
const assert = require("assert");
const L = require("./logic.js");

// A deterministic rng that always picks the first free cell.
const rngFirst = () => 0;

// snake advances one cell in the current direction
let g = L.createGame({ cols: 20, rows: 14 });
let head0 = { x: g.snake[0].x, y: g.snake[0].y };
let len0 = g.snake.length;
g.food = null; // no food ahead, so length stays constant
L.step(g, rngFirst);
assert.deepStrictEqual(g.snake[0], { x: head0.x + 1, y: head0.y }, "head moved right one cell");
assert.strictEqual(g.snake.length, len0, "length unchanged without food");

// 180-degree reversal is rejected by setDir
g = L.createGame({ cols: 20, rows: 14 }); // moving right
L.setDir(g, "left");
assert.strictEqual(g.nextDir, "right", "reversal rejected, nextDir unchanged");
L.setDir(g, "up");
assert.strictEqual(g.nextDir, "up", "perpendicular turn accepted");

// eating food grows the snake by one and increments score
g = L.createGame({ cols: 20, rows: 14 });
let len1 = g.snake.length;
let head1 = g.snake[0];
g.food = { x: head1.x + 1, y: head1.y }; // food directly ahead
L.step(g, rngFirst);
assert.strictEqual(g.score, 1, "score incremented on eat");
assert.strictEqual(g.snake.length, len1 + 1, "snake grew by one");
assert.ok(g.food, "new food placed after eating");

// wall collision sets state "dead"
g = L.createGame({ cols: 4, rows: 4 });
g.food = null;
L.step(g, rngFirst); // head x2 -> x3 (rightmost col, ok)
L.step(g, rngFirst); // x3 -> x4 out of bounds
assert.strictEqual(g.state, "dead", "wall collision kills");

// self-collision sets state "dead"
g = L.createGame({ cols: 20, rows: 14 });
g.food = null;
// hand-build a snake that loops back on itself with one down-turn
g.snake = [
  { x: 5, y: 5 },
  { x: 5, y: 6 },
  { x: 6, y: 6 },
  { x: 6, y: 5 },
  { x: 6, y: 4 },
];
g.dir = "up";
g.nextDir = "up";
L.setDir(g, "right"); // turn into the body at (6,5)
L.step(g, rngFirst);
assert.strictEqual(g.state, "dead", "self collision kills");

// no movement after death
g = L.createGame({ cols: 20, rows: 14 });
g.state = "dead";
let snapshot = JSON.stringify(g.snake);
L.step(g, rngFirst);
assert.strictEqual(JSON.stringify(g.snake), snapshot, "frozen after death");

// placeFood is deterministic and avoids the snake's body
g = L.createGame({ cols: 3, rows: 1 });
g.snake = [{ x: 0, y: 0 }, { x: 1, y: 0 }];
let f = L.placeFood(g, rngFirst);
assert.deepStrictEqual(f, { x: 2, y: 0 }, "food placed in the only free cell");

console.log("ok - all logic tests passed (7 groups)");
