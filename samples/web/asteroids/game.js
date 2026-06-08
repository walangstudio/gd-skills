// Asteroids — rendering, input, and the game loop. Mechanics live in logic.js
// (pure, unit-tested). Left/Right rotate, Up thrusts, Space fires, R restarts.
// No build step, no dependencies — open index.html to play.

"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");

const W = canvas.width;
const H = canvas.height;
const START_ASTEROIDS = 4;

const keys = new Set();
let fireQueued = false; // edge-trigger: one bullet per Space press

addEventListener("keydown", (e) => {
  if (e.repeat) return;
  keys.add(e.key);
  if (e.key === "r" || e.key === "R") reset();
  if (e.key === " ") fireQueued = true;
  if (e.key.startsWith("Arrow") || e.key === " ") e.preventDefault();
});
addEventListener("keyup", (e) => keys.delete(e.key));

function inputFromKeys() {
  const inp = {
    left: keys.has("ArrowLeft"),
    right: keys.has("ArrowRight"),
    thrust: keys.has("ArrowUp"),
    fire: fireQueued,
  };
  fireQueued = false;
  return inp;
}

function spawnAsteroid() {
  // Spawn at an edge with a random drift, away from the ship's center.
  const edge = Math.floor(Math.random() * 2);
  const x = edge === 0 ? 0 : Math.random() * W;
  const y = edge === 0 ? Math.random() * H : 0;
  const ang = Math.random() * Math.PI * 2;
  const speed = 30 + Math.random() * 40;
  return {
    x,
    y,
    vx: Math.cos(ang) * speed,
    vy: Math.sin(ang) * speed,
    size: "large",
    r: Logic.asteroidRadius("large"),
  };
}

let game;

function reset() {
  game = Logic.createGame({ w: W, h: H, rng: Math.random });
  for (let i = 0; i < START_ASTEROIDS; i++) game.asteroids.push(spawnAsteroid());
  fireQueued = false;
}

function drawShip(s) {
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.angle);
  ctx.strokeStyle = "#6cc4ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(s.r, 0);
  ctx.lineTo(-s.r * 0.7, s.r * 0.7);
  ctx.lineTo(-s.r * 0.4, 0);
  ctx.lineTo(-s.r * 0.7, -s.r * 0.7);
  ctx.closePath();
  ctx.stroke();
  if (keys.has("ArrowUp")) {
    ctx.strokeStyle = "#ffb04d";
    ctx.beginPath();
    ctx.moveTo(-s.r * 0.4, 0);
    ctx.lineTo(-s.r * 1.1, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  ctx.strokeStyle = "#9aa4b2";
  ctx.lineWidth = 2;
  for (const a of game.asteroids) {
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = "#fff";
  for (const b of game.bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }

  drawShip(game.ship);

  if (game.state !== "playing") {
    ctx.fillStyle = "#000a";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = game.state === "won" ? "#7CFC9A" : "#ff6b6b";
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
    Logic.step(game, inputFromKeys(), STEP);
    acc -= STEP;
  }
  scoreEl.textContent = String(game.score);
  livesEl.textContent = String(game.lives);
  draw();
  requestAnimationFrame(frame);
}

reset();
requestAnimationFrame(frame);
