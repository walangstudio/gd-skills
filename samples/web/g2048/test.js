// Headless unit tests for the pure game logic. Run: node test.js
"use strict";
const assert = require("assert");
const L = require("./logic.js");

// slideRowLeft: compress non-zeros left
assert.deepStrictEqual(L.slideRowLeft([0, 2, 0, 2]).row, [4, 0, 0, 0]);
assert.deepStrictEqual(L.slideRowLeft([2, 0, 0, 4]).row, [2, 4, 0, 0]);

// slideRowLeft: single merge of an equal adjacent pair
assert.deepStrictEqual(L.slideRowLeft([2, 2, 0, 0]).row, [4, 0, 0, 0]);
assert.deepStrictEqual(L.slideRowLeft([2, 2, 2, 0]).row, [4, 2, 0, 0]);

// no-double-merge: a tile born from a merge must not merge again this move
assert.deepStrictEqual(L.slideRowLeft([2, 2, 2, 2]).row, [4, 4, 0, 0]);
assert.deepStrictEqual(L.slideRowLeft([4, 4, 2, 2]).row, [8, 4, 0, 0]);

// scoring: gained = sum of new merged values
assert.strictEqual(L.slideRowLeft([2, 2, 2, 2]).gained, 8); // 4 + 4
assert.strictEqual(L.slideRowLeft([4, 4, 2, 2]).gained, 12); // 8 + 4
assert.strictEqual(L.slideRowLeft([2, 4, 8, 16]).gained, 0); // nothing merges

// move left across the whole grid
let res = L.move(
  [
    [2, 2, 0, 0],
    [4, 0, 4, 0],
    [0, 0, 0, 0],
    [2, 2, 2, 2],
  ],
  "left",
);
assert.deepStrictEqual(res.grid, [
  [4, 0, 0, 0],
  [8, 0, 0, 0],
  [0, 0, 0, 0],
  [4, 4, 0, 0],
]);
assert.strictEqual(res.moved, true);
assert.strictEqual(res.gained, 20); // 4 (row0) + 8 (row1) + 8 (row3 two 4s)

// move right: tiles pack to the right, reusing slideRowLeft via reverse
res = L.move(
  [
    [0, 0, 2, 2],
    [2, 0, 2, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  "right",
);
assert.deepStrictEqual(res.grid[0], [0, 0, 0, 4]);
assert.deepStrictEqual(res.grid[1], [0, 0, 0, 4]);

// move up: a column merges via transpose
res = L.move(
  [
    [2, 0, 0, 0],
    [2, 0, 0, 0],
    [4, 0, 0, 0],
    [4, 0, 0, 0],
  ],
  "up",
);
assert.deepStrictEqual(res.grid, [
  [4, 0, 0, 0],
  [8, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
]);

// move down: same column packs to the bottom
res = L.move(
  [
    [2, 0, 0, 0],
    [2, 0, 0, 0],
    [4, 0, 0, 0],
    [4, 0, 0, 0],
  ],
  "down",
);
assert.deepStrictEqual(res.grid, [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [4, 0, 0, 0],
  [8, 0, 0, 0],
]);

// moved=false on a no-op move so we don't spawn a tile
res = L.move(
  [
    [2, 4, 8, 16],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  "left",
);
assert.strictEqual(res.moved, false);
assert.strictEqual(res.gained, 0);

// spawnTile: deterministic rng lands on the expected empty cell, never overwrites
{
  const grid = [
    [2, 4, 8, 16],
    [0, 0, 0, 0], // 4 empties at indices 0..3
    [0, 0, 0, 0], // indices 4..7
    [0, 0, 0, 0], // indices 8..11 (12 empties total)
  ];
  // first rng() picks the cell index, second decides 2-vs-4.
  // 0/12 -> index 0 -> {r:1,c:0}; 0.5 < 0.9 -> value 2.
  let calls = [0, 0.5];
  let i = 0;
  const rng = () => calls[i++];
  const out = L.spawnTile(grid, rng);
  assert.strictEqual(out[1][0], 2, "spawned a 2 on the first empty cell");
  // original non-empty cells untouched
  assert.deepStrictEqual(out[0], [2, 4, 8, 16], "non-empty row not overwritten");
  // a 4 spawns when the value-roll is >= 0.9
  calls = [0, 0.95];
  i = 0;
  const out4 = L.spawnTile(grid, rng);
  assert.strictEqual(out4[1][0], 4, "spawned a 4 when roll >= 0.9");
}

// spawnTile: a full grid is returned unchanged
{
  const full = [
    [2, 4, 8, 16],
    [32, 64, 128, 256],
    [512, 1024, 2, 4],
    [8, 16, 32, 64],
  ];
  const out = L.spawnTile(full, () => 0);
  assert.deepStrictEqual(out, full, "full grid unchanged on spawn");
}

// hasMoves: full board with an adjacent equal pair still has a move
assert.strictEqual(
  L.hasMoves([
    [2, 2, 4, 8],
    [16, 32, 64, 128],
    [256, 512, 1024, 2],
    [4, 8, 16, 32],
  ]),
  true,
  "adjacent equal pair => moves remain",
);

// hasMoves: full board with all distinct neighbors has no move
assert.strictEqual(
  L.hasMoves([
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 4],
    [4, 2, 4, 2],
  ]),
  false,
  "checkerboard => stuck",
);

// win detection: state becomes "won" when 2048 appears
{
  const game = {
    grid: [
      [1024, 1024, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    score: 0,
    state: "playing",
  };
  L.applyMove(game, "left", () => 0);
  assert.strictEqual(game.grid[0][0], 2048, "two 1024s merged to 2048");
  assert.strictEqual(game.state, "won", "win state reached");
}

// lose detection: state becomes "lost" only when truly stuck after the move.
// A full board with one mergeable pair; the "up" merge frees a cell, the spawn
// (rng -> 0 => a 2 in the first empty cell) refills it into a fully-stuck board.
{
  const game = {
    grid: [
      [4, 64, 8, 16],
      [4, 8, 4, 64],
      [16, 64, 2, 4],
      [128, 16, 512, 128],
    ],
    score: 0,
    state: "playing",
  };
  L.applyMove(game, "up", () => 0);
  assert.strictEqual(L.hasMoves(game.grid), false, "board is stuck after move");
  assert.strictEqual(game.state, "lost", "no moves left => lost");
}

// applyMove is a no-op on a non-moving direction: no spawn, no state change.
{
  const game = {
    grid: [
      [2, 4, 8, 16],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    score: 0,
    state: "playing",
  };
  const before = JSON.stringify(game.grid);
  L.applyMove(game, "left", () => 0); // would spawn at {1,0} if it (wrongly) moved
  assert.strictEqual(JSON.stringify(game.grid), before, "no spawn on a no-op move");
  assert.strictEqual(game.score, 0, "score unchanged on a no-op move");
}

console.log("ok - all logic tests passed (16 groups)");
