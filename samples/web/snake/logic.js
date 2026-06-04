// Pure game logic — no DOM, no canvas. Works in the browser (attaches to window)
// and in Node (module.exports), so the mechanics can be unit-tested headless.
// See test.js. The rendering/input lives in game.js.
//
// Food placement is deterministic: pass an rng (a function returning [0,1)) into
// step/placeFood so tests can control where food lands. Nothing in the testable
// path calls Math.random — game.js injects it.

(function (root) {
  "use strict";

  const DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  function opposite(a, b) {
    return DIRS[a].x === -DIRS[b].x && DIRS[a].y === -DIRS[b].y;
  }

  function occupies(snake, x, y) {
    for (const c of snake) {
      if (c.x === x && c.y === y) return true;
    }
    return false;
  }

  // Pick a free cell for food using rng (a function returning a float in [0,1)).
  // Deterministic given a deterministic rng. Returns null if the grid is full.
  function placeFood(g, rng) {
    const free = [];
    for (let y = 0; y < g.rows; y++) {
      for (let x = 0; x < g.cols; x++) {
        if (!occupies(g.snake, x, y)) free.push({ x, y });
      }
    }
    if (free.length === 0) return null;
    const i = Math.floor(rng() * free.length);
    return free[i];
  }

  function createGame(opts) {
    const o = opts || {};
    const cols = o.cols || 20;
    const rows = o.rows || 14;
    const cx = Math.floor(cols / 2);
    const cy = Math.floor(rows / 2);
    return {
      cols,
      rows,
      snake: [
        { x: cx, y: cy },
        { x: cx - 1, y: cy },
        { x: cx - 2, y: cy },
      ],
      dir: "right",
      nextDir: "right",
      food: { x: cx + 3, y: cy },
      score: 0,
      state: "playing", // playing | dead
    };
  }

  // Queue a direction change. Rejects 180-degree reversals (relative to the
  // committed dir, so two quick turns in one tick can't double back).
  function setDir(g, dir) {
    if (!DIRS[dir]) return g;
    if (opposite(g.dir, dir)) return g;
    g.nextDir = dir;
    return g;
  }

  // Advance the snake by one cell. rng is only used when food is eaten (to place
  // the next food); pass a deterministic rng in tests.
  function step(g, rng) {
    if (g.state !== "playing") return g;

    g.dir = g.nextDir;
    const d = DIRS[g.dir];
    const head = g.snake[0];
    const nx = head.x + d.x;
    const ny = head.y + d.y;

    // wall collision
    if (nx < 0 || ny < 0 || nx >= g.cols || ny >= g.rows) {
      g.state = "dead";
      return g;
    }

    const eating = g.food && nx === g.food.x && ny === g.food.y;

    // self collision: the tail cell is freed this tick unless we're growing.
    const body = eating ? g.snake : g.snake.slice(0, g.snake.length - 1);
    if (occupies(body, nx, ny)) {
      g.state = "dead";
      return g;
    }

    g.snake.unshift({ x: nx, y: ny });
    if (eating) {
      g.score++;
      g.food = placeFood(g, rng);
    } else {
      g.snake.pop();
    }
    return g;
  }

  const Logic = { DIRS, opposite, occupies, placeFood, createGame, setDir, step };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Logic;
  } else {
    root.Logic = Logic;
  }
})(typeof window !== "undefined" ? window : globalThis);
