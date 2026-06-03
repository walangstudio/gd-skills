# Web (Phaser / Three.js / Babylon.js) — Rendering Reference

> Pinned to Phaser 3.80+, Three.js r160+, Babylon.js 7.0+. Verify anything newer against https://phaser.io/ and https://threejs.org/docs/.

## Core types & entry points
- Phaser: `Sprite`/`Image`/`TileSprite`, WebGL renderer
- Three.js: `Mesh` + geometry + material; `outputColorSpace` (r160, not `outputEncoding`)
- Babylon.js: `Mesh`, `StandardMaterial`/`PBRMaterial`, `MeshBuilder`
- r160 uses `SRGBColorSpace`

## See also
- `web-patterns` skill, `web-style` rule, `web-specialist` agent
- guides/ for cross-engine architecture patterns

> TODO: expand verified snippets and gotchas.
