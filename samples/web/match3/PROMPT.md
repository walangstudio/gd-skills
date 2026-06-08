# Prompt

The prompt that produced this sample:

> /create-puzzle a match-3 like Bejeweled for the Web: an 8x8 grid of colored
> gems, click two adjacent gems to swap, swaps that make a line of 3+ clear and
> score, gravity drops gems down, new gems refill from the top, cascades chain.
> Reject swaps that don't make a match. Vanilla JS + canvas, no build, no assets.

## Why it's shaped this way

- **Injected RNG** — the board fill and refill take an `rng()` function, so the pure logic has zero `Math.random` and the tests are fully deterministic (the browser passes `Math.random`).
- **Swap → match-or-revert** — the single rule that makes match-3 feel right, and the cleanest thing to assert.
- **Resolve loop** — clear, gravity, refill, repeat until the board has no matches; that loop is the cascade.

Iterate from here: "add a move limit and a target score", "add special gems for
4- and 5-matches", "animate the gems falling".
