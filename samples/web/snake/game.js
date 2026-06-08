// Snake — rendering, input, and the game loop. Mechanics live in logic.js
// (pure, unit-tested). Steer with arrow keys, eat food to grow, R to restart.
// No build step, no dependencies — open index.html to play.

"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");

const COLS = 20;
const ROWS = 14;
const CELL = canvas.width / COLS; // 480 / 20 = 24px cells; matches 320 / 14 closely
const W = canvas.width;
const H = canvas.height;

// Math.random lives here only — injected into the pure logic so its testable
// path stays deterministic.
const rng = () => Math.random();

addEventListener("keydown", (e) => {
  if (e.key === "r" || e.key === "R") { reset(); return; }
  if (e.key === "ArrowUp") Logic.setDir(game, "up");
  else if (e.key === "ArrowDown") Logic.setDir(game, "down");
  else if (e.key === "ArrowLeft") Logic.setDir(game, "left");
  else if (e.key === "ArrowRight") Logic.setDir(game, "right");
  if (e.key.startsWith("Arrow")) e.preventDefault();
});

let game;

function reset() {
  game = Logic.createGame({ cols: COLS, rows: ROWS });
  game.food = Logic.placeFood(game, rng);
  scoreEl.textContent = "0";
}

function drawCell(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  if (game.food) drawCell(game.food.x, game.food.y, "#ffcf4d");

  game.snake.forEach((c, i) => {
    drawCell(c.x, c.y, i === 0 ? "#9cf0b0" : "#6cc4ff");
  });

  if (game.state === "dead") {
    ctx.fillStyle = "#000a";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ff8a8a";
    ctx.font = "bold 32px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Game over", W / 2, H / 2 - 6);
    ctx.fillStyle = "#e6e6e6";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText("Press R to play again", W / 2, H / 2 + 26);
  }
}

// Fixed tick: the snake advances one cell every TICK seconds, independent of the
// render frame rate. The accumulator clamps against the spiral-of-death.
const TICK = 0.12;
let acc = 0;
let last = 0;

function frame(now) {
  const t = now / 1000;
  if (last === 0) last = t;
  acc += Math.min(0.25, t - last);
  last = t;
  while (acc >= TICK) {
    Logic.step(game, rng);
    acc -= TICK;
  }
  scoreEl.textContent = String(game.score);
  draw();
  requestAnimationFrame(frame);
}

reset();
requestAnimationFrame(frame);
