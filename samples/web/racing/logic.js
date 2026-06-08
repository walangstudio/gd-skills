// Pure game logic — no DOM, no canvas. Works in the browser (attaches to window)
// and in Node (module.exports), so the mechanics can be unit-tested headless.
// See test.js. The rendering/input lives in game.js.
//
// No Math.random in here: the track and checkpoints are deterministic, so the
// simulation needs no rng at all and replays identically every time.

(function (root) {
  "use strict";

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  // Point-in-circle test using squared distance (no sqrt).
  function inCircle(x, y, c) {
    const dx = x - c.x;
    const dy = y - c.y;
    return dx * dx + dy * dy <= c.r * c.r;
  }

  function createGame(opts) {
    const o = opts || {};
    const w = o.w || 640;
    const h = o.h || 480;
    // Ordered checkpoints. The first (index 0) is the start/finish line; a lap
    // completes when the car has passed every checkpoint in order and the index
    // wraps back to 0.
    const checkpoints =
      o.checkpoints ||
      [
        { x: w * 0.5, y: h * 0.85, r: 40 }, // start/finish
        { x: w * 0.85, y: h * 0.5, r: 40 },
        { x: w * 0.5, y: h * 0.15, r: 40 },
        { x: w * 0.15, y: h * 0.5, r: 40 },
      ];
    return {
      w,
      h,
      // Tuning (all in px / px-per-sec / rad-per-sec unless noted).
      maxSpeed: o.maxSpeed || 260,
      maxReverse: o.maxReverse || 90, // cap on reverse speed (stored negative)
      accel: o.accel || 220, // throttle acceleration
      brake: o.brake || 320, // brake/reverse deceleration
      friction: o.friction || 140, // passive decay toward 0 with no input
      turnRate: o.turnRate || 2.6, // rad/sec at full steering authority
      // Steering authority ramps in with speed: at/under steerSpeedRef the car
      // turns proportionally less, and at speed 0 it cannot turn at all.
      steerSpeedRef: o.steerSpeedRef || 120,
      maxSubStep: o.maxSubStep || 8, // px per integration sub-step (anti-tunnel)
      totalLaps: o.totalLaps || 3,
      checkpoints,
      car: {
        x: checkpoints[0].x,
        y: checkpoints[0].y,
        angle: o.startAngle == null ? -Math.PI / 2 : o.startAngle, // facing up
        speed: 0, // signed: + forward along heading, - reverse
        r: o.carR || 10,
      },
      nextCp: 0, // index of the checkpoint that must be reached next
      cpInside: false, // was the car inside the next gate last check (rising-edge guard)
      lapsDone: 0,
      time: 0, // accumulated lap time in seconds (frozen on win)
      state: "playing", // playing | won
    };
  }

  // New signed speed after one dt of the given throttle/brake input, with passive
  // friction when neither is held. Throttle accelerates up to maxSpeed; brake
  // decelerates and can drive into reverse down to -maxReverse. Friction decays
  // magnitude toward 0 and never overshoots past 0 (no sign flip from drag alone).
  function applyDrive(g, speed, input, dt) {
    const inp = input || {};
    if (inp.throttle) {
      speed = clamp(speed + g.accel * dt, -g.maxReverse, g.maxSpeed);
    } else if (inp.brake) {
      speed = clamp(speed - g.brake * dt, -g.maxReverse, g.maxSpeed);
    } else {
      // Passive friction: pull magnitude toward zero, clamped so drag alone can
      // never push speed through zero into the opposite direction.
      const drop = g.friction * dt;
      if (speed > 0) speed = Math.max(0, speed - drop);
      else if (speed < 0) speed = Math.min(0, speed + drop);
    }
    return speed;
  }

  // Steering authority as a function of current speed magnitude in [0,1]. Zero
  // when stationary (a parked car can't turn), saturating to 1 at steerSpeedRef.
  function steerAuthority(g, speed) {
    const mag = Math.abs(speed);
    if (mag <= 0) return 0;
    return clamp(mag / g.steerSpeedRef, 0, 1);
  }

  // Advance the simulation by dt seconds. input = {throttle, brake, left, right}.
  function step(g, input, dt) {
    if (g.state !== "playing") return g;
    const inp = input || {};
    const c = g.car;

    g.time += dt;

    // Update speed (throttle / brake / friction).
    c.speed = applyDrive(g, c.speed, inp, dt);

    // Steering — scaled by speed-dependent authority, so steering at speed 0 is
    // a no-op. Reverse steers the same hand as forward for the heading (the car
    // still rotates), which keeps the model simple.
    const auth = steerAuthority(g, c.speed);
    if (inp.left) c.angle -= g.turnRate * auth * dt;
    if (inp.right) c.angle += g.turnRate * auth * dt;

    // Integrate position along the heading in sub-steps so a fast car can't
    // tunnel past a checkpoint radius in a single frame. Check the next-in-order
    // checkpoint after every sub-step.
    const vx = Math.cos(c.angle) * c.speed;
    const vy = Math.sin(c.angle) * c.speed;
    const dist = Math.abs(c.speed) * dt;
    const steps = Math.max(1, Math.ceil(dist / g.maxSubStep));
    const sdt = dt / steps;
    for (let i = 0; i < steps; i++) {
      c.x = clamp(c.x + vx * sdt, 0, g.w);
      c.y = clamp(c.y + vy * sdt, 0, g.h);
      advanceCheckpoint(g);
      if (g.state !== "playing") break;
    }
    return g;
  }

  // Advance the index when the car ENTERS the next required checkpoint (a rising
  // edge: inside now, not inside last check). Passing a later checkpoint while an
  // earlier one is pending does nothing — order is enforced by only ever testing
  // g.nextCp. Wrapping past the last checkpoint back to index 0 completes a lap.
  //
  // The rising-edge guard matters when checkpoints OVERLAP: without it, sitting
  // inside the start/finish gate after a lap wrap would re-trigger it every
  // sub-step and rack up phantom laps in a single frame. After advancing we
  // re-evaluate containment against the NEW next gate, so an overlapping gate is
  // armed only once the car has left it.
  function advanceCheckpoint(g) {
    const c = g.car;
    const inside = inCircle(c.x, c.y, g.checkpoints[g.nextCp]);
    if (!inside || g.cpInside) {
      g.cpInside = inside;
      return;
    }
    g.nextCp++;
    if (g.nextCp >= g.checkpoints.length) {
      g.nextCp = 0;
      g.lapsDone++;
      if (g.lapsDone >= g.totalLaps) g.state = "won";
    }
    g.cpInside = inCircle(c.x, c.y, g.checkpoints[g.nextCp]);
  }

  const Logic = {
    clamp,
    inCircle,
    applyDrive,
    steerAuthority,
    advanceCheckpoint,
    createGame,
    step,
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Logic;
  } else {
    root.Logic = Logic;
  }
})(typeof window !== "undefined" ? window : globalThis);
