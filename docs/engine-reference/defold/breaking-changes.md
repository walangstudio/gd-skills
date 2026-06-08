# Defold 1.9+ — Breaking Changes & Version Notes

Pinned baseline: Defold 1.9+. Notable changes around this baseline that affect generated code.

| Version | Change | Migration |
|---------|--------|-----------|
| 1.4 | Editor/runtime improvements; core `go.*`/`msg.*`/`gui.*` API stable. | Safe to target pre-1.4 core APIs. |
| 1.6 | Tilemap/animation API additions; `go.animate` easing additions. | Use documented `go.EASING_*` constants. |
| 1.8 | HTML5/WebGPU + platform updates; gameplay scripting API unchanged. | No gameplay-script migration needed. |
| 1.9 | Additive engine/editor updates; Lua 5.1 + LuaJIT runtime unchanged (plain Lua, NOT Luau). | Do NOT use Luau-only syntax (`--!strict`, etc.). Stick to Lua 5.1. |

> Verify against the authoritative docs for versions beyond the pinned baseline.
