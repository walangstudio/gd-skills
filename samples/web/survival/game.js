// Survival — rendering, input, and the game loop. Mechanics live in logic.js
// (pure, unit-tested). Arrow keys to move, E to gather, F to eat, 1 to craft a
// campfire, R to restart. Survive to day 3. No build step, no dependencies —
// open index.html to play.

"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const dayEl = document.getElementById("day");
const healthEl = document.getElementById("health");
const hungerEl = document.getElementById("hunger");
const energyEl = document.getElementById("energy");
const woodEl = document.getElementById("wood");
const foodEl = document.getElementById("food");
const phaseEl = document.getElementById("phase");

const W = canvas.width;
const H = canvas.height;
const GOAL_DAY = 3;
const DAY_LENGTH = 45;

const keys = new Set();
addEventListener("keydown", (e) => {
  keys.add(e.key);
  if (e.key === "r" || e.key === "R") reset();
  if (e.key === "e" || e.key === "E") Logic.gather(game);
  if (e.key === "f" || e.key === "F") Logic.eat(game);
  if (e.key === "1") Logic.craft(game, "campfire");
  if (e.key === "2") Logic.craft(game, "axe");
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

function spawnNodes() {
  const nodes = [];
  for (let i = 0; i < 6; i++) {
    nodes.push({
      x: 40 + Math.random() * (W - 80),
      y: 40 + Math.random() * (H - 80),
      type: "wood",
      qty: 3,
      amount: 1,
    });
  }
  for (let i = 0; i < 5; i++) {
    nodes.push({
      x: 40 + Math.random() * (W - 80),
      y: 40 + Math.random() * (H - 80),
      type: "food",
      qty: 2,
      amount: 1,
    });
  }
  return nodes;
}

let game;

function reset() {
  game = Logic.createGame({
    w: W,
    h: H,
    goalDay: GOAL_DAY,
    dayLength: DAY_LENGTH,
  });
  game.nodes = spawnNodes();
}

function drawNode(n) {
  if (n.qty <= 0) return;
  ctx.fillStyle = n.type === "wood" ? "#9c6b3f" : "#7CFC9A";
  ctx.beginPath();
  ctx.arc(n.x, n.y, 8, 0, Math.PI * 2);
  ctx.fill();
}

function bar(label, value, color, y) {
  const x = 12;
  const w = 120;
  ctx.fillStyle = "#0006";
  ctx.fillRect(x, y, w, 10);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, (w * value) / 100, 10);
  ctx.fillStyle = "#e6e6e6";
  ctx.font = "10px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(label, x + w + 6, y + 9);
}

function draw() {
  const night = Logic.isNight(game);
  ctx.fillStyle = night ? "#10131c" : "#1d2330";
  ctx.fillRect(0, 0, W, H);

  for (const n of game.nodes) drawNode(n);

  ctx.fillStyle = "#6cc4ff";
  ctx.fillRect(game.player.x, game.player.y, game.player.w, game.player.h);

  if (night) {
    ctx.fillStyle = "#0003";
    ctx.fillRect(0, 0, W, H);
  }

  bar("HP", game.health, "#ff6b6b", H - 44);
  bar("FOOD", game.hunger, "#ffcf4d", H - 30);
  bar("ENRG", game.energy, "#9b8cff", H - 16);

  if (game.state !== "playing") {
    ctx.fillStyle = "#000a";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = game.state === "won" ? "#7CFC9A" : "#ff6b6b";
    ctx.font = "bold 32px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(game.state === "won" ? "You survived!" : "You died", W / 2, H / 2 - 6);
    ctx.fillStyle = "#e6e6e6";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText("Press R to play again", W / 2, H / 2 + 26);
  }
}

function syncHud() {
  dayEl.textContent = String(game.day);
  healthEl.textContent = String(Math.round(game.health));
  hungerEl.textContent = String(Math.round(game.hunger));
  energyEl.textContent = String(Math.round(game.energy));
  woodEl.textContent = String(game.inventory.wood);
  foodEl.textContent = String(game.inventory.food);
  phaseEl.textContent = Logic.isNight(game) ? "Night" : "Day";
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
  syncHud();
  draw();
  requestAnimationFrame(frame);
}

reset();
requestAnimationFrame(frame);
