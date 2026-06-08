# Web (Phaser / Three.js / Babylon.js) — Breaking Changes & Version Notes

Pinned baseline: Phaser 3.80+, Three.js r160+, Babylon.js 7.0+. Notable changes around this baseline that affect generated code.

| Version | Change | Migration |
|---------|--------|-----------|
| Phaser 3.60 | WebGL renderer overhaul, new FX/post pipeline, Spine 4 plugin. | Use 3.60+ FX APIs; verify plugin versions. |
| Phaser 3.80 | Additive features/bugfixes on the 3.6x baseline. | Safe to target 3.60 APIs on 3.80. |
| Three.js r160 | `outputEncoding` removed; use `outputColorSpace`. `sRGBEncoding` -> `SRGBColorSpace`. | Replace encoding props with colorspace equivalents. |
| Babylon.js 7.0 | Major version; WebGPU matured, some import paths changed vs 6.x. | Verify import paths and WebGPU engine init against 7.x docs. |

> Verify against the authoritative docs for versions beyond the pinned baseline.
