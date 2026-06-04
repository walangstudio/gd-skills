// Pure game logic — no DOM, no canvas. Works in the browser (attaches to window)
// and in Node (module.exports), so the mechanics can be unit-tested headless.
// See test.js. The rendering/input lives in game.js.
//
// Randomness (board fill / refill) is INJECTED as an rng() function returning
// [0,1), so tests are fully deterministic. No Math.random in here.

(function (root) {
  "use strict";

  function makeGrid(cols, rows, value) {
    const grid = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) row.push(value);
      grid.push(row);
    }
    return grid;
  }

  function createGame(opts) {
    const o = opts || {};
    const cols = o.cols || 8;
    const rows = o.rows || 8;
    const g = {
      cols,
      rows,
      colors: o.colors || 5,
      grid: makeGrid(cols, rows, null),
      score: 0,
      state: "playing",
    };
    if (o.rng) fill(g, o.rng);
    return g;
  }

  function fill(g, rng) {
    for (let r = 0; r < g.rows; r++) {
      for (let c = 0; c < g.cols; c++) {
        g.grid[r][c] = Math.floor(rng() * g.colors);
      }
    }
    return g;
  }

  function adjacent(a, b) {
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
  }

  // Return the list of {r,c} cells that are part of any horizontal or vertical
  // run of 3+ same-color gems.
  function findMatches(grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    const marked = makeGrid(cols, rows, false);

    // Horizontal runs.
    for (let r = 0; r < rows; r++) {
      let c = 0;
      while (c < cols) {
        const v = grid[r][c];
        let k = c;
        while (k < cols && v !== null && grid[r][k] === v) k++;
        if (k - c >= 3) for (let i = c; i < k; i++) marked[r][i] = true;
        c = Math.max(k, c + 1);
      }
    }
    // Vertical runs.
    for (let c = 0; c < cols; c++) {
      let r = 0;
      while (r < rows) {
        const v = grid[r][c];
        let k = r;
        while (k < rows && v !== null && grid[k][c] === v) k++;
        if (k - r >= 3) for (let i = r; i < k; i++) marked[i][c] = true;
        r = Math.max(k, r + 1);
      }
    }

    const cells = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) if (marked[r][c]) cells.push({ r, c });
    return cells;
  }

  // Collapse each column downward, leaving nulls at the top.
  function applyGravity(g) {
    for (let c = 0; c < g.cols; c++) {
      const stack = [];
      for (let r = 0; r < g.rows; r++) if (g.grid[r][c] !== null) stack.push(g.grid[r][c]);
      const empty = g.rows - stack.length;
      for (let r = 0; r < g.rows; r++) {
        g.grid[r][c] = r < empty ? null : stack[r - empty];
      }
    }
  }

  // Refill the empty (null) cells using the injected rng.
  function refill(g, rng) {
    for (let r = 0; r < g.rows; r++)
      for (let c = 0; c < g.cols; c++)
        if (g.grid[r][c] === null) g.grid[r][c] = Math.floor(rng() * g.colors);
  }

  // Swap two adjacent cells. If the swap creates a match, resolve all matches
  // and cascades (clear, gravity, refill, repeat) and return {moved:true,
  // cleared}. Otherwise revert and return {moved:false, cleared:0}.
  function swap(g, a, b, rng) {
    if (g.state !== "playing") return { moved: false, cleared: 0 };
    if (!adjacent(a, b)) return { moved: false, cleared: 0 };

    const va = g.grid[a.r][a.c];
    const vb = g.grid[b.r][b.c];
    g.grid[a.r][a.c] = vb;
    g.grid[b.r][b.c] = va;

    let matches = findMatches(g.grid);
    if (matches.length === 0) {
      // No match — revert.
      g.grid[a.r][a.c] = va;
      g.grid[b.r][b.c] = vb;
      return { moved: false, cleared: 0 };
    }

    let cleared = 0;
    while (matches.length > 0) {
      for (const m of matches) g.grid[m.r][m.c] = null;
      cleared += matches.length;
      g.score += matches.length;
      applyGravity(g);
      refill(g, rng);
      matches = findMatches(g.grid);
    }
    return { moved: true, cleared };
  }

  const Logic = { makeGrid, createGame, fill, adjacent, findMatches, applyGravity, refill, swap };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Logic;
  } else {
    root.Logic = Logic;
  }
})(typeof window !== "undefined" ? window : globalThis);
