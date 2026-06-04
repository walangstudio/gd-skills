# RAG Setup (optional, power-user)

> Index the engine reference docs and guides into a vector store so agents can
> retrieve exact API details on demand instead of relying on the model's cutoff.
> Optional. The shipped `docs/engine-reference/` already covers the common path.

## When this is worth it

- You work across many engine APIs and want precise, retrievable lookups.
- You keep the reference docs fresh and want agents to query the latest.
- You already run a memory/RAG MCP (this repo assumes mememo).

If you just want anti-hallucination on the common path, the static
`docs/engine-reference/<engine>/` docs are enough — skip this.

## What to index

- `docs/engine-reference/<engine>/` — VERSION.md, breaking-changes.md, modules/*
- `guides/` — architecture/pattern guides
- Optionally, official engine docs you trust (Defold manuals + API ref, Godot docs, etc.)

## Setup (mememo)

1. Index the reference material, namespaced per engine + version so retrieval stays scoped:
   - `index_repository` over `docs/engine-reference/` and `guides/`, or
   - `store_memory` per module doc with a key like `engine:defold@1.9:physics`.
2. Align the namespace/version with each `docs/engine-reference/<engine>/VERSION.md` so a query can't return advice for a version you don't target.
3. Re-index on every engine version bump (the VERSION.md cutoff is the trigger).

## How agents query it

Before emitting API-heavy code, a specialist:
1. `recall_context` / `search_similar` for the engine + domain (e.g. "defold physics collision_response").
2. Prefer a retrieved, version-correct snippet over memory.
3. Fall back to the static `docs/engine-reference/` doc if nothing is indexed.

The specialist agents already say "consult the engine reference docs" — RAG just
makes that a live retrieval instead of a file read.

## Upkeep and cost (be honest)

- **Per-user.** mememo is your server; this isn't shipped to every user. Document it as opt-in.
- **Drift.** Stale index is worse than none — re-index on version bumps and prune old namespaces.
- **Storage.** Embeddings cost space; index the docs you actually query, not the whole internet.
- **Verify.** Spot-check that retrieval returns version-correct APIs before trusting it in a build.

## Relationship to other tools

- Complements the static `docs/engine-reference/` (the always-available baseline).
- Pairs with `/self-repair`: retrieve the right API, emit it, then verify it on screen.
