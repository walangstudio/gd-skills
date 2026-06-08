// Pure game logic — no DOM, no canvas. Works in the browser (attaches to window)
// and in Node (module.exports), so the mechanics can be unit-tested headless.
// See test.js. The rendering/input lives in game.js.

(function (root) {
  "use strict";

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  // AABB vs AABB overlap (used for ball-box and box-box).
  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // Treat the ball as its bounding box for AABB tests.
  function ballBox(ball) {
    return { x: ball.x - ball.r, y: ball.y - ball.r, w: ball.r * 2, h: ball.r * 2 };
  }

  // Build the brick grid for a fresh game.
  function makeBricks(w) {
    const cols = 7;
    const rows = 3;
    const pad = 6;
    const top = 30;
    const left = pad;
    const bw = (w - pad * 2 - pad * (cols - 1)) / cols;
    const bh = 16;
    const bricks = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bricks.push({
          x: left + c * (bw + pad),
          y: top + r * (bh + pad),
          w: bw,
          h: bh,
          alive: true,
        });
      }
    }
    return bricks;
  }

  function resetBall(g) {
    g.paddle.x = g.w / 2 - g.paddle.w / 2;
    g.ball.x = g.w / 2;
    g.ball.y = g.paddle.y - g.ball.r - 1;
    g.ball.vx = g.speed * 0.6;
    g.ball.vy = -g.speed;
  }

  function createGame(opts) {
    const o = opts || {};
    const w = o.w || 480;
    const h = o.h || 320;
    const speed = o.speed || 180; // px/sec
    const g = {
      w,
      h,
      speed,
      paddle: { x: w / 2 - 36, w: 72, y: h - 24, h: 10 },
      ball: { x: w / 2, y: h - 40, vx: speed * 0.6, vy: -speed, r: 6 },
      bricks: makeBricks(w),
      score: 0,
      lives: o.lives || 3,
      state: "playing", // playing | won | lost
    };
    return g;
  }

  // Clamp the paddle to the play area; x is the desired left edge.
  function setPaddle(g, x) {
    g.paddle.x = clamp(x, 0, g.w - g.paddle.w);
    return g;
  }

  // Advance one sub-step (a small dt): move the ball, then resolve collisions.
  function advance(g, dt) {
    const b = g.ball;
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // Walls.
    if (b.x - b.r < 0) {
      b.x = b.r;
      b.vx = Math.abs(b.vx);
    } else if (b.x + b.r > g.w) {
      b.x = g.w - b.r;
      b.vx = -Math.abs(b.vx);
    }

    // Ceiling.
    if (b.y - b.r < 0) {
      b.y = b.r;
      b.vy = Math.abs(b.vy);
    }

    // Paddle (reflect upward when descending and overlapping).
    if (b.vy > 0 && aabb(ballBox(b), g.paddle)) {
      b.y = g.paddle.y - b.r;
      b.vy = -Math.abs(b.vy);
    }

    // Bricks: reflect on the shallower penetration axis, kill one per sub-step.
    for (const brick of g.bricks) {
      if (!brick.alive) continue;
      if (!aabb(ballBox(b), brick)) continue;
      brick.alive = false;
      g.score++;
      const overlapX = Math.min(b.x + b.r - brick.x, brick.x + brick.w - (b.x - b.r));
      const overlapY = Math.min(b.y + b.r - brick.y, brick.y + brick.h - (b.y - b.r));
      if (overlapX < overlapY) {
        b.vx = -b.vx;
      } else {
        b.vy = -b.vy;
      }
      break;
    }

    // Win the moment the last brick is cleared — takes priority over a
    // same-step bottom-out so destroying the final brick never reads as a loss.
    if (g.bricks.every((br) => !br.alive)) {
      g.state = "won";
      return;
    }

    // Bottom: lose a life.
    if (b.y - b.r > g.h) {
      g.lives--;
      if (g.lives <= 0) {
        g.lives = 0;
        g.state = "lost";
        return;
      }
      resetBall(g);
    }
  }

  // Advance by dt seconds, sub-stepping so a fast ball cannot tunnel through a
  // brick: never move more than the ball radius per sub-step.
  function step(g, dt) {
    if (g.state !== "playing") return g;
    const b = g.ball;
    const dist = Math.hypot(b.vx, b.vy) * dt;
    const sub = Math.max(1, Math.ceil(dist / b.r));
    const sdt = dt / sub;
    for (let i = 0; i < sub && g.state === "playing"; i++) advance(g, sdt);
    return g;
  }

  const Logic = { clamp, aabb, ballBox, makeBricks, resetBall, createGame, setPaddle, step };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Logic;
  } else {
    root.Logic = Logic;
  }
})(typeof window !== "undefined" ? window : globalThis);
