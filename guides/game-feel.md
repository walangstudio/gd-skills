# Game Feel (Juice)

> The difference between a game that works and one that feels good is layers of small,
> immediate feedback. Celeste isn't tight because of one trick — it's coyote time + jump buffer
> + variable jump + asymmetric gravity + particles + screen shake + acceleration curves stacked.
> Add feel in layers; tune by feel; expose every value.

This is the catalog. The `add-game-feel` command and `game-feel-specialist` agent apply it; the
genre templates reference it. **Every starting value below is a tunable** — expose it as an
exported property / config per `rules/configuration-and-tuning.md`, never a literal in logic.

## Catalog (what, why, where to start)

| Technique | What it does | Starting value |
|-----------|--------------|----------------|
| **Coyote time** | Let the player still jump for a beat after walking off a ledge | 0.08–0.12 s |
| **Jump buffer** | Honor a jump pressed just before landing | 0.10–0.15 s |
| **Variable jump** | Cut upward velocity when jump is released early → tap = hop, hold = full | × ~0.5 on release |
| **Asymmetric gravity** | Heavier gravity falling than rising → snappy arc, no float | fall ≈ 1.5–2× rise |
| **Acceleration / friction** | Ease into and out of movement instead of instant on/off | accel/friction `move_toward` |
| **Screen shake** | Sell impact with trauma that decays (use trauma², not linear) | trauma +0.3–0.6/hit, decay ~0.8/s |
| **Hit stop / freeze frame** | Brief pause on a hit to make it land | 0.03–0.08 s (crit up to 0.15 s) |
| **Knockback** | Push both parties apart on impact, decaying fast | impulse, decay over 0.1–0.2 s |
| **Damage flash** | Flash the hit sprite white for an unmissable "I hit it" | 0.10–0.20 s |
| **Screen flash** | Full-screen color pulse on big events (hit, heal, death) | 0.5 alpha → 0 over 0.15–0.3 s |
| **Squash & stretch** | Stretch on launch, squash on land, settle with overshoot | land ≈ (1.3, 0.7) → (1,1), ease-out-back, ~0.12 s |
| **Anticipation** | A short wind-up *before* an action (crouch before jump, pull back before swing) | 0.05–0.12 s |
| **Follow-through / overshoot** | Settle past the target then back (UI pop-in, attack recover) | ease-out-back / elastic |
| **Camera kick / punch** | Snap the camera a few px toward the impact, ease back | 4–12 px, recover 0.1–0.2 s |
| **Slow-mo / time dilation** | Drop time scale for a beat on a kill / clutch moment | scale 0.2–0.5 for 0.2–0.6 s |
| **Controller vibration** | Haptic on hit / land / pickup | weak 0.3–0.6, strong 0.6–0.9, 0.1–0.25 s |
| **Particles** | Dust on land/run, sparks/blood on hit, trails on dash | burst on event, auto-free |
| **Layered + pitch-varied SFX** | Stack 2–3 sounds per impact, ±semitone pitch jitter so it never repeats | pitch ± 0.05–0.1 |
| **Damage numbers** | Pop a number on hit, arc up and fade | rise + fade ~0.5 s |
| **Input buffering (general)** | Buffer any action pressed slightly early (attack, dash), not just jump | 0.1–0.15 s |

## Per-engine API map (the engine-specific ones)

Logic techniques (coyote, buffer, variable jump, asym gravity, squash, anticipation) are timers +
scale tweens and are engine-agnostic. These need an engine API:

| Technique | Godot | Unity | Unreal | Roblox | Web | Defold |
|-----------|-------|-------|--------|--------|-----|--------|
| Screen shake | Camera offset + trauma² | **Cinemachine Impulse** (`CinemachineImpulseSource`) | **Camera Shake** (`UCameraShakeBase` / `ClientStartCameraShake`) | tween `Camera.CFrame` offset on `RenderStepped` | offset camera each frame (Three.js); `camera.shake()` (Phaser) | offset camera-go pos in render |
| Hit stop / slow-mo | `Engine.time_scale` | `Time.timeScale` (+ `WaitForSecondsRealtime`) | `SetGlobalTimeDilation` | no global scale — pause the entity/anim | scale `dt` in the loop | scale `dt` (no global scale) |
| Damage flash | shader param `flash_amount` or `modulate` | material `_FlashAmount` via `MaterialPropertyBlock`, or `color` lerp | dynamic material instance scalar, or sprite color | **`Highlight`** (white `FillColor`) toggled | white-tint overlay / tint shader | `go.animate` sprite `tint` to white and back |
| Vibration | `Input.start_joy_vibration` | `Gamepad.SetMotorSpeeds` | `PlayDynamicForceFeedback` | `HapticService:SetMotor` | Gamepad `vibrationActuator.playEffect("dual-rumble")` | (no built-in; needs extension) |
| Tween / easing | `Tween` (`tween_property`, `set_trans`) | coroutine + `AnimationCurve` / DOTween | Timeline / `FInterpTo` / UMG anim | **`TweenService:Create`** (`TweenInfo`, `EasingStyle`) | manual lerp + easing fn (`easeOutBack`) | `go.animate(url, prop, playback, to, easing, dur)` |

## Recipes by complaint

- **Stiff platformer → responsive:** coyote time + jump buffer + variable jump + asymmetric gravity + acceleration + landing squash + dust.
- **Weak combat → impactful:** screen shake + hit stop + damage flash + knockback + particles + camera kick + layered SFX + vibration + damage numbers.
- **Boring UI → juicy:** hover scale-up, press scale-down then overshoot bounce, ease (never linear) transitions, pop-in with overshoot, sound on every interaction.

## Pitfalls

- **Too much shake** is nausea, not impact — small offsets, fast decay, trauma² falloff, cap it.
- **Hit stop on everything** kills its meaning — reserve it for crits / big hits.
- **`Time.timeScale = 0` also freezes your own effect timers** — drive freeze-frame/UI on *realtime* (Godot `create_timer(..., true, false, true)`, Unity `WaitForSecondsRealtime`).
- **Roblox has no global time scale** — emulate hit stop by pausing the specific entity/animation, not the world.
- **Don't hardcode any of these** — they're the most-tuned numbers in the game; put them in config (`rules/configuration-and-tuning.md`) so feel is iterable without code edits.

## Related

- `add-game-feel` command, `game-feel-specialist` agent
- `rules/configuration-and-tuning.md` (these values are config), `guides/data-driven.md`
- `guides/game-loop-timestep.md` (fixed timestep keeps feel consistent), `camera-systems` skill
