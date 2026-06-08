# Roblox 2025+ — Breaking Changes & Version Notes

Pinned baseline: Roblox 2025+. Notable changes around this baseline that affect generated code.

| Version | Change | Migration |
|---------|--------|-----------|
| 2024+ | Luau strict mode (`--!strict`) recommended; types checked at analysis time. | Add `--!strict` and annotate types. |
| 2024+ | `task.wait`/`task.spawn`/`task.defer` replace `wait()`/`spawn()`/`delay()`. | Replace deprecated `wait()` with `task.wait()`. |
| 2023+ | Modern streaming + `Lighting` Technology Future; Humanoid APIs stable. | Use current Humanoid/Player APIs. |
| 2025+ | Continued additive Engine API growth. | Verify members newer than the baseline against create.roblox.com/docs. |

> Verify against the authoritative docs for versions beyond the pinned baseline.
