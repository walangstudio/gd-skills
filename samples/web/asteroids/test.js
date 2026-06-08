// Headless unit tests for the pure game logic. Run: node test.js
"use strict";
const assert = require("assert");
const L = require("./logic.js");

// 1. wrap: modulo, not a single subtract — handles negatives and multi-screen.
assert.strictEqual(L.wrap(-5, 100), 95, "wrap negative");
assert.strictEqual(L.wrap(105, 100), 5, "wrap just over");
assert.strictEqual(L.wrap(250, 100), 50, "wrap several screens out");
assert.strictEqual(L.wrap(0, 100), 0, "wrap zero");
assert.strictEqual(L.wrap(50, 100), 50, "wrap in-range unchanged");

// 2. thrust accelerates the ship along its heading.
let g = L.createGame({ damping: 0 });
g.ship.angle = 0; // facing +x
g.ship.vx = 0;
g.ship.vy = 0;
L.step(g, { thrust: true }, 0.5);
assert.ok(g.ship.vx > 0 && Math.abs(g.ship.vy) < 1e-9, "thrust adds velocity along +x heading");
assert.ok(Math.abs(g.ship.vx - g.thrust * 0.5) < 1e-9, "thrust magnitude = a*dt");

// 3. rotation changes the angle.
g = L.createGame();
const a0 = g.ship.angle;
L.step(g, { left: true }, 0.1);
assert.ok(g.ship.angle < a0, "left decreases angle");
g = L.createGame();
L.step(g, { right: true }, 0.1);
assert.ok(g.ship.angle > a0, "right increases angle");

// 4. bullet fires from the nose along the heading.
g = L.createGame({ damping: 0 });
g.ship.angle = 0;
L.fire(g);
assert.strictEqual(g.bullets.length, 1, "one bullet fired");
let b = g.bullets[0];
assert.ok(b.vx > 0 && Math.abs(b.vy) < 1e-9, "bullet travels along +x heading");
assert.ok(Math.abs(b.x - (g.ship.x + g.ship.r)) < 1e-9, "bullet starts at the nose");

// 5. bullet expires after its lifetime and is removed.
g = L.createGame({ bulletLife: 0.1 });
L.fire(g);
assert.strictEqual(g.bullets.length, 1, "bullet present");
L.step(g, {}, 0.2); // exceed lifetime
assert.strictEqual(g.bullets.length, 0, "expired bullet removed");

// 6. circle-circle hit test at the exact boundary (squared distance).
assert.ok(L.circlesHit(0, 0, 3, 5, 0, 2), "touching at r1+r2 counts as a hit");
assert.ok(!L.circlesHit(0, 0, 3, 5.001, 0, 2), "just beyond r1+r2 misses");

// 7. tunneling regression: a fast bullet aimed through an asteroid still hits.
g = L.createGame({ bulletSpeed: 6000, bulletLife: 1, maxSubStep: 8 });
g.ship.x = 0;
g.ship.y = 100;
g.ship.angle = 0; // fire straight along +x
// In 1/60s the bullet travels 100px — far more than the 8px asteroid diameter
// at x=50, so a naive single-step integrator would tunnel straight past it.
g.asteroids = [{ x: 50, y: 100, vx: 0, vy: 0, size: "large", r: 4 }];
L.fire(g);
L.step(g, {}, 1 / 60); // one frame, displacement >> asteroid radius
assert.strictEqual(g.score, 1, "fast bullet registered the hit (no tunneling)");

// 8. large asteroid splits into exactly 2 smaller children on hit.
g = L.createGame({ bulletSpeed: 1000, seed: 7 });
g.ship.x = 0;
g.ship.y = 50;
g.ship.angle = 0;
g.asteroids = [{ x: 40, y: 50, vx: 0, vy: 0, size: "large", r: 36 }];
L.fire(g);
L.step(g, {}, 1 / 60);
assert.strictEqual(g.asteroids.length, 2, "large split into 2");
assert.ok(g.asteroids.every((a) => a.size === "small"), "children are small");
assert.strictEqual(g.score, 1, "score incremented once for the hit");

