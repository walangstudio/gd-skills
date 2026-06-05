// Headless unit tests for the pure game logic. Run: node test.js
"use strict";
const assert = require("assert");
const L = require("./logic.js");

// 1. clamp
assert.strictEqual(L.clamp(5, 0, 10), 5);
assert.strictEqual(L.clamp(-3, 0, 10), 0);
assert.strictEqual(L.clamp(99, 0, 10), 10);

// 2. inCircle: inside vs outside
assert.ok(L.inCircle(10, 10, { x: 12, y: 12, r: 9 }));
assert.ok(!L.inCircle(10, 10, { x: 200, y: 200, r: 9 }));

// 3. throttle accelerates and caps at maxSpeed; never exceeds it
let g = L.createGame({ maxSpeed: 100, accel: 1000 });
let s = L.applyDrive(g, 0, { throttle: true }, 0.05);
assert.ok(s > 0, "throttle increases speed");
s = L.applyDrive(g, 99, { throttle: true }, 1); // huge dt would overshoot
assert.strictEqual(s, 100, "speed capped at maxSpeed");

// 4. brake decelerates a moving car and can drive it into (capped) reverse
g = L.createGame({ brake: 1000, maxReverse: 50 });
s = L.applyDrive(g, 100, { brake: true }, 0.05);
assert.ok(s < 100, "brake reduces forward speed");
s = L.applyDrive(g, 0, { brake: true }, 1); // would overshoot reverse cap
assert.strictEqual(s, -50, "reverse capped at -maxReverse");

// 5. friction (no input) decays speed toward 0 and NEVER flips sign from drag
g = L.createGame({ friction: 1000 });
s = L.applyDrive(g, 30, {}, 1); // drop (1000) far exceeds current speed
assert.strictEqual(s, 0, "forward friction stops at exactly 0, no sign flip");
s = L.applyDrive(g, -30, {}, 1);
assert.strictEqual(s, 0, "reverse friction stops at exactly 0, no sign flip");
// coasting from a real speed only reduces magnitude
g = L.createGame({ friction: 140 });
const before = 200;
const after = L.applyDrive(g, before, {}, 0.1);
assert.ok(after < before && after > 0, "coasting decays but stays positive");

// 6. steering authority is 0 at speed 0 and ramps up with speed
g = L.createGame({ steerSpeedRef: 120 });
assert.strictEqual(L.steerAuthority(g, 0), 0, "no steering authority when parked");
assert.ok(L.steerAuthority(g, 60) > 0, "some authority at moderate speed");
assert.strictEqual(L.steerAuthority(g, 240), 1, "authority saturates at 1");

// 7. a stationary car does NOT change angle when steering
g = L.createGame();
g.car.speed = 0;
const a0 = g.car.angle;
L.step(g, { left: true }, 0.1);
assert.strictEqual(g.car.angle, a0, "steering at speed 0 is a no-op");
// but a moving car does turn
g = L.createGame();
g.car.speed = 200;
const a1 = g.car.angle;
L.step(g, { left: true }, 0.1);
assert.ok(g.car.angle !== a1, "moving car turns when steering");

// 8. position integrates along heading (cos/sin * speed * dt)
g = L.createGame({ checkpoints: [{ x: -999, y: -999, r: 1 }] }); // unreachable
g.car.x = 100;
g.car.y = 100;
g.car.angle = 0; // facing +x
g.car.speed = 100;
L.step(g, {}, 0.1); // friction default 140 over 0.1s -> 86 px/s avg, but x must grow
assert.ok(g.car.x > 100, "moves in +x along heading angle 0");
assert.strictEqual(Math.round(g.car.y), 100, "no y movement at angle 0");

// 9. checkpoints MUST be taken in order: out-of-order pass is ignored
g = L.createGame({
  checkpoints: [
    { x: 0, y: 0, r: 5 }, // cp0 (must be first)
    { x: 50, y: 0, r: 5 }, // cp1
    { x: 100, y: 0, r: 5 }, // cp2
  ],
});
// park the car on cp2 while cp0 is still required
g.car.x = 100;
g.car.y = 0;
g.car.speed = 0;
L.advanceCheckpoint(g);
assert.strictEqual(g.nextCp, 0, "reaching a later checkpoint does not advance");
// now hit cp0 in order -> advances to 1
g.car.x = 0;
g.car.y = 0;
L.advanceCheckpoint(g);
assert.strictEqual(g.nextCp, 1, "in-order pass advances the index");

