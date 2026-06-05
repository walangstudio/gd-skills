// 2048 — rendering, input, and the game state. Mechanics live in logic.js
// (pure, unit-tested). Move with the arrow keys, merge tiles to reach 2048,
// R to restart. No build step, no dependencies — open index.html to play.

"use strict";

const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");

const SIZE = Logic.SIZE;

// Tile background colors keyed by value; falls back to the highest for >2048.
const COLORS = {
  0: "#2c2f3a",
  2: "#3a4a6b",
  4: "#3f5b8c",
  8: "#4e7fb8",
  16: "#5a93cf",
  32: "#6fae6f",
  64: "#5fa05f",
  128: "#d9b24c",
  256: "#d9a23c",
  512: "#d98f2c",
  1024: "#d97b1c",
  2048: "#e0671c",
};

// Build the 16 cell divs once; reuse them every render.
const cells = [];
for (let i = 0; i < SIZE * SIZE; i++) {
  const d = document.createElement("div");
  d.className = "cell";
  boardEl.appendChild(d);
  cells.push(d);
}

let game;

function reset() {
  game = Logic.createGame(Math.random);
  statusEl.textContent = "";
  draw();
}

function draw() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = game.grid[r][c];
      const cell = cells[r * SIZE + c];
      cell.textContent = v === 0 ? "" : String(v);
      cell.style.background = COLORS[v] || COLORS[2048];
      cell.style.color = v <= 4 ? "#cfd6e6" : "#1b1d24";
      cell.style.fontSize = v >= 1024 ? "22px" : "30px";
    }
  }
  scoreEl.textContent = String(game.score);
  if (game.state === "won") statusEl.textContent = "You win! Press R to play again.";
  else if (game.state === "lost") statusEl.textContent = "Game over. Press R to restart.";
}

const DIRS = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
};

addEventListener("keydown", (e) => {
  if (e.key === "r" || e.key === "R") {
    reset();
    return;
  }
  const dir = DIRS[e.key];
  if (!dir) return;
  e.preventDefault();
  Logic.applyMove(game, dir, Math.random);
  draw();
});

reset();