// 9. small asteroid is destroyed (0 children) on hit.
g = L.createGame({ bulletSpeed: 1000 });
g.ship.x = 0;
g.ship.y = 50;
g.ship.angle = 0;
g.asteroids = [{ x: 30, y: 50, vx: 0, vy: 0, size: "small", r: 18 }];
L.fire(g);
L.step(g, {}, 1 / 60);
assert.strictEqual(g.asteroids.length, 0, "small asteroid removed");
assert.strictEqual(g.score, 1, "score incremented once");

// 10. splitAsteroid is pure and rng-driven; small yields none, large yields 2.
const rng = L.makeRng(3);
assert.strictEqual(L.splitAsteroid({ size: "small", x: 0, y: 0 }, rng).length, 0, "small -> 0");
const kids = L.splitAsteroid({ size: "large", x: 5, y: 6 }, rng);
assert.strictEqual(kids.length, 2, "large -> 2");
assert.ok(kids.every((k) => k.x === 5 && k.y === 6), "children inherit position");

// 11. ship-vs-asteroid collision costs a life.
g = L.createGame({ lives: 3 });
g.asteroids = [{ x: g.ship.x, y: g.ship.y, vx: 0, vy: 0, size: "large", r: 36 }];
L.step(g, {}, 1 / 60);
assert.strictEqual(g.lives, 2, "collision cost a life");

// 12. clearing all asteroids wins; losing all lives loses.
g = L.createGame();
g.asteroids = [];
L.step(g, {}, 1 / 60);
assert.strictEqual(g.state, "won", "no asteroids => won");

g = L.createGame({ lives: 1 });
g.asteroids = [{ x: g.ship.x, y: g.ship.y, vx: 0, vy: 0, size: "large", r: 36 }];
L.step(g, {}, 1 / 60);
assert.strictEqual(g.state, "lost", "0 lives => lost");

// 13. no state changes once the game is over.
g = L.createGame();
g.state = "won";
const sx = g.ship.x;
L.step(g, { thrust: true, fire: true }, 1);
assert.strictEqual(g.ship.x, sx, "ship frozen after game over");
assert.strictEqual(g.bullets.length, 0, "no firing after game over");

// 14. wrap-aware collision: objects across the screen seam are adjacent, not far.
// One at x≈0, one at x≈w on a 200-wide field overlap visually; raw coords say "far".
assert.ok(
  L.circlesHitWrapped(2, 50, 4, 198, 50, 4, 200, 100),
  "seam-straddling circles collide (wrap-aware)"
);
assert.ok(
  !L.circlesHit(2, 50, 4, 198, 50, 4),
  "...and raw circlesHit would wrongly miss them"
);
assert.ok(
  !L.circlesHitWrapped(2, 50, 4, 100, 50, 4, 200, 100),
  "genuinely-distant circles still miss"
);

// 15. i-frames: a hit recentres the ship and grants invulnerability so a lingering
// asteroid at the centre can't drain every life on consecutive frames.
g = L.createGame({ lives: 3, invulnTime: 2 });
g.asteroids = [
  { x: g.w / 2, y: g.h / 2, vx: 0, vy: 0, size: "large", r: 36 },
];
L.step(g, {}, 1 / 60);
assert.strictEqual(g.lives, 2, "one life lost on the hit");
assert.ok(g.ship.invuln > 0, "ship is invulnerable after the hit");
L.step(g, {}, 1 / 60); // still overlapping, but invulnerable
L.step(g, {}, 1 / 60);
assert.strictEqual(g.lives, 2, "no further life loss while invulnerable");
assert.strictEqual(g.state, "playing", "still alive — no consecutive-frame drain");

console.log("ok - all logic tests passed (15 groups)");
