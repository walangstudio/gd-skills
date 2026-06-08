# Game Loop & Timestep

> The update cycle that drives a game, and the choice between a fixed timestep (deterministic, physics-safe) and a variable timestep (smooth, frame-rate-adaptive).

## What it is
Every frame the engine updates state then renders. **Variable timestep** passes the real elapsed time (`delta`/`dt`) and scales everything by it — smooth, but non-deterministic and unstable for physics at low frame rates. **Fixed timestep** advances simulation in constant-size steps regardless of render rate — deterministic and stable, required for reliable physics and networking. The standard reconciliation is the **accumulator**: add real frame time to an accumulator, run as many fixed steps as fit, then render with leftover time as an interpolation alpha. Most engines split this for you: physics on a fixed clock, rendering/visuals on a variable clock.

## When to use it
- **Variable**: visuals, cameras, UI tweens, non-physics movement, anything that should look smooth at any frame rate.
- **Fixed**: physics, deterministic simulation, lockstep multiplayer, anything where the same inputs must yield the same result.
- **Accumulator**: when you control the loop yourself (custom Web loop) and need both stable simulation and smooth rendering.

## When NOT to use it
- Don't hand-roll an accumulator when the engine already gives you a fixed-step callback (Godot/Unity/Roblox do). Use it.
- Don't run heavy gameplay in the fixed-step callback if it doesn't need determinism — it runs N times per frame and can stall.
- Don't multiply by `dt` inside a fixed-step callback using real frame time; fixed steps already have a constant `dt`.

## Per-engine mapping
| Engine | Variable (render) | Fixed (physics/sim) |
|--------|-------------------|---------------------|
| Godot | `_process(delta)` | `_physics_process(delta)` — fixed tick (default 60 Hz). |
| Unity | `Update()` (per frame) | `FixedUpdate()` — fixed `Time.fixedDeltaTime`. |
| Unreal | `Tick(DeltaTime)` (per frame) | Sub-stepping physics + `AsyncPhysicsTickComponent`; configurable fixed sub-steps. |
| Roblox | `RunService.RenderStepped` / `Heartbeat(dt)` | No first-party fixed loop; emulate with an accumulator on `Heartbeat`. |
| Defold | `update(self, dt)` (per frame, variable) | `fixed_update(self, dt)` (1.4.6+, fixed step for physics-synced logic). |
| Web | `requestAnimationFrame(t)` (vsync, variable) | Accumulator loop you write yourself for fixed simulation. |

## Minimal example
Web — explicit accumulator (the case where you must build it):
```js
const STEP = 1 / 60;       // fixed sim step (seconds)
let acc = 0, prev = performance.now();

function frame(now) {
  acc += Math.min((now - prev) / 1000, 0.25); // clamp spiral-of-death
  prev = now;
  while (acc >= STEP) { simulate(STEP); acc -= STEP; }
  render(acc / STEP);      // alpha for interpolation
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

## Pitfalls
- **Forgetting `dt`**: frame-rate-dependent movement (`x += speed` instead of `x += speed * dt`) makes the game faster on faster machines. Classic bug.
- **Spiral of death**: a slow frame produces a huge `dt`, which runs many fixed steps, which slows the next frame further. Clamp accumulated time.
- Reading input in `FixedUpdate`/`_physics_process` can miss single-frame presses — sample input in the variable update and consume it in the fixed one.
- Doing rendering work in the fixed callback, or physics in the variable one — keep them on the correct clock.
- Defold's `fixed_update` only fires when fixed-step physics is enabled in config; otherwise physics rides the variable `update`.

## Related
- `godot-patterns`, `unity-patterns`, `defold-patterns`, `javascript-patterns`
- `player-controllers`, `combat-systems`, `camera-systems`
- `guides/object-pooling.md`, `guides/state-machines.md`
