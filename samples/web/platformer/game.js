// Platformer — rendering, input, and the game loop. Mechanics live in
// logic.js (pure, unit-tested). Arrow keys to move, Space/Up to jump, reach the
// goal to win, R to restart. No build step, no dependencies — open index.html.

"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

const keys = new Set();
addEventListener("keydown", (e) => {
  keys.add(e.key);
  if (e.key === "r" || e.key === "R") reset();
  if (e.key.startsWith("Arrow") || e.key === " ") e.preventDefault();
});
addEventListener("keyup", (e) => keys.delete(e.key));

function inputFromKeys() {
  return {
    left: keys.has("ArrowLeft"),
    right: keys.has("ArrowRight"),
    jump: keys.has("ArrowUp") || keys.has(" "),
  };
}

let game;

function reset() {
  game = Logic.createGame({ w: W, h: H });
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = "#3a465e";
  for (const plat of game.platforms) {
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
  }

  ctx.fillStyle = "#7CFC9A";
  ctx.fillRect(game.goal.x, game.goal.y, game.goal.w, game.goal.h);

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
  draw();
  requestAnimationFrame(frame);
}

reset();
requestAnimationFrame(frame);
