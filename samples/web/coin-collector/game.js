// Coin Collector — rendering, input, and the game loop. Mechanics live in
// logic.js (pure, unit-tested). Move with arrow keys, collect 5 coins, R to
// restart. No build step, no dependencies — open index.html to play.

"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");

const W = canvas.width;
const H = canvas.height;
const COIN_GOAL = 5;

const keys = new Set();
addEventListener("keydown", (e) => {
  keys.add(e.key);
  if (e.key === "r" || e.key === "R") reset();
  if (e.key.startsWith("Arrow")) e.preventDefault();
});
addEventListener("keyup", (e) => keys.delete(e.key));

function inputFromKeys() {
  return {
    left: keys.has("ArrowLeft"),
    right: keys.has("ArrowRight"),
    up: keys.has("ArrowUp"),
    down: keys.has("ArrowDown"),
  };
}

function spawnCoin() {
  const r = 9;
  return {
    x: r + Math.random() * (W - 2 * r),
    y: r + Math.random() * (H - 2 * r),
    r,
    taken: false,
  };
}

let game;

function reset() {
  game = Logic.createGame({ w: W, h: H, goal: COIN_GOAL });
  for (let i = 0; i < COIN_GOAL; i++) game.coins.push(spawnCoin());
  scoreEl.textContent = "0";
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  for (const c of game.coins) {
    if (c.taken) continue;
    ctx.fillStyle = "#ffcf4d";
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#6cc4ff";
  ctx.fillRect(game.player.x, game.player.y, game.player.w, game.player.h);

  if (game.state === "won") {
    ctx.fillStyle = "#000a";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#7CFC9A";
    ctx.font = "bold 32px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("You win!", W / 2, H / 2 - 6);
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
    Logic.step(game, inputFromKeys(), STEP);
    acc -= STEP;
  }
  scoreEl.textContent = String(game.score);
  draw();
  requestAnimationFrame(frame);
}

reset();
requestAnimationFrame(frame);
