// Headless unit tests for the pure game logic. Run: node test.js
"use strict";
const assert = require("assert");
const L = require("./logic.js");

const HALF_PI = Math.PI / 2;

// 1. clamp
assert.strictEqual(L.clamp(5, 0, 10), 5);
assert.strictEqual(L.clamp(-3, 0, 10), 0);
assert.strictEqual(L.clamp(99, 0, 10), 10);

// 2. normalizeAngle: folds into [-PI, PI]
assert.ok(Math.abs(L.normalizeAngle(0)) < 1e-9, "0 stays 0");
assert.ok(Math.abs(L.normalizeAngle(Math.PI * 2)) < 1e-9, "2PI -> 0");
assert.ok(Math.abs(L.normalizeAngle(3 * Math.PI) - Math.PI) < 1e-9, "3PI -> PI");
assert.ok(L.normalizeAngle(Math.PI + 0.1) < 0, "just over PI wraps negative");

// 3. inputVector: diagonals are unit length, single axis is ±1
let v = L.inputVector({ right: true, down: true });
assert.ok(Math.abs(Math.hypot(v.vx, v.vy) - 1) < 1e-9, "diagonal normalized");
assert.deepStrictEqual(L.inputVector({ right: true }), { vx: 1, vy: 0 });
assert.deepStrictEqual(L.inputVector({ left: true, right: true }), { vx: 0, vy: 0 });

// helper: build an enemy facing +x (angle 0) at the origin
function enemyFacing(facing, range, halfAngle) {
  return { x: 0, y: 0, w: 0, h: 0, facing, range, halfAngle };
}
function targetAt(x, y) {
  return { x, y, w: 0, h: 0 };
}

// 4. canSee: target directly ahead within range -> TRUE
let e = enemyFacing(0, 100, Math.PI / 6); // faces +x, 30° half-angle, range 100
assert.ok(L.canSee(e, targetAt(50, 0)), "directly ahead in range = seen");

// 5. canSee: target directly BEHIND (~PI off facing) -> FALSE
assert.ok(!L.canSee(e, targetAt(-50, 0)), "directly behind = not seen");

// 6. canSee: within the cone angle but BEYOND range -> FALSE
assert.ok(!L.canSee(e, targetAt(150, 0)), "ahead but out of range = not seen");

// 7. canSee: within range but just OUTSIDE the half-angle -> FALSE.
//   half-angle = 30°. A target at 45° off facing (dy=dx) is outside the cone.
assert.ok(!L.canSee(e, targetAt(40, 40)), "in range but outside cone = not seen");
//   ...and a target at ~20° off facing (inside 30°) IS seen.
assert.ok(L.canSee(e, targetAt(60, 60 * Math.tan(Math.PI / 9))), "inside cone = seen");

// 8. canSee angle WRAP: enemy facing ~350° (-10°) sees a target at ~10° off +x.
//   The diff is 20°, well inside a 30° half-angle. A naive (no-wrap) subtract
//   would read 340° and wrongly reject it.
let ew = enemyFacing(L.normalizeAngle((350 * Math.PI) / 180), 100, Math.PI / 6);
let angle10 = (10 * Math.PI) / 180;
assert.ok(
  L.canSee(ew, targetAt(80 * Math.cos(angle10), 80 * Math.sin(angle10))),
  "wrap-around: 350° vs 10° is a 20° gap = seen"
);

// 9. player movement clamps to the play area
let g = L.createGame({ w: 100, h: 100 });
g.player.x = 0;
L.step(g, { left: true }, 1);
assert.strictEqual(g.player.x, 0, "clamped at left edge");
g.player.x = 0;
L.step(g, { right: true }, 10);
assert.strictEqual(g.player.x, g.w - g.player.w, "clamped at right edge");

