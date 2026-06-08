// Pure game logic — no DOM, no canvas. Works in the browser (attaches to window)
// and in Node (module.exports), so the mechanics can be unit-tested headless.
// See test.js. The rendering/input lives in game.js.

(function (root) {
  "use strict";

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  // Default helper that treats only undefined/null as "missing" (so a 0 stays 0).
  function num(v, d) {
    return v === undefined || v === null ? d : v;
  }

  // Map a directional input to a unit vector (diagonals normalized).
  function inputVector(input) {
    let vx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let vy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    if (vx && vy) {
      vx *= Math.SQRT1_2;
      vy *= Math.SQRT1_2;
    }
    return { vx, vy };
  }

  // Crafting recipes: cost in resources, and the item granted.
  const RECIPES = {
    campfire: { wood: 5 },
    axe: { wood: 3, food: 1 },
  };

  // Distance check: player box center vs node point within `reach`.
  function inReach(player, node, reach) {
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    const dx = node.x - px;
    const dy = node.y - py;
    return dx * dx + dy * dy <= reach * reach;
  }

  // Is the clock currently in the night window? Night is the back half of a day.
  function isNight(g) {
    return g.clock % g.dayLength >= g.dayLength / 2;
  }

  function createGame(opts) {
    const o = opts || {};
    const w = o.w || 480;
    const h = o.h || 320;
    return {
      w,
      h,
      speed: num(o.speed, 120), // px/sec
      player: { x: w / 2 - 12, y: h / 2 - 12, w: 24, h: 24 },
      health: 100,
      hunger: 100,
      energy: 100,
      hungerRate: num(o.hungerRate, 4), // hunger lost per second
      starveRate: num(o.starveRate, 5), // health lost per second while hunger is 0
      energyRate: num(o.energyRate, 2), // energy lost per second
      nightPenalty: num(o.nightPenalty, 2), // multiplier on energy drain at night
      reach: num(o.reach, 28), // gather/interact radius (px)
      nodes: [], // resource nodes: {x, y, type:"wood"|"food", qty, amount}
      inventory: { wood: 0, food: 0 },
      items: [], // crafted item names
      clock: 0, // accumulated time (sec)
      dayLength: num(o.dayLength, 60), // seconds per full day
      day: 1,
      goalDay: num(o.goalDay, 3), // survive to this day to win
      goalItem: o.goalItem || null, // optional: crafting this item wins
      state: "playing", // playing | won | dead
    };
  }

  // Eat one food unit from inventory, restoring hunger (clamped at 100).
  function eat(g, restore) {
    if (g.state !== "playing") return false;
    if (g.inventory.food <= 0) return false;
    g.inventory.food--;
    g.hunger = clamp(g.hunger + num(restore, 25), 0, 100);
    return true;
  }

  // Gather from the nearest in-reach node. A node yields `amount` per pull and
  // its qty decrements; depleted nodes (qty 0) yield nothing.
  function gather(g) {
    if (g.state !== "playing") return false;
    for (const n of g.nodes) {
      if (n.qty > 0 && inReach(g.player, n, g.reach)) {
        n.qty--;
        g.inventory[n.type] += num(n.amount, 1);
        return true;
      }
    }
    return false;
  }

  // Atomic craft: only succeeds if every resource suffices; deducts the exact
  // cost once and grants one item. Insufficient resources => false, no change.
  function craft(g, name) {
    if (g.state !== "playing") return false;
    const recipe = RECIPES[name];
    if (!recipe) return false;
    for (const res in recipe) {
      if ((g.inventory[res] || 0) < recipe[res]) return false;
    }
    for (const res in recipe) {
      g.inventory[res] -= recipe[res];
    }
    g.items.push(name);
    if (g.goalItem && name === g.goalItem) g.state = "won";
    return g;
  }

  // Advance the simulation by dt seconds. input = {left,right,up,down}.
  function step(g, input, dt) {
    if (g.state !== "playing") return g;

    const { vx, vy } = inputVector(input);
    g.player.x = clamp(g.player.x + vx * g.speed * dt, 0, g.w - g.player.w);
    g.player.y = clamp(g.player.y + vy * g.speed * dt, 0, g.h - g.player.h);

    // Day-night clock. Track the day count by completed cycles so it increments
    // exactly once per dayLength, not once per step.
    const prevDay = Math.floor(g.clock / g.dayLength);
    g.clock += dt;
    const curDay = Math.floor(g.clock / g.dayLength);
    if (curDay > prevDay) g.day += curDay - prevDay;

    // Hunger always decays; energy decays faster at night.
    g.hunger = clamp(g.hunger - g.hungerRate * dt, 0, 100);
    const nightMul = isNight(g) ? g.nightPenalty : 1;
    g.energy = clamp(g.energy - g.energyRate * nightMul * dt, 0, 100);

    // Health only decays once hunger is exactly 0 (starvation).
    if (g.hunger === 0) {
      g.health = clamp(g.health - g.starveRate * dt, 0, 100);
    }

    if (g.health <= 0) {
      g.health = 0;
      g.state = "dead";
      return g;
    }

    // Win by surviving to the goal day (item-goal is handled in craft()).
    if (!g.goalItem && g.day >= g.goalDay) g.state = "won";

    return g;
  }

  const Logic = {
    clamp,
    inputVector,
    inReach,
    isNight,
    createGame,
    eat,
    gather,
    craft,
    step,
    RECIPES,
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Logic;
  } else {
    root.Logic = Logic;
  }
})(typeof window !== "undefined" ? window : globalThis);
