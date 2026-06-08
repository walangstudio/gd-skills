// Tile RPG — rendering, input, and the turn loop. Mechanics live in logic.js
// (pure, unit-tested). Arrow keys / WASD to move and bump enemies, P to drink a
// potion, R to restart. No build step, no dependencies — open index.html to play.

"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const hpEl = document.getElementById("hp");
const lvlEl = document.getElementById("lvl");
const goldEl = document.getElementById("gold");
const potEl = document.getElementById("pot");
const stateEl = document.getElementById("state");

const TILE_PX = 40;
const T = Logic.TILE;

// 8x6 starter dungeon. F floor, # wall, X exit. Enemies/items placed below.
const ROWS = [
  "FFFFFF#X",
  "F##F#FFF",
  "FF#FFFF#",
  "#FFF##FF",
  "F#FF#FFF",
  "FFFF#FFF",
];

function buildMap() {
  return ROWS.map((r) =>
    r.split("").map((ch) => (ch === "#" ? T.WALL : ch === "X" ? T.EXIT : T.FLOOR))
  );
}

// All placements are on FLOOR tiles (see ROWS) and bump-reachable, so the level
// stays winnable: (3,0),(6,2),(2,4) are floor; (4,2),(5,5) are floor.
const ENEMIES = [
  { x: 3, y: 0, hp: 12, atk: 3, xp: 6, gold: 4 },
  { x: 6, y: 2, hp: 16, atk: 4, xp: 8, gold: 6 },
  { x: 2, y: 4, hp: 10, atk: 2, xp: 5, gold: 3 },
];

const ITEMS = [
  { x: 4, y: 2, kind: "potion", heal: 12 },
  { x: 5, y: 5, kind: "potion", heal: 12 },
];

let game;

function reset() {
  game = Logic.createGame({
    map: buildMap(),
    startX: 0,
    startY: 0,
    hp: 20,
    maxHp: 20,
    atk: 5,
    enemies: ENEMIES,
    items: ITEMS,
  });
  syncHud();
  draw();
}

addEventListener("keydown", (e) => {
  if (e.key === "r" || e.key === "R") {
    reset();
    return;
  }
  if (e.key === "p" || e.key === "P") {
    Logic.usePotion(game);
    syncHud();
    draw();
    return;
  }
  const dir = keyToDir(e.key);
  if (dir) {
    e.preventDefault();
    Logic.step(game, dir);
    syncHud();
    draw();
  }
});

function keyToDir(key) {
  switch (key) {
    case "ArrowUp":
    case "w":
    case "W":
      return "up";
    case "ArrowDown":
    case "s":
    case "S":
      return "down";
    case "ArrowLeft":
    case "a":
    case "A":
      return "left";
    case "ArrowRight":
    case "d":
    case "D":
      return "right";
    default:
      return null;
  }
}

function potionCount() {
  return game.player.inventory.filter((i) => i.kind === "potion").length;
}

function syncHud() {
  const p = game.player;
  hpEl.textContent = p.hp + "/" + p.maxHp;
  lvlEl.textContent = String(p.level);
  goldEl.textContent = String(p.gold);
  potEl.textContent = String(potionCount());
  stateEl.textContent =
    game.state === "won" ? "You escaped!" : game.state === "lost" ? "You died." : "";
}

const TILE_COLORS = {};
TILE_COLORS[T.FLOOR] = "#222a3a";
TILE_COLORS[T.WALL] = "#0c1018";
TILE_COLORS[T.EXIT] = "#2e6b3f";

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const map = game.map;

  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[0].length; x++) {
      ctx.fillStyle = TILE_COLORS[map[y][x]] || "#222a3a";
      ctx.fillRect(x * TILE_PX, y * TILE_PX, TILE_PX - 1, TILE_PX - 1);
      if (map[y][x] === T.EXIT) {
        ctx.fillStyle = "#7CFC9A";
        ctx.font = "bold 22px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("E", x * TILE_PX + TILE_PX / 2, y * TILE_PX + TILE_PX / 2 + 8);
      }
    }
  }

  for (const it of game.items) {
    if (it.taken) continue;
    ctx.fillStyle = "#ffcf4d";
    ctx.beginPath();
    ctx.arc(it.x * TILE_PX + TILE_PX / 2, it.y * TILE_PX + TILE_PX / 2, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const e of game.enemies) {
    if (e.hp <= 0) continue;
    ctx.fillStyle = "#e25b5b";
    ctx.fillRect(e.x * TILE_PX + 6, e.y * TILE_PX + 6, TILE_PX - 13, TILE_PX - 13);
  }

  const p = game.player;
  ctx.fillStyle = "#6cc4ff";
  ctx.fillRect(p.tileX * TILE_PX + 6, p.tileY * TILE_PX + 6, TILE_PX - 13, TILE_PX - 13);

  if (game.state !== "playing") {
    ctx.fillStyle = "#000a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = game.state === "won" ? "#7CFC9A" : "#e25b5b";
    ctx.font = "bold 32px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      game.state === "won" ? "You escaped!" : "You died.",
      canvas.width / 2,
      canvas.height / 2 - 6
    );
    ctx.fillStyle = "#e6e6e6";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText("Press R to play again", canvas.width / 2, canvas.height / 2 + 26);
  }
}

reset();
