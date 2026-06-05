// Headless unit tests for the pure game logic. Run: node test.js
"use strict";
const assert = require("assert");
const L = require("./logic.js");

// 1. till: untilled -> tilled, and tilling a non-untilled plot is a no-op
let g = L.createGame();
assert.strictEqual(L.till(g, 0, 0), true, "till succeeds on untilled");
assert.strictEqual(L.plotAt(g, 0, 0).state, "tilled");
assert.strictEqual(L.till(g, 0, 0), false, "tilling tilled soil is a no-op");

// 2. plant only on tilled; deducts exactly one seed
g = L.createGame({ seeds: { carrot: 1 } });
assert.strictEqual(L.plant(g, 0, 0, "carrot"), false, "cannot plant on untilled");
L.till(g, 0, 0);
assert.strictEqual(L.plant(g, 0, 0, "carrot"), true, "plant on tilled");
assert.strictEqual(g.seeds.carrot, 0, "one seed consumed");
assert.strictEqual(L.plotAt(g, 0, 0).state, "planted");

// 3. plant with zero seeds is a no-op false; no state change
g = L.createGame({ seeds: { carrot: 0 } });
L.till(g, 1, 1);
assert.strictEqual(L.plant(g, 1, 1, "carrot"), false, "no seeds -> no-op");
assert.strictEqual(L.plotAt(g, 1, 1).state, "tilled", "plot unchanged");
assert.strictEqual(g.seeds.carrot, 0, "seeds still zero");

// 4. water guard: water only on planted/growing, not on tilled/untilled
g = L.createGame({ seeds: { carrot: 1 } });
assert.strictEqual(L.water(g, 0, 0), false, "cannot water untilled");
L.till(g, 0, 0);
assert.strictEqual(L.water(g, 0, 0), false, "cannot water tilled");
L.plant(g, 0, 0, "carrot");
assert.strictEqual(L.water(g, 0, 0), true, "water planted crop");

// 5. watering gate: watered crop advances exactly one stage on endDay;
//    unwatered crop does NOT advance
g = L.createGame({ seeds: { corn: 2 } });
L.till(g, 0, 0);
L.plant(g, 0, 0, "corn"); // corn: 3 stages, stage starts 0
L.water(g, 0, 0);
L.endDay(g);
let p = L.plotAt(g, 0, 0);
assert.strictEqual(p.stage, 1, "watered crop advanced one stage");
assert.strictEqual(p.state, "growing");
assert.strictEqual(p.watered, false, "watered flag reset after endDay");
// now do NOT water; endDay should not advance (stage stays, wilts to floor)
L.endDay(g);
p = L.plotAt(g, 0, 0);
assert.strictEqual(p.stage, 0, "unwatered crop did not advance (wilted to 0)");

// 6. idempotent watering: watering twice the same day = one stage on endDay
g = L.createGame({ seeds: { corn: 1 } });
L.till(g, 0, 0);
L.plant(g, 0, 0, "corn");
assert.strictEqual(L.water(g, 0, 0), true, "first water");
assert.strictEqual(L.water(g, 0, 0), false, "second water same day is no-op");
L.endDay(g);
assert.strictEqual(L.plotAt(g, 0, 0).stage, 1, "double-water -> single stage");

// 7. full grow cycle reaches ripe at the final stage
g = L.createGame({ seeds: { carrot: 1 } });
L.till(g, 0, 0);
L.plant(g, 0, 0, "carrot"); // carrot: 2 stages
L.water(g, 0, 0);
L.endDay(g); // stage 1, growing
assert.strictEqual(L.plotAt(g, 0, 0).state, "growing");
L.water(g, 0, 0);
L.endDay(g); // stage 2 == stages -> ripe
assert.strictEqual(L.plotAt(g, 0, 0).state, "ripe", "reached ripe");

// 8. harvest guard: harvesting an unripe crop yields nothing
g = L.createGame({ seeds: { carrot: 1 }, gold: 0 });
L.till(g, 0, 0);
L.plant(g, 0, 0, "carrot");
assert.strictEqual(L.harvest(g, 0, 0), false, "cannot harvest unripe");
assert.strictEqual(g.gold, 0, "no gold from failed harvest");

