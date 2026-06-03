# Defold 1.9+ — Pinned Version Reference

- **Engine version**: Defold 1.9+
- **Language / runtime**: Lua (5.1 + LuaJIT, plain Lua not Luau)
- **LLM knowledge cutoff**: January 2026
- **Authoritative docs**: https://defold.com/manuals/ and https://defold.com/ref/stable/

## Stability contract

APIs that existed at or before the pinned version above are safe to emit. Anything newer must be verified against the authoritative docs before use. If an API is **not** documented in this folder and you are unsure, treat it as **unverified** — do not invent signatures, class names, or parameters.

## How to use this folder

- Read `modules/<domain>.md` for the domain you are coding before emitting code.
- Check `breaking-changes.md` for differences across recent minor versions.
- When the user is on a different engine version, say so and flag anything version-sensitive.
