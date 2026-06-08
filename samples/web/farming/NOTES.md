# Notes

A complete, dependency-free HTML5 game. **Open `index.html` in any browser to play** — no build step, no server, no external assets.

## Files
- `index.html` — canvas + HUD, loads `logic.js` then `game.js`
- `logic.js` — pure game logic (no DOM): plot state machine, growth, economy, win state. Works in the browser and Node.
- `game.js` — rendering, input, the turn loop (cursor + keyboard actions)
- `test.js` — headless unit tests for `logic.js`

## Mechanics
Each plot runs a state machine: `untilled -> tilled -> planted -> growing… -> ripe -> (harvest) -> tilled`.

- **till** untilled soil -> tilled
- **plant** a seed on tilled soil (consumes one seed; stage 0)
- **water** a planted/growing crop (sets the day's watered flag; idempotent)
- **harvest** a ripe crop (sells produce for gold; plot returns to tilled)
- **endDay** advances the clock: **watered** crops grow exactly one stage and reset their
  watered flag; **unwatered** crops wilt one stage (floored at 0). Reaching the crop's
  final stage flips the plot to `ripe`.
- **economy** — harvest adds `price` gold; `buySeed` spends `seedCost`. Hit the gold goal to win.

Crops are data-driven (`CROPS`): carrot (2 stages), corn (3), pumpkin (4), each with its own price/seedCost.

## Verification
- **Logic: unit-tested headless** — `node test.js` exercises all the real bug classes:
  state-machine guards (plant only on tilled, water only on planted/growing, harvest only on ripe),
  the **watering gate** (watered advances one stage, unwatered does not), **idempotent watering**
  (double-water = one stage), **harvest-once** (re-harvesting the tilled plot yields nothing),
  seed/gold accounting, out-of-bounds safety, freeze-after-win, and the wilt floor. All pass (14 groups).
- **Syntax** — `node --check` clean on all three JS files.
- **Rendering/input** — verified by inspection, not by an automated browser run in this environment. Open `index.html` to confirm the visual/input behavior.

## Patterns worth copying
- **Logic split from rendering** — the whole plot state machine lives in pure `logic.js` and is testable without a DOM. This is the single most useful habit here.
- **State-machine guards return false** — every action validates its prior state and is a no-op on a bad transition, so invalid input never corrupts the board. Each guard has a test.
- **Watering gate as a per-day flag** — growth is driven by `endDay` reading a `watered` flag that
  it then resets, so growth is deterministic and idempotent watering can't double-advance.
- **Data-driven crops** — tuning (stages/price/seedCost) lives in `CROPS`; adding a crop is one table entry.
- **Explicit-zero defaults** — `gold: o.gold == null ? 20 : o.gold` instead of `||` so an
  intentional `0` survives (the kind of falsy-default bug worth avoiding).

## Iterate from here
- "Add seasons that restrict which crops can be planted"
- "Add a market with prices that drift each day"
- "Add weeds that spread to neighboring untilled plots and must be cleared"