// 9. harvest yields produce ONCE; re-harvesting the now-tilled plot yields nothing
g = L.createGame({ seeds: { carrot: 1 }, gold: 0, goal: 1000 });
L.till(g, 0, 0);
L.plant(g, 0, 0, "carrot");
L.water(g, 0, 0);
L.endDay(g);
L.water(g, 0, 0);
L.endDay(g); // ripe
assert.strictEqual(L.harvest(g, 0, 0), true, "harvest ripe crop");
assert.strictEqual(g.gold, L.CROPS.carrot.price, "gold added once");
assert.strictEqual(L.plotAt(g, 0, 0).state, "tilled", "plot back to tilled");
assert.strictEqual(L.plotAt(g, 0, 0).crop, null, "crop consumed");
assert.strictEqual(L.harvest(g, 0, 0), false, "re-harvest yields nothing");
assert.strictEqual(g.gold, L.CROPS.carrot.price, "gold unchanged on re-harvest");

// 10. economy: buySeed deducts gold and adds a seed; unaffordable is a no-op
g = L.createGame({ gold: 4, seeds: { carrot: 0 } });
assert.strictEqual(L.buySeed(g, "carrot"), true, "buy carrot seed");
assert.strictEqual(g.gold, 4 - L.CROPS.carrot.seedCost, "gold deducted");
assert.strictEqual(g.seeds.carrot, 1, "seed added");
assert.strictEqual(L.buySeed(g, "carrot"), false, "cannot afford second seed");
assert.strictEqual(g.seeds.carrot, 1, "seed count unchanged");

// 11. win condition: reaching goal gold via harvest sets state to won
g = L.createGame({ seeds: { pumpkin: 1 }, gold: 0, goal: L.CROPS.pumpkin.price });
L.till(g, 0, 0);
L.plant(g, 0, 0, "pumpkin"); // 4 stages
for (let i = 0; i < 4; i++) {
  L.water(g, 0, 0);
  L.endDay(g);
}
assert.strictEqual(L.plotAt(g, 0, 0).state, "ripe", "pumpkin ripe after 4 watered days");
L.harvest(g, 0, 0);
assert.strictEqual(g.state, "won", "win state reached on goal gold");

// 12. bounds: actions on out-of-grid coordinates are safe no-ops
g = L.createGame();
assert.strictEqual(L.plotAt(g, -1, 0), null, "negative coord -> null");
assert.strictEqual(L.plotAt(g, 999, 999), null, "out-of-range coord -> null");
assert.strictEqual(L.till(g, -1, 0), false, "till OOB no-op");
assert.strictEqual(L.plant(g, 0, 999, "carrot"), false, "plant OOB no-op");
assert.strictEqual(L.water(g, 999, 0), false, "water OOB no-op");
assert.strictEqual(L.harvest(g, -5, -5), false, "harvest OOB no-op");

// 13. frozen after win: no action mutates the game once state != "playing"
g = L.createGame({ seeds: { carrot: 1 } });
g.state = "won";
const goldBefore = g.gold;
assert.strictEqual(L.till(g, 0, 0), false, "till frozen after win");
assert.strictEqual(L.plant(g, 0, 0, "carrot"), false, "plant frozen after win");
assert.strictEqual(L.buySeed(g, "carrot"), false, "buy frozen after win");
L.endDay(g);
assert.strictEqual(g.day, 1, "endDay does not advance after win");
assert.strictEqual(g.gold, goldBefore, "gold unchanged after win");
assert.strictEqual(L.plotAt(g, 0, 0).state, "untilled", "plots unchanged after win");

// 14. wilt floor: an unwatered just-planted crop (stage 0) stays at 0, not negative
g = L.createGame({ seeds: { corn: 1 } });
L.till(g, 0, 0);
L.plant(g, 0, 0, "corn");
L.endDay(g); // never watered, stage 0
p = L.plotAt(g, 0, 0);
assert.strictEqual(p.stage, 0, "wilt floored at 0");
assert.strictEqual(p.state, "planted", "still planted, not ripe/negative");

console.log("ok - all logic tests passed (14 groups)");
