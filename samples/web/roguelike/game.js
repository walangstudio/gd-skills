// Roguelike — rendering, input, and the turn loop. Mechanics live in logic.js
// (pure, unit-tested). Turn-based: nothing moves until you press a key. Arrow
// keys / WASD to move and bump-attack, Space to wait, R to restart.
// No build step, no dependencies — open index.html to play.

"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const hpEl = document.getElementById("hp");
const depthEl = document.getElementById("depth");
const stateEl = document.getElementById("state");

const COLS = 24;
const ROWS = 16;
const TILE = canvas.width / COLS; // square tiles

const KEY_TO_ACTION = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
  " ": "wait",
};

let game;

function reset() {
  game = Logic.createGame({
    w: COLS,
    h: ROWS,
    seed: (Math.random() * 1e9) | 0, // the ONLY Math.random — picks a seed
    depth: 1,
    targetDepth: 3,
  });
  draw();
}

addEventListener("keydown", (e) => {
  if (e.key === "r" || e.key === "R") {
    reset();
    return;
  }
  const action = KEY_TO_ACTION[e.key];
  if (!action) return;
  e.preventDefault();
  Logic.step(game, action);
  draw();
});

function draw() {
  // Floor / wall grid.
  for (let y = 0; y < game.h; y++) {
    for (let x = 0; x < game.w; x++) {
      ctx.fillStyle = game.grid[y][x] === Logic.WALL ? "#2a3142" : "#1d2330";
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }

  // Stairs / exit.
  drawGlyph(game.exit.x, game.exit.y, "#f2c14e", ">");

  // Enemies.
  for (const e of game.enemies) {
    if (e.hp > 0) drawGlyph(e.x, e.y, "#ff6b6b", "g");
  }

  // Player.
  drawGlyph(game.player.x, game.player.y, "#6cc4ff", "@");

  // HUD.
  hpEl.textContent = game.player.hp + " / " + game.player.maxHp;
  depthEl.textContent = game.depth + " / " + game.targetDepth;
  stateEl.textContent = game.state;

  if (game.state !== "playing") drawBanner();
}

function drawGlyph(gx, gy, color, ch) {
  const px = gx * TILE;
  const py = gy * TILE;
  ctx.fillStyle = color;
  ctx.font = "bold " + Math.floor(TILE * 0.8) + "px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(ch, px + TILE / 2, py + TILE / 2 + 1);
}

function drawBanner() {
  const W = canvas.width;
  const H = canvas.height;
  ctx.fillStyle = "#000a";
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.fillStyle = game.state === "won" ? "#7CFC9A" : "#ff6b6b";
  ctx.font = "bold 32px system-ui, sans-serif";
  ctx.fillText(game.state === "won" ? "You escaped!" : "You died", W / 2, H / 2 - 6);
  ctx.fillStyle = "#e6e6e6";
  ctx.font = "16px system-ui, sans-serif";
  ctx.fillText("Press R to play again", W / 2, H / 2 + 26);
}

reset();
