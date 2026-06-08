// Pure game logic — no DOM, no canvas. Works in the browser (attaches to window)
// and in Node (module.exports), so the mechanics can be unit-tested headless.
// See test.js. The rendering/input lives in game.js.
//
// No Math.random in here: the patrol is deterministic. Any future randomness must
// be supplied by an injected rng so the simulation stays deterministic and testable.

(function (root) {
  "use strict";

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  // Normalize an angle (radians) into [-PI, PI]. This is what makes the
  // facing-vs-target comparison wrap-safe: 350° vs 10° reads as 20°, not 340°.
  function normalizeAngle(a) {
    a = a % (Math.PI * 2);
    if (a > Math.PI) a -= Math.PI * 2;
    if (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  // AABB (player box) vs circle (pickup): true if they overlap.
  function hitsCircle(box, c) {
    const cx = clamp(c.x, box.x, box.x + box.w);
    const cy = clamp(c.y, box.y, box.y + box.h);
    const dx = c.x - cx;
    const dy = c.y - cy;
    return dx * dx + dy * dy <= c.r * c.r;
  }

  // Map a directional input to a unit vector (diagonals normalized).
  function inputVector(input) {
    const i = input || {};
    let vx = (i.right ? 1 : 0) - (i.left ? 1 : 0);
    let vy = (i.down ? 1 : 0) - (i.up ? 1 : 0);
    if (vx && vy) {
      vx *= Math.SQRT1_2;
      vy *= Math.SQRT1_2;
    }
    return { vx, vy };
  }

  // Center point of an entity. Player carries {x,y,w,h}; the enemy/target a box too.
  function centerOf(e) {
    return { x: e.x + e.w / 2, y: e.y + e.h / 2 };
  }

  // Vision cone test. The enemy sees the target iff:
  //   1. the target's center is within `range` of the enemy's center (distance), AND
  //   2. the angle between the enemy's facing and the to-target vector is within
  //      `halfAngle` of straight ahead.
  // The angle difference is normalized into [-PI, PI] so it wraps correctly
  // (a target at facing+2° and a target at facing-2° are both "ahead").
  // FALSE for a target behind the enemy (~PI off), beyond range, or outside halfAngle.
  function canSee(enemy, target) {
    const ec = centerOf(enemy);
    const tc = centerOf(target);
    const dx = tc.x - ec.x;
    const dy = tc.y - ec.y;
    const dist = Math.hypot(dx, dy);
    if (dist > enemy.range) return false;
    if (dist === 0) return true; // co-located: trivially seen
    const toTarget = Math.atan2(dy, dx);
    const diff = Math.abs(normalizeAngle(toTarget - enemy.facing));
    return diff <= enemy.halfAngle;
  }

  // Tiny deterministic PRNG (mulberry32) so logic.js never touches Math.random.
  // Present for parity with the other samples; the default patrol doesn't use it.
  function makeRng(seed) {
    let a = (seed || 1) >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createGame(opts) {
    const o = opts || {};
    const w = o.w || 480;
    const h = o.h || 320;
    return {
      w,
      h,
      rng: o.rng || makeRng(o.seed || 1),
      speed: o.speed || 130, // player px/sec
      enemySpeed: o.enemySpeed || 70, // patrol px/sec
      catchGrace: o.catchGrace == null ? 0.6 : o.catchGrace, // seconds seen before "lost"
      // Flashlight battery: a 0..1 resource that drains over time, faster when on.
      battery: o.battery == null ? 1 : o.battery,
      drainOff: o.drainOff == null ? 0.01 : o.drainOff, // per-sec drain, light off
      drainOn: o.drainOn == null ? 0.05 : o.drainOn, // per-sec drain, light on
      seenFor: 0, // accumulated seconds the enemy has had the player in view
      player: { x: w / 2 - 12, y: h - 36, w: 24, h: 24 },
      enemy: {
        x: w / 2 - 12,
        y: 40,
        w: 24,
        h: 24,
        facing: 0, // radians; faces +x initially
        halfAngle: o.halfAngle == null ? Math.PI / 6 : o.halfAngle, // 30° each side
        range: o.range || 140,
        waypoints: o.waypoints || [
          { x: 40, y: 40 },
          { x: w - 64, y: 40 },
        ],
        wp: 0, // index of the waypoint currently being approached
      },
      keys: [], // pickups: {x,y,r,taken}
      collected: 0,
      exit: o.exit || { x: w / 2 - 16, y: 8, w: 32, h: 32 },
      state: "playing", // playing | won | lost
    };
  }

  // Move the enemy toward its current waypoint; on arrival, advance to the next
  // (looping). Facing is set from the movement direction so the vision cone
  // points where it's headed. Deterministic — no rng.
  function patrol(enemy, dt, speed) {
    const wps = enemy.waypoints;
    if (!wps || wps.length === 0) return;
    const ec = centerOf(enemy);
    const target = wps[enemy.wp % wps.length];
    const dx = target.x - ec.x;
    const dy = target.y - ec.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0) enemy.facing = Math.atan2(dy, dx);
    const move = speed * dt;
    if (move >= dist) {
      // Snap to the waypoint and aim at the next one.
      enemy.x = target.x - enemy.w / 2;
      enemy.y = target.y - enemy.h / 2;
      enemy.wp = (enemy.wp + 1) % wps.length;
    } else {
      enemy.x += (dx / dist) * move;
      enemy.y += (dy / dist) * move;
    }
  }

  // True if the player box overlaps the exit box (AABB vs AABB).
  function boxesOverlap(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  // Advance the simulation by dt seconds.
  // input = {left,right,up,down,flashlight}.
  function step(g, input, dt) {
    if (g.state !== "playing") return g; // frozen after win/lost

    const inp = input || {};

    // Player movement (clamped to the play area).
    const { vx, vy } = inputVector(inp);
    g.player.x = clamp(g.player.x + vx * g.speed * dt, 0, g.w - g.player.w);
    g.player.y = clamp(g.player.y + vy * g.speed * dt, 0, g.h - g.player.h);

    // Flashlight battery drains every step; faster while the light is on.
    // Clamp at 0 — never negative.
    const drain = inp.flashlight ? g.drainOn : g.drainOff;
    g.battery = clamp(g.battery - drain * dt, 0, 1);

    // Key pickups: count each once.
    for (const k of g.keys) {
      if (!k.taken && hitsCircle(g.player, k)) {
        k.taken = true;
        g.collected++;
      }
    }

    // Enemy patrol + vision.
    patrol(g.enemy, dt, g.enemySpeed);
    if (canSee(g.enemy, g.player)) {
      g.seenFor += dt;
      if (g.seenFor >= g.catchGrace) {
        g.state = "lost";
        return g;
      }
    } else {
      g.seenFor = 0; // lost sight — reset the grace timer
    }

    // Win: all keys collected AND standing on the exit. Reaching the exit with
    // keys still out is a no-op (stays "playing").
    const remaining = g.keys.length - g.collected;
    if (remaining === 0 && boxesOverlap(g.player, g.exit)) {
      g.state = "won";
    }
    return g;
  }

  const Logic = {
    clamp,
    normalizeAngle,
    hitsCircle,
    inputVector,
    centerOf,
    canSee,
    makeRng,
    createGame,
    patrol,
    boxesOverlap,
    step,
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Logic;
  } else {
    root.Logic = Logic;
  }
})(typeof window !== "undefined" ? window : globalThis);
