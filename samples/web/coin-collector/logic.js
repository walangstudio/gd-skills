// Pure game logic — no DOM, no canvas. Works in the browser (attaches to window)
// and in Node (module.exports), so the mechanics can be unit-tested headless.
// See test.js. The rendering/input lives in game.js.

(function (root) {
  "use strict";

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  // AABB (player box) vs circle (coin): true if they overlap.
  function hitsCircle(box, c) {
    const cx = clamp(c.x, box.x, box.x + box.w);
    const cy = clamp(c.y, box.y, box.y + box.h);
    const dx = c.x - cx;
    const dy = c.y - cy;
    return dx * dx + dy * dy <= c.r * c.r;
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

  function createGame(opts) {
    const o = opts || {};
    const w = o.w || 480;
    const h = o.h || 320;
    return {
      w,
      h,
      goal: o.goal || 5,
      speed: o.speed || 180, // px/sec
      player: { x: w / 2 - 12, y: h / 2 - 12, w: 24, h: 24 },
      coins: [],
      score: 0,
      state: "playing", // playing | won
    };
  }

  // Advance the simulation by dt seconds. input = {left,right,up,down}.
  function step(g, input, dt) {
    if (g.state !== "playing") return g;

    const { vx, vy } = inputVector(input);
    g.player.x = clamp(g.player.x + vx * g.speed * dt, 0, g.w - g.player.w);
    g.player.y = clamp(g.player.y + vy * g.speed * dt, 0, g.h - g.player.h);

    for (const c of g.coins) {
      if (!c.taken && hitsCircle(g.player, c)) {
        c.taken = true;
        g.score++;
      }
    }

    if (g.score >= g.goal) g.state = "won";
    return g;
  }

  const Logic = { clamp, hitsCircle, inputVector, createGame, step };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Logic;
  } else {
    root.Logic = Logic;
  }
})(typeof window !== "undefined" ? window : globalThis);
