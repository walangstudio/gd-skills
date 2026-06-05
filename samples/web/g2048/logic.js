// Pure game logic — no DOM, no canvas. Works in the browser (attaches to window)
// and in Node (module.exports), so the mechanics can be unit-tested headless.
// See test.js. The rendering/input lives in game.js.
//
// No Math.random in here: spawnTile takes an injected rng so spawns are
// deterministic under test.

(function (root) {
  "use strict";

  const SIZE = 4;
  const WIN_VALUE = 2048;

  // Slide a single row left: compress non-zeros, then merge EQUAL adjacent pairs
  // ONCE, left-to-right. A tile created by a merge cannot merge again this move.
  // [2,2,2,2] -> [4,4,0,0]; [4,4,2,2] -> [8,4,0,0]; [2,2,2,0] -> [4,2,0,0].
  // Returns { row: newRow, gained: sum of new merged values }.
  function slideRowLeft(row) {
    const nums = row.filter((v) => v !== 0);
    const out = [];
    let gained = 0;
    for (let i = 0; i < nums.length; i++) {
      if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
        const merged = nums[i] * 2;
        out.push(merged);
        gained += merged;
        i++; // skip the consumed partner so it can't merge again
      } else {
        out.push(nums[i]);
      }
    }
    while (out.length < row.length) out.push(0);
    return { row: out, gained };
  }

  function rowsEqual(a, b) {
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  function cloneGrid(grid) {
    return grid.map((r) => r.slice());
  }

  function transpose(grid) {
    const out = grid.map(() => []);
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) out[c][r] = grid[r][c];
    }
    return out;
  }

  function reverseRows(grid) {
    return grid.map((r) => r.slice().reverse());
  }

  // Apply a move in dir ('left'|'right'|'up'|'down'). Transform so the move
  // becomes a left-slide, run slideRowLeft, transform back.
  // Returns { grid, gained, moved }.
  function move(grid, dir) {
    let work = cloneGrid(grid);
    if (dir === "right") work = reverseRows(work);
    else if (dir === "up") work = transpose(work);
    else if (dir === "down") work = reverseRows(transpose(work));

    let gained = 0;
    const slid = work.map((row) => {
      const r = slideRowLeft(row);
      gained += r.gained;
      return r.row;
    });

    let result = slid;
    if (dir === "right") result = reverseRows(slid);
    else if (dir === "up") result = transpose(slid);
    else if (dir === "down") result = transpose(reverseRows(slid));

    let moved = false;
    for (let r = 0; r < grid.length; r++) {
      if (!rowsEqual(grid[r], result[r])) {
        moved = true;
        break;
      }
    }
    return { grid: result, gained, moved };
  }

  function emptyCells(grid) {
    const cells = [];
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] === 0) cells.push({ r, c });
      }
    }
    return cells;
  }

  // Place a 2 (90%) or 4 (10%) on a random empty cell using the injected rng
  // (a function returning [0,1)). Returns a NEW grid; if no empty cell, returns
  // the grid unchanged.
  function spawnTile(grid, rng) {
    const cells = emptyCells(grid);
    if (cells.length === 0) return grid;
    const idx = Math.floor(rng() * cells.length);
    const cell = cells[Math.min(idx, cells.length - 1)];
    const value = rng() < 0.9 ? 2 : 4;
    const out = cloneGrid(grid);
    out[cell.r][cell.c] = value;
    return out;
  }

  // True if any direction would change the grid.
  function hasMoves(grid) {
    return (
      move(grid, "left").moved ||
      move(grid, "right").moved ||
      move(grid, "up").moved ||
      move(grid, "down").moved
    );
  }

  function hasWon(grid) {
    for (const row of grid) {
      for (const v of row) if (v >= WIN_VALUE) return true;
    }
    return false;
  }

  function emptyGrid() {
    const g = [];
    for (let r = 0; r < SIZE; r++) g.push(new Array(SIZE).fill(0));
    return g;
  }

  function createGame(rng) {
    let grid = emptyGrid();
    grid = spawnTile(grid, rng);
    grid = spawnTile(grid, rng);
    return { grid, score: 0, state: "playing" }; // playing | won | lost
  }

  // Apply a move to the game state, spawn a tile on a real move, update state.
  function applyMove(game, dir, rng) {
    if (game.state !== "playing") return game;
    const res = move(game.grid, dir);
    if (!res.moved) return game;
    game.grid = spawnTile(res.grid, rng);
    game.score += res.gained;
    if (hasWon(game.grid)) game.state = "won";
    else if (!hasMoves(game.grid)) game.state = "lost";
    return game;
  }

  const Logic = {
    SIZE,
    WIN_VALUE,
    slideRowLeft,
    move,
    spawnTile,
    hasMoves,
    hasWon,
    emptyCells,
    emptyGrid,
    createGame,
    applyMove,
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Logic;
  } else {
    root.Logic = Logic;
  }
})(typeof window !== "undefined" ? window : globalThis);
