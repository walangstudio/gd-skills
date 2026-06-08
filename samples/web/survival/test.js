// Headless unit tests for the pure game logic. Run: node test.js
"use strict";
const assert = require("assert");
const L = require("./logic.js");

// 1. clamp
assert.strictEqual(L.clamp(5, 0, 100), 5);
assert.strictEqual(L.clamp(-3, 0, 100), 0);
assert.strictEqual(L.clamp(150, 0, 100), 100);

// 2. inputVector: diagonals are unit length, single axis is ±1
let v = L.inputVector({ right: true, down: true });
assert.ok(Math.abs(Math.hypot(v.vx, v.vy) - 1) < 1e-9, "diagonal normalized");
assert.deepStrictEqual(L.inputVector({ up: true }), { vx: 0, vy: -1 });
assert.deepStrictEqual(L.inputVector({ up: true, down: true }), { vx: 0, vy: 0 });

// 3. movement clamps to the world bounds
let g = L.createGame({ w: 100, h: 100 });
g.player.x = 0;
L.step(g, { left: true }, 1);
assert.strictEqual(g.player.x, 0, "clamped at left edge");
g.player.y = 0;
L.step(g, { down: true }, 100);
assert.strictEqual(g.player.y, g.h - g.player.h, "clamped at bottom edge");

// 4. hunger decays over time and is clamped at 0 (never negative)
g = L.createGame({ hungerRate: 10, starveRate: 0 });
L.step(g, {}, 5);
assert.strictEqual(g.hunger, 50, "hunger decayed by rate*dt");
L.step(g, {}, 100);
assert.strictEqual(g.hunger, 0, "hunger clamped at 0, not negative");

// 5. stat clamp at upper bound: eating at hunger 95 with a 20-restore caps at 100
g = L.createGame();
g.hunger = 95;
g.inventory.food = 1;
assert.strictEqual(L.eat(g, 20), true, "eat succeeds with food");
assert.strictEqual(g.hunger, 100, "hunger clamped at 100, no overflow");
assert.strictEqual(g.inventory.food, 0, "food consumed");
assert.strictEqual(L.eat(g, 20), false, "eat fails with no food");

// 6. hunger->health coupling boundary: health drains ONLY when hunger is 0
g = L.createGame({ hungerRate: 0, starveRate: 10 });
g.hunger = 1;
L.step(g, {}, 1);
assert.strictEqual(g.health, 100, "no starvation while hunger is 1");
g.hunger = 0;
L.step(g, {}, 1);
assert.strictEqual(g.health, 90, "starvation drains health at hunger 0");

// 7. health is clamped at 0 and the run ends in "dead"
g = L.createGame({ hungerRate: 0, starveRate: 1000 });
g.hunger = 0;
g.health = 5;
L.step(g, {}, 1);
assert.strictEqual(g.health, 0, "health clamped at 0, never negative");
assert.strictEqual(g.state, "dead", "dead state on health 0");

// 8. gather counts once per node: a depleted node yields nothing
g = L.createGame({ reach: 100 });
g.player = { x: 0, y: 0, w: 24, h: 24 };
g.nodes = [{ x: 10, y: 10, type: "wood", qty: 1, amount: 2 }];
assert.strictEqual(L.gather(g), true, "first gather succeeds");
assert.strictEqual(g.inventory.wood, 2, "wood granted once");
assert.strictEqual(L.gather(g), false, "depleted node yields nothing");
assert.strictEqual(g.inventory.wood, 2, "no extra wood from depleted node");

// 9. gather respects reach: out-of-reach node is not harvested
g = L.createGame({ reach: 10 });
g.player = { x: 0, y: 0, w: 24, h: 24 };
g.nodes = [{ x: 300, y: 300, type: "food", qty: 5, amount: 1 }];
assert.strictEqual(L.gather(g), false, "out-of-reach node not gathered");
assert.strictEqual(g.inventory.food, 0, "no food from out-of-reach node");

// 10. craft is atomic: insufficient => false and deducts nothing
g = L.createGame();
g.inventory.wood = 4; // campfire needs 5
assert.strictEqual(L.craft(g, "campfire"), false, "craft fails when short");
assert.strictEqual(g.inventory.wood, 4, "no resources deducted on failure");
assert.strictEqual(g.items.length, 0, "no item granted on failure");

// 11. craft sufficient: deducts exact cost once, grants one item
g = L.createGame();
g.inventory.wood = 10;
assert.ok(L.craft(g, "campfire"), "craft succeeds with enough wood");
assert.strictEqual(g.inventory.wood, 5, "exactly the cost deducted");
assert.deepStrictEqual(g.items, ["campfire"], "one item granted");
// double-craft needs double resources
assert.ok(L.craft(g, "campfire"), "second craft with remaining 5 wood");
assert.strictEqual(g.inventory.wood, 0, "second craft deducts again");
assert.strictEqual(g.items.length, 2, "two items now");
assert.strictEqual(L.craft(g, "campfire"), false, "third craft fails, no wood");
assert.strictEqual(g.items.length, 2, "still two items");

// 12. day-night: clock wraps and the day counter increments once per cycle
g = L.createGame({ dayLength: 10, hungerRate: 0 });
assert.strictEqual(L.isNight(g), false, "starts in day");
L.step(g, {}, 6); // clock 6 -> back half of day 0 -> night
assert.strictEqual(L.isNight(g), true, "night in back half of cycle");
assert.strictEqual(g.day, 1, "no day rollover yet");
L.step(g, {}, 5); // clock 11 -> crossed into next cycle once
assert.strictEqual(g.day, 2, "day incremented exactly once per cycle");
L.step(g, {}, 1); // clock 12, still day 2, no extra increment per step
assert.strictEqual(g.day, 2, "day not incremented per step");

// 13. night penalty multiplier applies only at night
let dayG = L.createGame({ dayLength: 100, energyRate: 10, hungerRate: 0, nightPenalty: 3 });
L.step(dayG, {}, 1); // clock 1 -> day half
assert.strictEqual(dayG.energy, 90, "daytime energy drain unmultiplied");
let nightG = L.createGame({ dayLength: 100, energyRate: 10, hungerRate: 0, nightPenalty: 3 });
nightG.clock = 60; // already night
L.step(nightG, {}, 1); // clock 61, still night
assert.strictEqual(nightG.energy, 70, "nighttime energy drain x3");

// 14. survive-to-goal-day win, and no actions/stat changes once not playing
g = L.createGame({ dayLength: 5, goalDay: 2, hungerRate: 0 });
L.step(g, {}, 6); // into day 2
assert.strictEqual(g.state, "won", "won by reaching goal day");
const frozen = { hunger: g.hunger, x: g.player.x };
L.step(g, { right: true }, 10);
assert.strictEqual(g.player.x, frozen.x, "no movement once won");
assert.strictEqual(g.hunger, frozen.hunger, "no stat change once won");
assert.strictEqual(L.gather(g), false, "no gather once won");
assert.strictEqual(L.craft(g, "campfire"), false, "no craft once won");
assert.strictEqual(L.eat(g, 20), false, "no eat once won");

// 15. goal-item win path: crafting the goal item wins
g = L.createGame({ goalItem: "axe" });
g.inventory.wood = 3;
g.inventory.food = 1;
assert.ok(L.craft(g, "axe"), "craft goal item");
assert.strictEqual(g.state, "won", "won by crafting goal item");

console.log("ok - all logic tests passed (15 groups)");
