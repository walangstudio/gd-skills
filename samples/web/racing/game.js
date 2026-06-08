// Top-Down Racer — rendering, input, and the game loop. Mechanics live in
// logic.js (pure, unit-tested). Arrow keys: Up = throttle, Down = brake/reverse,
// Left/Right = steer (only effective while moving). R restarts. No build step,
// no dependencies — open index.html to play.

"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const lapEl = document.getElementById("lap");
const cpEl = document.getElementById("cp");
const timeEl = document.getElementById("time");

const W = canvas.width;
const H = canvas.height;
const TOTAL_LAPS = 3;

const keys = new Set();
addEventListener("keydown", (e) => {
  keys.add(e.key);
  if (e.key === "r" || e.key === "R") reset();
  if (e.key.startsWith("Arrow")) e.preventDefault();
});
addEventListener("keyup", (e) => keys.delete(e.key));

function inputFromKeys() {
  return {
    throttle: keys.has("ArrowUp"),
    brake: keys.has("ArrowDown"),
    left: keys.has("ArrowLeft"),
    right: keys.has("ArrowRight"),
  };
}

let game;

function reset() {
  game = Logic.createGame({ w: W, h: H, totalLaps: TOTAL_LAPS });
}

function drawCheckpoints() {
  game.checkpoints.forEach((cp, i) => {
    const isNext = i === game.nextCp;
    const isStart = i === 0;
    ctx.beginPath();
    ctx.arc(cp.x, cp.y, cp.r, 0, Math.PI * 2);
    ctx.strokeStyle = isNext ? "#7CFC9A" : isStart ? "#ffcf4d" : "#3a4358";
    ctx.lineWidth = isNext ? 3 : 2;
    ctx.stroke();
    ctx.fillStyle = "#9aa7c0";
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(isStart ? "S/F" : String(i), cp.x, cp.y + 4);
  });
}

function drawCar() {
  const c = game.car;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.angle);
  ctx.fillStyle = "#6cc4ff";
  ctx.fillRect(-c.r, -c.r * 0.6, c.r * 2, c.r * 1.2);
  // nose marker so heading is visible
  ctx.fillStyle = "#fff";
  ctx.fillRect(c.r * 0.4, -c.r * 0.3, c.r * 0.6, c.r * 0.6);
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawCheckpoints();
  drawCar();

  if (game.state === "won") {
    ctx.fillStyle = "#000a";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#7CFC9A";
    ctx.font = "bold 32px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Finished!", W / 2, H / 2 - 16);
    ctx.fillStyle = "#e6e6e6";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText(game.time.toFixed(2) + "s — Press R to race again", W / 2, H / 2 + 16);
  }
}

function updateHud() {
  lapEl.textContent = Math.min(game.lapsDone + 1, TOTAL_LAPS) + " / " + TOTAL_LAPS;
  cpEl.textContent = String(game.nextCp);
  timeEl.textContent = game.time.toFixed(1);
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
    Logic.step(game, inputFromKeys(), STEP);
    acc -= STEP;
  }
  updateHud();
  draw();
  requestAnimationFrame(frame);
}

reset();
requestAnimationFrame(frame);
