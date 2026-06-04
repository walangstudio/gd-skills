// Pure game logic — no DOM, no canvas. Works in the browser (attaches to window)
// and in Node (module.exports), so the mechanics can be unit-tested headless.
// See test.js. The rendering/input lives in game.js.
//
// Deterministic: enemies spawn on a fixed schedule (no Math.random), towers
// target the enemy furthest along the path within range.

(function (root) {
  "use strict";

  function dist2(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  }

  function createGame(opts) {
    const o = opts || {};
    return {
      w: o.w || 480,
      h: o.h || 320,
      path: o.path || [
        { x: 0, y: 160 },
        { x: 240, y: 160 },
        { x: 240, y: 80 },
        { x: 480, y: 80 },
      ],
      towers: [],
      enemies: [],
      gold: o.gold != null ? o.gold : 100,
      lives: o.lives != null ? o.lives : 10,
      towerCost: o.towerCost != null ? o.towerCost : 50,
      killReward: o.killReward != null ? o.killReward : 10,
      waveIndex: 0,
      spawnedThisWave: 0,
      spawnTimer: 0,
      waves: o.waves || [
        { count: 5, hp: 30, speed: 60, interval: 0.8 },
        { count: 8, hp: 50, speed: 70, interval: 0.7 },
      ],
      state: "playing", // playing | won | lost
    };
  }

  function spawnEnemy(g, wave) {
    const start = g.path[0];
    g.enemies.push({
      x: start.x,
      y: start.y,
      wp: 1, // index of the next waypoint to walk toward
      hp: wave.hp,
      maxHp: wave.hp,
      speed: wave.speed,
      traveled: 0, // cumulative distance along the path (for targeting)
    });
  }

  // Place a tower; costs gold and rejects on insufficient funds or an occupied cell.
  function placeTower(g, x, y, opts) {
    const o = opts || {};
    if (g.gold < g.towerCost) return false;
    if (g.towers.some((t) => t.x === x && t.y === y)) return false;
    g.towers.push({
      x,
      y,
      range: o.range || 80,
      damage: o.damage || 10,
      cooldown: o.cooldown || 0.5,
      timer: 0,
    });
    g.gold -= g.towerCost;
    return true;
  }

  // Move one enemy up to `budget` distance along the path. Returns true if it
  // walked off the end of the path (leaked).
  function advanceEnemy(g, e, budget) {
    let remain = budget;
    while (remain > 0 && e.wp < g.path.length) {
      const t = g.path[e.wp];
      const dx = t.x - e.x;
      const dy = t.y - e.y;
      const d = Math.hypot(dx, dy);
      if (d === 0) {
        e.wp++;
        continue;
      }
      if (d <= remain) {
        e.x = t.x;
        e.y = t.y;
        e.traveled += d;
        remain -= d;
        e.wp++;
      } else {
        e.x += (dx / d) * remain;
        e.y += (dy / d) * remain;
        e.traveled += remain;
        remain = 0;
      }
    }
    return e.wp >= g.path.length;
  }

  function step(g, dt) {
    if (g.state !== "playing") return g;

    const wave = g.waves[g.waveIndex];

    // Spawn on schedule.
    if (wave && g.spawnedThisWave < wave.count) {
      g.spawnTimer -= dt;
      if (g.spawnTimer <= 0) {
        spawnEnemy(g, wave);
        g.spawnedThisWave++;
        g.spawnTimer = wave.interval;
      }
    }

    // Move enemies; leaked ones cost a life and are removed.
    const survivors = [];
    for (const e of g.enemies) {
      const leaked = advanceEnemy(g, e, e.speed * dt);
      if (leaked) g.lives--;
      else survivors.push(e);
    }
    g.enemies = survivors;

    // Towers fire at the furthest-progressed enemy in range.
    for (const tw of g.towers) {
      tw.timer -= dt;
      if (tw.timer > 0) continue;
      let target = null;
      for (const e of g.enemies) {
        if (dist2(e.x, e.y, tw.x, tw.y) <= tw.range * tw.range) {
          if (!target || e.traveled > target.traveled) target = e;
        }
      }
      if (target) {
        target.hp -= tw.damage;
        tw.timer = tw.cooldown;
        if (target.hp <= 0) g.gold += g.killReward;
      }
    }
    g.enemies = g.enemies.filter((e) => e.hp > 0);

    // Wave cleared once fully spawned and no enemies remain.
    if (wave && g.spawnedThisWave >= wave.count && g.enemies.length === 0) {
      g.waveIndex++;
      g.spawnedThisWave = 0;
      g.spawnTimer = 0;
      if (g.waveIndex >= g.waves.length) g.state = "won";
    }

    // A loss takes priority over a same-step win.
    if (g.lives <= 0) {
      g.lives = 0;
      g.state = "lost";
    }
    return g;
  }

  const Logic = { dist2, createGame, spawnEnemy, placeTower, advanceEnemy, step };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Logic;
  } else {
    root.Logic = Logic;
  }
})(typeof window !== "undefined" ? window : globalThis);
