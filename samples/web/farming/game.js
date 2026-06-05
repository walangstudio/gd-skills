// Tile Farmer — rendering, input, and the turn loop. Mechanics live in
// logic.js (pure, unit-tested). Move the cursor with arrow keys; act on the
// tile under the cursor. No build step, no dependencies — open index.html to play.
//
// Keys:
//   Arrows  move the cursor
//   T       till          P  plant the selected crop
//   W       water         H  harvest
//   1/2/3   select carrot / corn / pumpkin (to plant or buy)
//   B       buy one seed of the selected crop
//   N       end the day (advance growth)
//   R       restart

"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const hudGold = document.getElementById("gold");
const hudDay = document.getElementById("day");
const hudSeeds = document.getElementById("seeds");
const hudSel = document.getElementById("sel");

const W = canvas.width;
const H = canvas.height;
const COLS = 6;
const ROWS = 4;
const GOAL = 100;
const TILE = 64;
const PAD_X = (W - COLS * TILE) / 2;
const PAD_Y = (H - ROWS * TILE) / 2;

const CROP_KEYS = ["carrot", "corn", "pumpkin"];
const CROP_COLOR = { carrot: "#ff8c42", corn: "#ffd24d", pumpkin: "#d8642a" };

let game;
let cursor = { x: 0, y: 0 };
let selected = "carrot";

function reset() {
  game = Logic.createGame({ cols: COLS, rows: ROWS, goal: GOAL });
  cursor = { x: 0, y: 0 };
  selected = "carrot";
}

addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (e.key.startsWith("Arrow")) e.preventDefault();
  if (e.key === "ArrowLeft") cursor.x = Math.max(0, cursor.x - 1);
  if (e.key === "ArrowRight") cursor.x = Math.min(COLS - 1, cursor.x + 1);
  if (e.key === "ArrowUp") cursor.y = Math.max(0, cursor.y - 1);
  if (e.key === "ArrowDown") cursor.y = Math.min(ROWS - 1, cursor.y + 1);

  if (k === "t") Logic.till(game, cursor.x, cursor.y);
  if (k === "p") Logic.plant(game, cursor.x, cursor.y, selected);
  if (k === "w") Logic.water(game, cursor.x, cursor.y);
  if (k === "h") Logic.harvest(game, cursor.x, cursor.y);
  if (k === "b") Logic.buySeed(game, selected);
  if (k === "n") Logic.endDay(game);
  if (k === "1") selected = "carrot";
  if (k === "2") selected = "corn";
  if (k === "3") selected = "pumpkin";
  if (k === "r") reset();
});

function plotColor(p) {
  switch (p.state) {
    case "untilled": return "#4a3b2a";
    case "tilled": return "#6b4f33";
    case "planted":
    case "growing": return "#3c5a2e";
    case "ripe": return "#2e7d32";
    default: return "#333";
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const p = Logic.plotAt(game, x, y);
      const px = PAD_X + x * TILE;
      const py = PAD_Y + y * TILE;
      ctx.fillStyle = plotColor(p);
      ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);

      if (p.crop) {
        const def = Logic.CROPS[p.crop];
        const ratio = p.state === "ripe" ? 1 : p.stage / def.stages;
        const size = 8 + ratio * (TILE / 2 - 10);
        ctx.fillStyle = CROP_COLOR[p.crop];
        ctx.beginPath();
        ctx.arc(px + TILE / 2, py + TILE / 2, size, 0, Math.PI * 2);
        ctx.fill();
        if (p.state === "ripe") {
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        if (p.watered) {
          ctx.fillStyle = "#6cc4ff";
          ctx.fillRect(px + 6, py + 6, 8, 8);
        }
      }
    }
  }

  // cursor highlight
  const cx = PAD_X + cursor.x * TILE;
  const cy = PAD_Y + cursor.y * TILE;
  ctx.strokeStyle = "#ffe066";
  ctx.lineWidth = 3;
  ctx.strokeRect(cx + 2, cy + 2, TILE - 4, TILE - 4);

  if (game.state === "won") {
    ctx.fillStyle = "#000a";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#7CFC9A";
    ctx.font = "bold 32px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Farm thriving — you win!", W / 2, H / 2 - 6);
    ctx.fillStyle = "#e6e6e6";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText("Press R to play again", W / 2, H / 2 + 26);
  }
}

function syncHud() {
  hudGold.textContent = String(game.gold);
  hudDay.textContent = String(game.day);
  hudSeeds.textContent = CROP_KEYS.map((c) => `${c} ${game.seeds[c] || 0}`).join("  ");
  hudSel.textContent = selected;
}

function frame() {
  syncHud();
  draw();
  requestAnimationFrame(frame);
}

reset();
requestAnimationFrame(frame);
