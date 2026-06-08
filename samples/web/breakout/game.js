// Breakout — rendering, input, and the game loop. Mechanics live in logic.js
// (pure, unit-tested). Move the paddle with the mouse or Left/Right arrows,
// clear every brick to win, R to restart. No build step, no dependencies —
// open index.html to play.

"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");

const W = canvas.width;
const H = canvas.height;

const keys = new Set();
addEventListener("keydown", (e) => {
  keys.add(e.key);
  if (e.key === "r" || e.key === "R") reset();
  if (e.key.startsWith("Arrow")) e.preventDefault();
});
addEventListener("keyup", (e) => keys.delete(e.key));

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  Logic.setPaddle(game, mx - game.paddle.w / 2);
});

const PADDLE_SPEED = 320; // px/sec for keyboard control

function applyKeys(dt) {
  let dir = 0;
  if (keys.has("ArrowLeft")) dir -= 1;
  if (keys.has("ArrowRight")) dir += 1;
  if (dir !== 0) Logic.setPaddle(game, game.paddle.x + dir * PADDLE_SPEED * dt);
}

let game;

function reset() {
  game = Logic.createGame({ w: W, h: H });
  scoreEl.textContent = "0";
  livesEl.textContent = String(game.lives);
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  for (const brick of game.bricks) {
    if (!brick.alive) continue;
    ctx.fillStyle = "#ff7a5c";
    ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
  }

  ctx.fillStyle = "#6cc4ff";
  ctx.fillRect(game.paddle.x, game.paddle.y, game.paddle.w, game.paddle.h);

  ctx.fillStyle = "#ffcf4d";
  ctx.beginPath();
  ctx.arc(game.ball.x, game.ball.y, game.ball.r, 0, Math.PI * 2);
  ctx.fill();

  if (game.state !== "playing") {
    ctx.fillStyle = "#000a";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = game.state === "won" ? "#7CFC9A" : "#ff8080";
    ctx.font = "bold 32px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(game.state === "won" ? "You win!" : "Game over", W / 2, H / 2 - 6);
    ctx.fillStyle = "#e6e6e6";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText("Press R to play again", W / 2, H / 2 + 26);
  }
}

// Fixed-timestep accumulator so the sim is frame-rate independent.
const STEP = 1 / 60;
let acc = 0;
let last = 0;

function frame(now) {
  const t = now / 1000;
  if (last === 0) last = t;
  acc += Math.min(0.25, t - last); // clamp to avoid spiral-of-death after a stall
  last = t;
  while (acc >= STEP) {
    applyKeys(STEP);
    Logic.step(game, STEP);
    acc -= STEP;
  }
  scoreEl.textContent = String(game.score);
  livesEl.textContent = String(game.lives);
  draw();
  requestAnimationFrame(frame);
}

reset();
requestAnimationFrame(frame);
