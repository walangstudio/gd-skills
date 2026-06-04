// Headless unit tests for the pure game logic. Run: node test.js
"use strict";
const assert = require("assert");
const L = require("./logic.js");

// Deterministic seeded RNG so refills are reproducible.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clone(grid) {
  return grid.map((row) => row.slice());
}

function makeG(grid, colors) {
  return { cols: grid[0].length, rows: grid.length, colors: colors || 5, grid, score: 0, state: "playing" };
}

// findMatches detects a horizontal 3-run
let cells = L.findMatches([
  [1, 1, 1, 2],
  [2, 3, 4, 0],
]);
assert.strictEqual(cells.length, 3, "horizontal 3-run found");

// findMatches detects a vertical 3-run
cells = L.findMatches([
  [1, 2],
  [1, 3],
  [1, 4],
]);
assert.strictEqual(cells.length, 3, "vertical 3-run found");

// findMatches returns nothing for a no-match (checkerboard) grid
cells = L.findMatches([
  [0, 1, 0, 1],
  [1, 0, 1, 0],
  [0, 1, 0, 1],
]);
assert.strictEqual(cells.length, 0, "no matches on a checkerboard");

// non-adjacent swap is rejected
let g = makeG([
  [0, 1, 2, 3],
  [1, 2, 3, 4],
  [2, 3, 4, 0],
  [1, 2, 1, 1],
]);
assert.strictEqual(L.swap(g, { r: 0, c: 0 }, { r: 3, c: 3 }, mulberry32(1)).moved, false, "non-adjacent rejected");

// a swap that creates NO match reverts (grid unchanged)
g = makeG([
  [0, 1, 2, 3],
  [1, 2, 3, 4],
  [2, 3, 4, 0],
  [1, 2, 1, 1],
]);
let before = clone(g.grid);
let res = L.swap(g, { r: 0, c: 0 }, { r: 0, c: 1 }, mulberry32(1));
assert.strictEqual(res.moved, false, "no-match swap rejected");
assert.deepStrictEqual(g.grid, before, "grid reverted exactly");

// a swap that creates a match returns moved:true, clears >=3, scores
g = makeG([
  [0, 1, 2, 3],
  [1, 2, 3, 4],
  [2, 3, 4, 0],
  [1, 2, 1, 1], // swap (3,0)<->(3,1) => row3 = 2,1,1,1 -> a 3-run
]);
res = L.swap(g, { r: 3, c: 0 }, { r: 3, c: 1 }, mulberry32(7));
assert.strictEqual(res.moved, true, "matching swap accepted");
assert.ok(res.cleared >= 3, "cleared at least the 3-run");
assert.ok(g.score >= 3, "score increased by cleared cells");

// after a successful swap the board fully settles: no matches, no holes
assert.strictEqual(L.findMatches(g.grid).length, 0, "no matches remain (cascades resolved)");
let holes = 0;
for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) if (g.grid[r][c] === null) holes++;
assert.strictEqual(holes, 0, "no empty cells remain (refilled)");

// gravity collapses a column, leaving no hole under a filled cell
g = makeG([
  [1, 9],
  [null, 9],
  [2, 9],
]);
L.applyGravity(g);
assert.strictEqual(g.grid[0][0], null, "top cell emptied");
assert.strictEqual(g.grid[1][0], 1, "gems settled to the bottom");
assert.strictEqual(g.grid[2][0], 2, "bottom gem in place");

console.log("ok - all logic tests passed (8 groups)");
