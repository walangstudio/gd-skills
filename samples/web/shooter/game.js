// Space Shooter — rendering, input, RNG, and the game loop. Mechanics live in
// logic.js (pure, unit-tested). Move with arrow keys / A,D, hold Space to fire,
// reach 10 kills to win, R to restart. No build step, no dependencies — open
// index.html to play.

"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");

const W = canvas.width;
const H = canvas.height;
const GOAL = 10;

const keys = new Set();
addEventListener("keydown", (e) => {
  keys.add(e.key);
  if (e.key === "r" || e.key === "R") reset();
  if (e.key === " " || e.key.startsWith("Arrow")) e.preventDefault();
});
addEventListener("keyup", (e) => keys.delete(e.key));

function inputFromKeys() {
  return {
    left: keys.has("ArrowLeft") || keys.has("a") || keys.has("A"),
    right: keys.has("ArrowRight") || keys.has("d") || keys.has("D"),
    fire: keys.has(" "),
  };
}

// The only place Math.random lives — Logic stays deterministic and testable.
const rng = () => Math.random();

let game;

function reset() {
  game = Logic.createGame({ w: W, h: H, goal: GOAL });
  scoreEl.textContent = "0";
  livesEl.textContent = String(game.lives);
}

function drawShip(p) {
  ctx.fillStyle = "#6cc4ff";
  ctx.beginPath();
  ctx.moveTo(p.x + p.w / 2, p.y); // nose
  ctx.lineTo(p.x, p.y + p.h);
  ctx.lineTo(p.x + p.w, p.y + p.h);
  ctx.closePath();
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  for (const e of game.enemies) {
    ctx.fillStyle = "#ff6b6b";
    ctx.fillRect(e.x, e.y, e.w, e.h);
  }

  ctx.fillStyle = "#ffe066";
  for (const b of game.bullets) {
    ctx.fillRect(b.x, b.y, b.w, b.h);
  }

  drawShip(game.player);

  if (game.state !== "playing") {
    const won = game.state === "won";
    ctx.fillStyle = "#000a";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = won ? "#7CFC9A" : "#ff8585";
    ctx.font = "bold 32px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(won ? "You win!" : "Game over", W / 2, H / 2 - 6);
    ctx.fillStyle = "#e6e6e6";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText("Press R to play again", W / 2, H / 2 + 26);
  }
}

// Fixed-timestep accumulator so movement is frame-rate independent.
const STEP = 1 / 60;
let acc = 0;
let last = 0;

function frame(now) {
  const t = now / 1000;
  if (last === 0) last = t;
  acc += Math.min(0.25, t - last); // clamp to avoid spiral-of-death after a stall
  last = t;
  while (acc >= STEP) {
    Logic.step(game, inputFromKeys(), STEP, rng);
    acc -= STEP;
  }
  scoreEl.textContent = String(game.score);
  livesEl.textContent = String(game.lives);
  draw();
  requestAnimationFrame(frame);
}

reset();
requestAnimationFrame(frame);
