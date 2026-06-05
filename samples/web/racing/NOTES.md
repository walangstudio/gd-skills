# Notes

A complete, dependency-free HTML5 game. **Open `index.html` in any browser to play** — no build step, no server, no external assets.

## Files
- `index.html` — canvas + HUD, loads `logic.js` then `game.js`
- `logic.js` — pure game logic (no DOM): driving physics, ordered checkpoints, lap counting, win state. Works in the browser and Node.
- `game.js` — rendering, input, fixed-timestep loop
- `test.js` — headless unit tests for `logic.js`

## Verification
- **Logic: unit-tested headless** — `node test.js` exercises clamp, point-in-circle, throttle cap, brake-into-reverse cap, friction (no sign flip + coasting), speed-scaled steering authority, parked-car-can't-steer, heading integration, **in-order checkpoint enforcement**, single lap-increment per full sequence, **high-speed checkpoint anti-tunneling**, win + freeze-after-win, and the lap timer. All pass (13 groups).
- **Syntax** — `node --check` clean on `logic.js`, `game.js`, `test.js`.
- **Rendering/input** — verified by inspection, not by an automated browser run in this environment. Open `index.html` to confirm the visual/input behavior.

## Mechanics worth understanding
- **Speed-scaled steering** — `steerAuthority(g, speed)` returns 0 at speed 0 and ramps to 1 at `steerSpeedRef`. A parked car cannot turn; turning rate is `turnRate * authority`. This is the single most important "feel" rule and is tested directly.
- **Friction without sign flip** — passive drag pulls speed magnitude toward 0 and clamps at exactly 0, so coasting never reverses the car. Throttle/brake clamp into `[-maxReverse, maxSpeed]`.
- **Ordered checkpoints** — `advanceCheckpoint` only ever tests `g.nextCp`, so reaching a later checkpoint while an earlier one is pending does nothing. A lap is one full in-order pass; the index wraps to 0 (start/finish) and `lapsDone` increments exactly once — not once per checkpoint.
- **Sub-stepped integration (anti-tunnel)** — position integrates in sub-steps no larger than `maxSubStep` px, checking the next checkpoint after each, so a very fast car can't skip past a checkpoint radius in one frame. Tested with a ~6000 px/frame car still triggering a 10 px checkpoint.
- **Frozen after win** — once `state !== "playing"`, `step` is a no-op; car, laps, timer, and checkpoint index all stop.
- **No randomness** — the track is deterministic, so `logic.js` needs no rng and replays identically. (Asteroids' injected-rng pattern is the move if you add random track generation.)

## Patterns worth copying
- **Logic split from rendering** — pure `logic.js` is testable without a DOM (the `step(state, input, dt)` shape). The most useful habit here.
- **Fixed-timestep accumulator** — `game.js` steps the sim at a fixed 1/60s with a clamp against the spiral-of-death, so movement is frame-rate independent (see `guides/game-loop-timestep.md`).
- **Data-driven entities** — checkpoints and tuning all live in `createGame(opts)`; pass your own `checkpoints` array to build any track.

## Iterate from here
- "Add walls/track borders the car collides with"
- "Track and display the best lap time"
- "Add a ghost or AI opponent car"
- "Slow the car when it drives off the track surface"
