// Pure game logic — no DOM, no canvas. Works in the browser (attaches to window)
// and in Node (module.exports), so the mechanics can be unit-tested headless.
// See test.js. The rendering/input lives in game.js.
//
// No Math.random in here: any randomness (asteroid split directions) is supplied
// by an injected rng so the simulation is deterministic and testable.

(function (root) {
  "use strict";

  // Modulo wrap onto [0, max). Unlike a single subtract this handles negatives
  // and values several screens out: wrap(-5,100)=95, wrap(105,100)=5, wrap(250,100)=50.
  function wrap(v, max) {
    return ((v % max) + max) % max;
  }

  // Circle-vs-circle overlap using squared distance (no sqrt).
  function circlesHit(ax, ay, ar, bx, by, br) {
    const dx = ax - bx;
    const dy = ay - by;
    const rr = ar + br;
    return dx * dx + dy * dy <= rr * rr;
  }

  // Wrap-aware circle overlap on a toroidal field: the shortest distance on each
  // axis may go across the screen seam, so two objects near opposite edges (one at
  // x≈0, one at x≈w) are actually adjacent. Use this for all in-world collisions.
  function circlesHitWrapped(ax, ay, ar, bx, by, br, w, h) {
    let dx = Math.abs(ax - bx);
    let dy = Math.abs(ay - by);
    if (dx > w / 2) dx = w - dx;
    if (dy > h / 2) dy = h - dy;
    const rr = ar + br;
    return dx * dx + dy * dy <= rr * rr;
  }

  // Asteroid radius by size tier.
  function asteroidRadius(size) {
    return size === "large" ? 36 : 18;
  }

  // Split a large asteroid into 2 next-size-down children; a small one yields none.
  // Children inherit position; their velocities use the injected rng (0..1).
  function splitAsteroid(a, rng) {
    if (a.size !== "large") return [];
    const speed = 60;
    const children = [];
    for (let i = 0; i < 2; i++) {
      const ang = rng() * Math.PI * 2;
      children.push({
        x: a.x,
        y: a.y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        size: "small",
        r: asteroidRadius("small"),
      });
    }
    return children;
  }

  // Tiny deterministic PRNG (mulberry32) so logic.js never touches Math.random.
  // game.js can inject its own rng via opts.rng for visual variety.
  function makeRng(seed) {
    let a = seed >>> 0;
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
    const w = o.w || 640;
    const h = o.h || 480;
    return {
      w,
      h,
      rng: o.rng || makeRng(o.seed || 1),
      rotSpeed: o.rotSpeed || Math.PI, // rad/sec
      thrust: o.thrust || 240, // px/sec^2 along heading
      damping: o.damping == null ? 0.4 : o.damping, // mild velocity decay /sec
      bulletSpeed: o.bulletSpeed || 480, // px/sec
      bulletLife: o.bulletLife || 1.2, // seconds
      maxSubStep: o.maxSubStep || 8, // px per integration sub-step (anti-tunnel)
      invulnTime: o.invulnTime == null ? 2 : o.invulnTime, // i-frames after a hit (sec)
      ship: {
        x: w / 2,
        y: h / 2,
        angle: -Math.PI / 2, // facing up
        vx: 0,
        vy: 0,
        r: 12,
        invuln: 0, // >0 = invulnerable; counts down each step
      },
      bullets: [],
      asteroids: [],
      lives: o.lives || 3,
      score: 0,
      state: "playing", // playing | won | lost
    };
  }

  // Fire a bullet from the ship's nose along its heading.
  function fire(g) {
    const s = g.ship;
    const nx = s.x + Math.cos(s.angle) * s.r;
    const ny = s.y + Math.sin(s.angle) * s.r;
    g.bullets.push({
      x: nx,
      y: ny,
      vx: Math.cos(s.angle) * g.bulletSpeed,
      vy: Math.sin(s.angle) * g.bulletSpeed,
      life: g.bulletLife,
      r: 2,
    });
  }

  // Move (x,y) by (vx,vy)*dt in sub-steps no larger than maxStep px, calling
  // onStep(x,y) after each so fast movers can't tunnel through collisions.
  // Returns the final wrapped position, or null if onStep signalled a stop.
  function integrate(g, x, y, vx, vy, dt, maxStep, onStep) {
    const dist = Math.hypot(vx * dt, vy * dt);
    const steps = Math.max(1, Math.ceil(dist / maxStep));
    const sdt = dt / steps;
    for (let i = 0; i < steps; i++) {
      x = wrap(x + vx * sdt, g.w);
      y = wrap(y + vy * sdt, g.h);
      if (onStep && onStep(x, y) === false) return null;
    }
    return { x, y };
  }

  // Advance the simulation by dt seconds. input = {left,right,thrust,fire}.
  function step(g, input, dt) {
    if (g.state !== "playing") return g;
    const inp = input || {};
    const s = g.ship;

    // Tick down post-hit invulnerability.
    if (s.invuln > 0) s.invuln = Math.max(0, s.invuln - dt);

    // Rotation.
    if (inp.left) s.angle -= g.rotSpeed * dt;
    if (inp.right) s.angle += g.rotSpeed * dt;

    // Thrust along heading.
    if (inp.thrust) {
      s.vx += Math.cos(s.angle) * g.thrust * dt;
      s.vy += Math.sin(s.angle) * g.thrust * dt;
    }
    // Mild damping (space-ish drift, but not infinite runaway).
    const decay = Math.max(0, 1 - g.damping * dt);
    s.vx *= decay;
    s.vy *= decay;

    // Fire (edge-triggered by game.js, which only sets fire once per press).
    if (inp.fire) fire(g);

    // Move ship.
    const sp = integrate(g, s.x, s.y, s.vx, s.vy, dt, g.maxSubStep);
    s.x = sp.x;
    s.y = sp.y;

    // Move asteroids (sub-stepped — they can drift fast too).
    for (const a of g.asteroids) {
      const p = integrate(g, a.x, a.y, a.vx, a.vy, dt, g.maxSubStep);
      a.x = p.x;
      a.y = p.y;
    }

    // Move bullets, checking asteroid collisions each sub-step (anti-tunnel),
    // and age them out by lifetime.
    const survivingBullets = [];
    for (const b of g.bullets) {
      b.life -= dt;
      if (b.life <= 0) continue; // expired

      let hit = false;
      const end = integrate(g, b.x, b.y, b.vx, b.vy, dt, g.maxSubStep, (bx, by) => {
        for (let i = 0; i < g.asteroids.length; i++) {
          const a = g.asteroids[i];
          if (circlesHitWrapped(bx, by, b.r, a.x, a.y, a.r, g.w, g.h)) {
            g.score++;
            const kids = splitAsteroid(a, g.rng);
            g.asteroids.splice(i, 1, ...kids);
            hit = true;
            return false; // stop integrating this bullet
          }
        }
        return true;
      });
      if (hit) continue; // bullet consumed
      b.x = end.x;
      b.y = end.y;
      survivingBullets.push(b);
    }
    g.bullets = survivingBullets;

    // Ship-vs-asteroid: costs a life, resets ship to center with brief i-frames
    // so it doesn't re-collide (and drain every life) while still overlapping the
    // asteroid it just hit. Skip entirely while already invulnerable.
    if (s.invuln <= 0) {
      for (const a of g.asteroids) {
        if (circlesHitWrapped(s.x, s.y, s.r, a.x, a.y, a.r, g.w, g.h)) {
          g.lives--;
          s.x = g.w / 2;
          s.y = g.h / 2;
          s.vx = 0;
          s.vy = 0;
          s.invuln = g.invulnTime;
          break;
        }
      }
    }

    if (g.lives <= 0) {
      g.state = "lost";
    } else if (g.asteroids.length === 0) {
      g.state = "won";
    }
    return g;
  }

  const Logic = {
    wrap,
    circlesHit,
    circlesHitWrapped,
    asteroidRadius,
    splitAsteroid,
    fire,
    integrate,
    makeRng,
    createGame,
    step,
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Logic;
  } else {
    root.Logic = Logic;
  }
})(typeof window !== "undefined" ? window : globalThis);
