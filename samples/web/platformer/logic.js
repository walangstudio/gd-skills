// Pure game logic — no DOM, no canvas. Works in the browser (attaches to window)
// and in Node (module.exports), so the mechanics can be unit-tested headless.
// See test.js. The rendering/input lives in game.js.

(function (root) {
  "use strict";

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  // Axis-aligned bounding-box overlap between two {x,y,w,h} boxes.
  function overlaps(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  function createGame(opts) {
    const o = opts || {};
    const w = o.w || 480;
    const h = o.h || 320;
    return {
      w,
      h,
      gravity: o.gravity || 1400, // px/sec^2
      moveSpeed: o.moveSpeed || 180, // px/sec
      jumpSpeed: o.jumpSpeed || 480, // px/sec (initial upward velocity)
      player: { x: 40, y: h - 24 - 20, w: 20, h: 24, vx: 0, vy: 0, onGround: false },
      platforms: o.platforms || [
        { x: 0, y: h - 20, w: w, h: 20 }, // floor
        { x: 120, y: h - 80, w: 90, h: 14 },
        { x: 270, y: h - 140, w: 90, h: 14 },
      ],
      goal: o.goal || { x: w - 50, y: h - 60, w: 24, h: 40 },
      state: "playing", // playing | won
    };
  }

  // Move the player by one sub-step (small dt) and resolve collisions, each axis
  // separately so we know which face hit. Landing on a platform top sets onGround.
  function integrate(g, dt) {
    const p = g.player;

    // Horizontal:
    p.x += p.vx * dt;
    p.x = clamp(p.x, 0, g.w - p.w);
    for (const plat of g.platforms) {
      if (!overlaps(p, plat)) continue;
      if (p.vx > 0) p.x = plat.x - p.w;
      else if (p.vx < 0) p.x = plat.x + plat.w;
      p.vx = 0;
    }

    // Vertical:
    p.y += p.vy * dt;
    for (const plat of g.platforms) {
      if (!overlaps(p, plat)) continue;
      if (p.vy > 0) {
        p.y = plat.y - p.h; // falling onto the platform — land on top
        p.vy = 0;
        p.onGround = true;
      } else if (p.vy < 0) {
        p.y = plat.y + plat.h; // rising into the underside — stop the climb
        p.vy = 0;
      }
    }

    // World bounds: never fall through the floor; clamp to the world box.
    if (p.x < 0) p.x = 0;
    if (p.x + p.w > g.w) p.x = g.w - p.w;
    if (p.y < 0) {
      p.y = 0;
      if (p.vy < 0) p.vy = 0;
    }
    if (p.y + p.h >= g.h) {
      p.y = g.h - p.h;
      p.vy = 0;
      p.onGround = true;
    }
  }

  // Advance the simulation by dt seconds. input = {left,right,jump}.
  // Pure and deterministic (no Math.random).
  function step(g, input, dt) {
    if (g.state !== "playing") return g;

    const p = g.player;

    // Horizontal velocity straight from input.
    p.vx = ((input.right ? 1 : 0) - (input.left ? 1 : 0)) * g.moveSpeed;

    // Jump only when grounded — gate BEFORE we clear onGround so a jump issued
    // on the same step it leaves the ground still counts, but no mid-air repeat.
    if (input.jump && p.onGround) {
      p.vy = -g.jumpSpeed;
      p.onGround = false;
    }

    // Gravity, then reset onGround so it must be re-earned by a landing in this
    // step's collision pass (prevents double-jump in mid-air).
    p.vy += g.gravity * dt;
    p.onGround = false;

    // Sub-step the position update so a fast faller cannot tunnel through a thin
    // platform: never advance more than the thinnest platform (or the player's
    // own height) per sub-step.
    let safe = p.h;
    for (const plat of g.platforms) safe = Math.min(safe, plat.h);
    safe = Math.max(1, safe);
    const disp = Math.max(Math.abs(p.vx), Math.abs(p.vy)) * dt;
    const sub = Math.max(1, Math.ceil(disp / safe));
    const sdt = dt / sub;
    for (let i = 0; i < sub; i++) integrate(g, sdt);

    if (overlaps(p, g.goal)) g.state = "won";
    return g;
  }

  const Logic = { clamp, overlaps, createGame, step };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Logic;
  } else {
    root.Logic = Logic;
  }
})(typeof window !== "undefined" ? window : globalThis);
