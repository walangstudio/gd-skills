# Web (Phaser / Three.js / Babylon.js) — Animation Reference

> Pinned to Phaser 3.80+, Three.js r160+, Babylon.js 7.0+. Verify anything newer against https://phaser.io/ and https://threejs.org/docs/.

## Core types & entry points
- Phaser: `anims.create` + frame animations; tweens (`this.tweens.add`)
- Three.js: `AnimationMixer` + `AnimationClip` (glTF animations)
- Babylon.js: `Animation` + `scene.beginAnimation`; skeletons
- `requestAnimationFrame` drives all loops

## See also
- `web-patterns` skill, `web-style` rule, `web-specialist` agent
- guides/ for cross-engine architecture patterns

> TODO: expand verified snippets and gotchas.
