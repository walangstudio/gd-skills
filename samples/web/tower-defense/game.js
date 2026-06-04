// Tower Defense — rendering, input, and the game loop. Mechanics live in
// logic.js (pure, unit-tested). Click to place a tower; defend the path.
// No build step, no dependencies — open index.html to play.

"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const goldEl = document.getElementById("gold");
const livesEl = document.getElementById("lives");
const waveEl = document.getElementById("wave");

let game;

function reset() {
  game = Logic.createGame({ w: canvas.width, h: canvas.height });
}

addEventListener("keydown", (e) => {
  if (e.key === "r" || e.key === "R") reset();
});

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  Logic.placeTower(game, x, y);
});

function drawPath() {
  ctx.strokeStyle = "#3a4459";
  ctx.lineWidth = 22;
  ctx.lineJoin = "round";
  ctx.beginPath();
  game.path.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();
  ctx.lineWidth = 1;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPath();

  for (const t of game.towers) {
    ctx.strokeStyle = "#2c3550";
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#6cc4ff";
    ctx.fillRect(t.x - 8, t.y - 8, 16, 16);
  }

  for (const e of game.enemies) {
    ctx.fillStyle = "#ff6b6b";
    ctx.beginPath();
    ctx.arc(e.x, e.y, 9, 0, Math.PI * 2);
    ctx.fill();
    // hp bar
    ctx.fillStyle = "#000a";
    ctx.fillRect(e.x - 10, e.y - 16, 20, 4);
    ctx.fillStyle = "#7CFC9A";
    ctx.fillRect(e.x - 10, e.y - 16, 20 * (e.hp / e.maxHp), 4);
  }

  if (game.state !== "playing") {
    ctx.fillStyle = "#000a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = game.state === "won" ? "#7CFC9A" : "#ff6b6b";
    ctx.font = "bold 32px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(game.state === "won" ? "You win!" : "Game over", canvas.width / 2, canvas.height / 2 - 6);
    ctx.fillStyle = "#e6e6e6";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText("Press R to play again", canvas.width / 2, canvas.height / 2 + 26);
  }
}

const STEP = 1 / 60;
let acc = 0;
let last = 0;

function frame(now) {
  const t = now / 1000;
  if (last === 0) last = t;
  acc += Math.min(0.25, t - last);
  last = t;
  while (acc >= STEP) {
    Logic.step(game, STEP);
    acc -= STEP;
  }
  goldEl.textContent = String(game.gold);
  livesEl.textContent = String(game.lives);
  waveEl.textContent = String(Math.min(game.waveIndex + 1, game.waves.length));
  draw();
  requestAnimationFrame(frame);
}

reset();
requestAnimationFrame(frame);
