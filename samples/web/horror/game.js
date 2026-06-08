// Stealth Horror — rendering, input, and the game loop. Mechanics live in
// logic.js (pure, unit-tested). Arrow keys to move, F toggles the flashlight,
// R to restart. Collect both keys, then reach the exit at the top. Stay out of
// the guard's vision cone. No build step, no dependencies — open index.html.

"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const collectedEl = document.getElementById("collected");
const batteryEl = document.getElementById("battery");

const W = canvas.width;
const H = canvas.height;
const KEY_COUNT = 2;

const keys = new Set();
let flashlight = true;

addEventListener("keydown", (e) => {
  keys.add(e.key);
  if (e.key === "r" || e.key === "R") reset();
  if (e.key === "f" || e.key === "F") flashlight = !flashlight;
  if (e.key.startsWith("Arrow")) e.preventDefault();
});
addEventListener("keyup", (e) => keys.delete(e.key));

function inputFromKeys() {
  return {
    left: keys.has("ArrowLeft"),
    right: keys.has("ArrowRight"),
    up: keys.has("ArrowUp"),
    down: keys.has("ArrowDown"),
    flashlight,
  };
}

let game;

function reset() {
  game = Logic.createGame({
    w: W,
    h: H,
    waypoints: [
      { x: 50, y: 60 },
      { x: W - 60, y: 60 },
      { x: W - 60, y: H / 2 },
      { x: 50, y: H / 2 },
    ],
  });
  game.keys = [
    { x: 60, y: H - 60, r: 9, taken: false },
    { x: W - 60, y: H - 60, r: 9, taken: false },
  ];
  flashlight = true;
  collectedEl.textContent = "0";
  batteryEl.textContent = "100";
}

function drawCone(en) {
  // Visualize the guard's vision cone as a filled wedge.
  ctx.save();
  const cx = en.x + en.w / 2;
  const cy = en.y + en.h / 2;
  ctx.translate(cx, cy);
  ctx.rotate(en.facing);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, en.range);
  grad.addColorStop(0, "rgba(255,80,80,0.28)");
  grad.addColorStop(1, "rgba(255,80,80,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, en.range, -en.halfAngle, en.halfAngle);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // Exit (only "live" once all keys are collected).
  const ready = game.collected >= game.keys.length;
  ctx.fillStyle = ready ? "#7CFC9A" : "#3a4a3a";
  ctx.fillRect(game.exit.x, game.exit.y, game.exit.w, game.exit.h);
  ctx.fillStyle = ready ? "#0a2a14" : "#6a7a6a";
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("EXIT", game.exit.x + game.exit.w / 2, game.exit.y + game.exit.h / 2 + 4);

  // Keys.
  for (const k of game.keys) {
    if (k.taken) continue;
    ctx.fillStyle = "#ffd34d";
    ctx.beginPath();
    ctx.arc(k.x, k.y, k.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Guard + vision cone.
  drawCone(game.enemy);
  ctx.fillStyle = "#ff5050";
  ctx.fillRect(game.enemy.x, game.enemy.y, game.enemy.w, game.enemy.h);

  // Player.
  ctx.fillStyle = "#6cc4ff";
  ctx.fillRect(game.player.x, game.player.y, game.player.w, game.player.h);

  // Low-battery vignette: render-only. The stat lives in logic; the darkness is
  // purely visual and grows as the flashlight battery drops.
  const dark = 1 - game.battery; // 0 (full) .. 1 (dead)
  if (dark > 0) {
    const pc = { x: game.player.x + game.player.w / 2, y: game.player.y + game.player.h / 2 };
    const sight = 60 + game.battery * 260; // radius of clear vision
    const vg = ctx.createRadialGradient(pc.x, pc.y, sight * 0.4, pc.x, pc.y, sight);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, `rgba(0,0,0,${0.85 * dark})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  if (game.state !== "playing") {
    ctx.fillStyle = "#000a";
    ctx.fillRect(0, 0, W, H);
    const won = game.state === "won";
    ctx.fillStyle = won ? "#7CFC9A" : "#ff6b6b";
    ctx.font = "bold 32px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(won ? "You escaped!" : "Caught!", W / 2, H / 2 - 6);
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
  collectedEl.textContent = String(game.collected);
  batteryEl.textContent = String(Math.round(game.battery * 100));
  draw();
  requestAnimationFrame(frame);
}

reset();
requestAnimationFrame(frame);
