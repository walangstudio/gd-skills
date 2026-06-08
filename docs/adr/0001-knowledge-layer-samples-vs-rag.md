# ADR 0001: Default knowledge layer — samples + pinned docs, RAG opt-in

- **Status**: accepted
- **Date**: 2026-06-06
- **Engine**: all

## Context

gd-skills generates multi-engine games. The generator needs current, accurate engine
knowledge so it stops emitting renamed/removed APIs (Unity `velocity`→`linearVelocity`,
Unreal Chaos-not-PhysX, etc.). Three ways to supply that knowledge:

1. Lean on Claude's parametric knowledge alone — fast, free, but stale past the cutoff and
   prone to plausible-but-wrong signatures.
2. Ship static, version-pinned reference material in the plugin (samples + module docs).
3. Bundle a queryable vector DB (Chroma/RAG) of official engine docs for retrieval at gen time.

The plugin is a markdown/agent package installed by copying files. It has no runtime, no
process, no Python env. That constraint decides most of this.

## Decision

**Default = static.** Ship runnable samples (`samples/web/`, logic split from render, headless
`node test.js`, CI-run) plus version-pinned engine-reference module docs
(`docs/engine-reference/<engine>/modules/`, each with a `VERSION.md` cutoff contract).
Specialists consult the pinned docs before emitting API-heavy code; samples are few-shot
exemplars and copy-paste starts.

**RAG = opt-in, documented not bundled.** `guides/rag-setup.md` describes indexing official
engine docs into a user-run mememo/vector store. It is a power-user path, gated behind the
user already running an MCP. Nothing in the default install depends on it.

## Alternatives Considered

- **Bundle a Chroma DB in the plugin**: rejected. A queryable DB is not a file you copy — it
  needs an embedding model to encode the query, a running process to serve it, and an MCP
  server to reach it from the agent. None of that survives `install.bat` copying markdown into
  `~/.claude`. You would be shipping infra, not a plugin.
- **RAG as the default knowledge source**: rejected as redundant. For well-documented engines
  (Godot/Unity/Unreal/Roblox) Claude already knows the API surface; retrieval mostly returns
  what the model would have produced anyway, at the cost of setup, upkeep, and a re-index on
  every engine version bump. RAG's real wins are narrow: post-cutoff APIs, niche/undocumented
  corners, and the user's *own* codebase — exactly the opt-in cases the guide targets.
- **Parametric knowledge only**: rejected. No version pin, no cutoff contract, no way to stop
  the model inventing signatures. The pinned `VERSION.md` ("undocumented API → treat as
  unverified, don't invent") is the cheap guardrail RAG would otherwise provide.

## Consequences

- Knowledge ships as ordinary files: universal, CI-testable (`scripts/test-samples.sh` runs
  every sample), zero infra, works offline, identical for every user.
- Upkeep is manual and visible: bump `VERSION.md` and the module doc when an engine releases a
  breaking change. This is a feature — the pin is the contract.
- The model can still drift on APIs newer than the cutoff. Mitigated by the `VERSION.md`
  unverified-API rule and the breaking-changes table, not eliminated.
- Power users who need post-cutoff or own-codebase retrieval follow `guides/rag-setup.md`. If
  RAG ever becomes default, this ADR is superseded and the install gains a hard MCP dependency.