// 10. a full lap increments lapsDone exactly once (not once per checkpoint)
g = L.createGame({
  totalLaps: 99, // don't win mid-test
  checkpoints: [
    { x: 0, y: 0, r: 5 },
    { x: 50, y: 0, r: 5 },
    { x: 100, y: 0, r: 5 },
  ],
});
const seq = [
  { x: 0, y: 0 },
  { x: 50, y: 0 },
  { x: 100, y: 0 },
];
for (const p of seq) {
  g.car.x = p.x;
  g.car.y = p.y;
  L.advanceCheckpoint(g);
}
assert.strictEqual(g.lapsDone, 1, "one full sequence = exactly one lap");
assert.strictEqual(g.nextCp, 0, "index wraps back to start/finish");

// 11. checkpoint tunneling: a high-speed pass still registers (sub-stepping)
g = L.createGame({
  maxSpeed: 100000,
  maxSubStep: 8,
  checkpoints: [
    { x: 500, y: 100, r: 10 }, // small checkpoint directly ahead
    { x: 9999, y: 9999, r: 5 },
  ],
});
g.car.x = 100;
g.car.y = 100;
g.car.angle = 0; // +x, straight at the checkpoint
g.car.speed = 60000; // ~6000 px in one frame — would skip past without sub-steps
L.step(g, {}, 0.1);
assert.strictEqual(g.nextCp, 1, "fast car still triggers the checkpoint it passed through");

// 12. winning after totalLaps and frozen state afterward
g = L.createGame({
  totalLaps: 1,
  checkpoints: [
    { x: 0, y: 0, r: 5 },
    { x: 50, y: 0, r: 5 },
  ],
});
g.car.x = 0; g.car.y = 0; L.advanceCheckpoint(g);
g.car.x = 50; g.car.y = 0; L.advanceCheckpoint(g);
assert.strictEqual(g.state, "won", "win after totalLaps");
assert.strictEqual(g.lapsDone, 1, "exactly one lap completed");
// frozen: no further state changes once won
const snap = { x: g.car.x, y: g.car.y, laps: g.lapsDone, t: g.time, np: g.nextCp };
L.step(g, { throttle: true, right: true }, 1);
assert.strictEqual(g.car.x, snap.x, "car frozen after win (x)");
assert.strictEqual(g.car.y, snap.y, "car frozen after win (y)");
assert.strictEqual(g.lapsDone, snap.laps, "laps frozen after win");
assert.strictEqual(g.time, snap.t, "timer frozen after win");
assert.strictEqual(g.nextCp, snap.np, "checkpoint index frozen after win");

// 13. lap timer accumulates while playing
g = L.createGame({ checkpoints: [{ x: -999, y: -999, r: 1 }], totalLaps: 99 });
L.step(g, {}, 0.5);
L.step(g, {}, 0.25);
assert.ok(Math.abs(g.time - 0.75) < 1e-9, "timer accumulates dt while playing");

// 14. overlapping checkpoints must not rack up phantom laps in a single frame.
// Two gates whose radii overlap: a car driving straight through the overlap region
// once must complete AT MOST the start gate — it cannot "lap" by sitting inside both.
// (Without the rising-edge guard, one high-speed step counted several laps.)
g = L.createGame({
  checkpoints: [
    { x: 0, y: 0, r: 50 }, // cp0 (start/finish)
    { x: 30, y: 0, r: 50 }, // cp1 overlaps cp0
  ],
  totalLaps: 99,
  maxSpeed: 100000,
  accel: 100000,
  maxSubStep: 8,
});
g.car.x = 0;
g.car.y = 0;
g.car.angle = 0; // +x, straight through both overlapping gates
L.step(g, { throttle: true }, 0.1); // ~thousands of px in one frame
assert.strictEqual(g.lapsDone, 0, "no phantom lap from overlapping gates in one frame");
assert.ok(g.nextCp <= 1, "advanced at most into the overlap, not wrapped repeatedly");

console.log("ok - all logic tests passed (14 groups)");
