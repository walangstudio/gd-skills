// Pure game logic — no DOM, no canvas, no Math.random. Works in the browser
// (attaches to window) and in Node (module.exports), so the mechanics can be
// unit-tested headless. See test.js. Rendering/input/RNG live in game.js.

(function (root) {
  "use strict";

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  // AABB overlap test: true if the two boxes ({x,y,w,h}) intersect.
  function hitsBox(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  // Map a horizontal input to a unit scalar (-1 left, +1 right, 0 if both/none).
  function inputVector(input) {
    return (input.right ? 1 : 0) - (input.left ? 1 : 0);
  }

  function createGame(opts) {
    const o = opts || {};
    const w = o.w || 480;
    const h = o.h || 320;
    const pw = o.playerW || 32;
    const ph = o.playerH || 20;
    return {
      w,
      h,
      goal: o.goal || 10, // score to win
      speed: o.speed || 220, // player px/sec
      bulletSpeed: o.bulletSpeed || 420, // px/sec (upward)
      enemySpeed: o.enemySpeed || 90, // px/sec (downward)
      fireCooldown: o.fireCooldown || 0.25, // seconds between shots
      spawnInterval: o.spawnInterval || 0.8, // seconds between enemy spawns
      bulletW: o.bulletW || 4,
      bulletH: o.bulletH || 10,
      enemyW: o.enemyW || 28,
      enemyH: o.enemyH || 22,
      player: { x: w / 2 - pw / 2, y: h - ph - 8, w: pw, h: ph },
      lives: o.lives || 3,
      bullets: [],
      enemies: [],
      cooldown: 0, // time remaining before the player can fire again
      spawnTimer: o.spawnInterval || 0.8, // time remaining before the next enemy spawns
      score: 0,
      state: "playing", // playing | won | lost
    };
  }

  // Spawn an enemy at a deterministic x using the injected rng (0..1).
  function spawnEnemy(g, rng) {
    const x = clamp(rng() * (g.w - g.enemyW), 0, g.w - g.enemyW);
    g.enemies.push({ x, y: -g.enemyH, w: g.enemyW, h: g.enemyH, dead: false });
  }

  // Fire a bullet from the player's center, top edge. Respects the cooldown.
  function fire(g) {
    if (g.cooldown > 0) return false;
    g.bullets.push({
      x: g.player.x + g.player.w / 2 - g.bulletW / 2,
      y: g.player.y - g.bulletH,
      w: g.bulletW,
      h: g.bulletH,
      dead: false,
    });
    g.cooldown = g.fireCooldown;
    return true;
  }

  // Resolve bullet-vs-enemy collisions for one (sub)step, after positions move.
  // Bullets travel up, enemies down; both flagged dead on first overlap so each
  // kill counts exactly once.
  function resolveHits(g) {
    for (const b of g.bullets) {
      if (b.dead) continue;
      for (const e of g.enemies) {
        if (e.dead) continue;
        if (hitsBox(b, e)) {
          b.dead = true;
          e.dead = true;
          g.score++;
          break; // one bullet kills at most one enemy
        }
      }
    }
  }

  // Move all bullets/enemies by dt, sub-stepping so fast movers can't tunnel
  // through a collider. Each sub-step advances at most `minSize` px, and we
  // test collisions after every sub-step. Returns nothing; mutates g.
  function integrate(g, dt) {
    const bulletDisp = g.bulletSpeed * dt;
    const enemyDisp = g.enemySpeed * dt;
    const maxDisp = Math.max(bulletDisp, enemyDisp);
    // Smallest collider dimension that a fast mover could skip past.
    const minSize = Math.min(g.bulletH, g.enemyH, g.bulletW, g.enemyW);
    const subSteps = Math.max(1, Math.ceil(maxDisp / minSize));
    const sub = dt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      for (const b of g.bullets) {
        if (!b.dead) b.y -= g.bulletSpeed * sub;
      }
      for (const e of g.enemies) {
        if (!e.dead) e.y += g.enemySpeed * sub;
      }
      resolveHits(g);
    }
  }

  // Advance the simulation by dt seconds.
  // input = { left, right, fire }. rng is a 0..1 function (injected).
  function step(g, input, dt, rng) {
    if (g.state !== "playing") return g;
    input = input || {};

    // Player movement (horizontal only), clamped to the play area.
    const vx = inputVector(input);
    g.player.x = clamp(g.player.x + vx * g.speed * dt, 0, g.w - g.player.w);

    // Fire cooldown.
    if (g.cooldown > 0) g.cooldown = Math.max(0, g.cooldown - dt);
    if (input.fire) fire(g);

    // Enemy spawning on a timer, using the injected rng.
    if (rng) {
      g.spawnTimer -= dt;
      while (g.spawnTimer <= 0) {
        spawnEnemy(g, rng);
        g.spawnTimer += g.spawnInterval;
      }
    }

    // Move + collide (sub-stepped against tunneling).
    integrate(g, dt);

    // Enemies that reach the bottom or touch the player cost a life.
    let lifeLost = 0;
    for (const e of g.enemies) {
      if (e.dead) continue;
      if (e.y + e.h >= g.h || hitsBox(e, g.player)) {
        e.dead = true;
        lifeLost++;
      }
    }
    if (lifeLost > 0) g.lives = Math.max(0, g.lives - lifeLost);

    // Drop dead/off-screen entities.
    g.bullets = g.bullets.filter((b) => !b.dead && b.y + b.h > 0);
    g.enemies = g.enemies.filter((e) => !e.dead && e.y < g.h);

    // Win/lose precedence: losing your last life ends the run as "lost" even if
    // a kill on the same step pushed you to the goal — survival is checked first.
    if (g.lives <= 0) {
      g.state = "lost";
    } else if (g.score >= g.goal) {
      g.state = "won";
    }
    return g;
  }

  const Logic = {
    clamp,
    hitsBox,
    inputVector,
    createGame,
    spawnEnemy,
    fire,
    resolveHits,
    integrate,
    step,
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Logic;
  } else {
    root.Logic = Logic;
  }
})(typeof window !== "undefined" ? window : globalThis);
