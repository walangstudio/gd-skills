// Pure game logic — no DOM, no canvas. Works in the browser (attaches to window)
// and in Node (module.exports), so the mechanics can be unit-tested headless.
// See test.js. The rendering/input lives in game.js.
//
// Plot state machine: untilled -> tilled -> planted -> ... growing stages ... -> ripe
//   till:    untilled -> tilled
//   plant:   tilled   -> planted   (consumes one seed; stage = 0)
//   water:   planted/growing only  (sets watered flag for the day; idempotent)
//   harvest: ripe     -> tilled    (yields produce -> gold; clears the crop)
//   endDay:  watered crops advance ONE stage; unwatered crops wilt (lose a stage,
//            floored at 0); the watered flag resets for every crop.

(function (root) {
  "use strict";

  // Crop definitions: stages = how many growth steps from planted (0) to ripe,
  // price = gold per harvested produce, seedCost = gold to buy one seed.
  const CROPS = {
    carrot: { stages: 2, price: 12, seedCost: 4 },
    corn: { stages: 3, price: 22, seedCost: 7 },
    pumpkin: { stages: 4, price: 40, seedCost: 12 },
  };

  function inBounds(g, x, y) {
    return x >= 0 && y >= 0 && x < g.cols && y < g.rows;
  }

  function plotAt(g, x, y) {
    if (!inBounds(g, x, y)) return null;
    return g.plots[y * g.cols + x];
  }

  function createGame(opts) {
    const o = opts || {};
    const cols = o.cols || 6;
    const rows = o.rows || 4;
    const plots = [];
    for (let i = 0; i < cols * rows; i++) {
      // crop is null until something is planted; stage/watered apply only then.
      plots.push({ state: "untilled", crop: null, stage: 0, watered: false });
    }
    return {
      cols,
      rows,
      plots,
      gold: o.gold == null ? 20 : o.gold,
      // seed inventory by crop name
      seeds: o.seeds || { carrot: 3, corn: 0, pumpkin: 0 },
      day: 1,
      goal: o.goal || 100, // gold target to win
      state: "playing", // playing | won
    };
  }

  // Turn untilled soil into tilled soil ready for planting.
  function till(g, x, y) {
    if (g.state !== "playing") return false;
    const p = plotAt(g, x, y);
    if (!p || p.state !== "untilled") return false;
    p.state = "tilled";
    return true;
  }

  // Plant a seed on tilled soil. Consumes one seed of that crop.
  function plant(g, x, y, crop) {
    if (g.state !== "playing") return false;
    if (!CROPS[crop]) return false;
    const p = plotAt(g, x, y);
    if (!p || p.state !== "tilled") return false;
    if ((g.seeds[crop] || 0) <= 0) return false;
    g.seeds[crop]--;
    p.state = "planted";
    p.crop = crop;
    p.stage = 0;
    p.watered = false;
    return true;
  }

  // Water a planted/growing crop. Idempotent for the day — watering an already
  // watered crop changes nothing and never double-advances.
  function water(g, x, y) {
    if (g.state !== "playing") return false;
    const p = plotAt(g, x, y);
    if (!p) return false;
    if (p.state !== "planted" && p.state !== "growing") return false;
    if (p.watered) return false; // already watered today — no-op
    p.watered = true;
    return true;
  }

  // Harvest a ripe crop: yields produce sold for gold, clears the crop, and
  // returns the plot to tilled (ready to replant). No-op unless ripe.
  function harvest(g, x, y) {
    if (g.state !== "playing") return false;
    const p = plotAt(g, x, y);
    if (!p || p.state !== "ripe") return false;
    const def = CROPS[p.crop];
    g.gold += def.price;
    p.state = "tilled";
    p.crop = null;
    p.stage = 0;
    p.watered = false;
    if (g.gold >= g.goal) g.state = "won";
    return true;
  }

  // Buy one seed of a crop with gold. No-op if unaffordable or unknown crop.
  function buySeed(g, crop) {
    if (g.state !== "playing") return false;
    const def = CROPS[crop];
    if (!def) return false;
    if (g.gold < def.seedCost) return false;
    g.gold -= def.seedCost;
    g.seeds[crop] = (g.seeds[crop] || 0) + 1;
    return true;
  }

  // Advance the clock by one day. Watered crops grow one stage; reaching the
  // crop's final stage flips the plot to "ripe". Unwatered crops wilt one stage
  // (floored at 0). The watered flag resets for every crop afterwards.
  function endDay(g) {
    if (g.state !== "playing") return g;
    for (const p of g.plots) {
      if (p.state === "planted" || p.state === "growing") {
        const def = CROPS[p.crop];
        if (p.watered) {
          p.stage++;
          if (p.stage >= def.stages) {
            p.state = "ripe";
          } else {
            p.state = "growing";
          }
        } else if (p.stage > 0) {
          p.stage--; // wilt: lose a stage when neglected
          if (p.stage === 0) p.state = "planted"; // back to a fresh seedling, not "growing"
        }
        p.watered = false;
      }
    }
    g.day++;
    return g;
  }

  const Logic = {
    CROPS,
    inBounds,
    plotAt,
    createGame,
    till,
    plant,
    water,
    harvest,
    buySeed,
    endDay,
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Logic;
  } else {
    root.Logic = Logic;
  }
})(typeof window !== "undefined" ? window : globalThis);
