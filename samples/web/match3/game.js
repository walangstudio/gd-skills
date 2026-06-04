// Match-3 — rendering, input, and the redraw loop. Mechanics live in logic.js
// (pure, unit-tested). Click two adjacent gems to swap; matches clear and
// cascade. No build step, no dependencies — open index.html to play.

"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");

const COLS = 8;
const ROWS = 8;
const COLORS = 6;
const PALETTE = ["#ff6b6b", "#ffcf4d", "#7CFC9A", "#6cc4ff", "#c08cff", "#ff9bd2"];
const CELL = canvas.width / COLS;

let game;
let selected = null; // {r,c}

function reset() {
  game = Logic.createGame({ cols: COLS, rows: ROWS, colors: COLORS, rng: Math.random });
  // Clear any matches present in the freshly-filled board.
  while (Logic.findMatches(game.grid).length > 0) {
    for (const m of Logic.findMatches(game.grid)) game.grid[m.r][m.c] = null;
    Logic.applyGravity(game);
    Logic.refill(game, Math.random);
  }
  game.score = 0;
  selected = null;
}

addEventListener("keydown", (e) => {
  if (e.key === "r" || e.key === "R") reset();
});

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const c = Math.floor((e.clientX - rect.left) / CELL);
  const r = Math.floor((e.clientY - rect.top) / CELL);
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
  const cell = { r, c };
  if (!selected) {
    selected = cell;
  } else if (Logic.adjacent(selected, cell)) {
    Logic.swap(game, selected, cell, Math.random);
    selected = null;
  } else {
    selected = cell;
  }
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = game.grid[r][c];
      if (v === null) continue;
      ctx.fillStyle = PALETTE[v % PALETTE.length];
      const x = c * CELL + 3;
      const y = r * CELL + 3;
      ctx.fillRect(x, y, CELL - 6, CELL - 6);
    }
  }
  if (selected) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(selected.c * CELL + 1, selected.r * CELL + 1, CELL - 2, CELL - 2);
    ctx.lineWidth = 1;
  }
  scoreEl.textContent = String(game.score);
}

function frame() {
  draw();
  requestAnimationFrame(frame);
}

reset();
requestAnimationFrame(frame);