// 10. exit requires ALL keys: partial keys then exit = still playing
g = L.createGame({ w: 100, h: 100 });
g.enemy.range = 0; // disable vision for this test
g.exit = { x: 0, y: 0, w: 40, h: 40 };
g.player = { x: 0, y: 0, w: 24, h: 24 }; // on the exit
g.keys = [
  { x: 1000, y: 1000, r: 6, taken: false }, // far away, can't be picked up here
  { x: 1000, y: 1000, r: 6, taken: false },
];
L.step(g, {}, 0.016);
assert.strictEqual(g.state, "playing", "exit with keys remaining does NOT win");

// 11. all keys then exit = won
g = L.createGame({ w: 100, h: 100 });
g.enemy.range = 0;
g.exit = { x: 0, y: 0, w: 40, h: 40 };
g.player = { x: 0, y: 0, w: 24, h: 24 };
g.keys = [{ x: 12, y: 12, r: 9, taken: false }]; // overlaps the player
L.step(g, {}, 0.016);
assert.strictEqual(g.collected, 1, "key collected");
assert.strictEqual(g.state, "won", "all keys + on exit = won");

// 12. a key is only counted once
g = L.createGame({ w: 100, h: 100 });
g.enemy.range = 0;
g.player = { x: 0, y: 0, w: 24, h: 24 };
g.keys = [{ x: 10, y: 10, r: 9, taken: false }];
L.step(g, {}, 0.016);
L.step(g, {}, 0.016);
assert.strictEqual(g.collected, 1, "key counted once");

// 13. battery drains, clamps at 0, and flashlight-on is faster than off
g = L.createGame({ w: 100, h: 100, battery: 1, drainOff: 0.01, drainOn: 0.05 });
g.enemy.range = 0;
L.step(g, { flashlight: false }, 1);
const afterOff = g.battery;
g = L.createGame({ w: 100, h: 100, battery: 1, drainOff: 0.01, drainOn: 0.05 });
g.enemy.range = 0;
L.step(g, { flashlight: true }, 1);
const afterOn = g.battery;
assert.ok(afterOn < afterOff, "flashlight on drains faster than off");
// clamp at 0 — a big dt can't push battery negative
g = L.createGame({ w: 100, h: 100, battery: 0.02, drainOn: 0.05 });
g.enemy.range = 0;
L.step(g, { flashlight: true }, 100);
assert.strictEqual(g.battery, 0, "battery clamps at 0, never negative");

// 14. caught after the grace period -> lost; and no state changes once not playing
g = L.createGame({ w: 200, h: 200, catchGrace: 0.5, enemySpeed: 0 });
// Put the player right in front of the enemy's cone.
g.enemy = { x: 0, y: 90, w: 24, h: 24, facing: 0, range: 300, halfAngle: Math.PI, waypoints: [], wp: 0 };
g.player = { x: 100, y: 90, w: 24, h: 24 };
g.keys = [];
L.step(g, {}, 0.3); // seen 0.3s < 0.5 grace
assert.strictEqual(g.state, "playing", "seen below grace = still playing");
L.step(g, {}, 0.3); // total 0.6s >= 0.5 grace
assert.strictEqual(g.state, "lost", "seen past grace = lost");
// frozen after lost: another step must not move the player or change state
const frozenX = g.player.x;
L.step(g, { right: true }, 1);
assert.strictEqual(g.player.x, frozenX, "no movement once lost");
assert.strictEqual(g.state, "lost", "state frozen after lost");

// 15. losing sight resets the grace timer (not instantly caught on re-sight)
g = L.createGame({ w: 200, h: 200, catchGrace: 0.5, enemySpeed: 0 });
g.enemy = { x: 0, y: 90, w: 24, h: 24, facing: 0, range: 300, halfAngle: Math.PI / 6, waypoints: [], wp: 0 };
g.player = { x: 100, y: 90, w: 24, h: 24 }; // in front -> seen
g.keys = [];
L.step(g, {}, 0.3);
assert.ok(g.seenFor > 0, "seenFor accumulates while seen");
g.enemy.facing = Math.PI; // turn enemy away -> not seen
L.step(g, {}, 0.3);
assert.strictEqual(g.seenFor, 0, "grace timer resets when sight is lost");
assert.strictEqual(g.state, "playing", "not caught after sight broken");

console.log("ok - all logic tests passed (15 groups)");
