# Web (Phaser / Three.js / Babylon.js) — Audio Reference

> Pinned to Phaser 3.80+, Three.js r160+, Babylon.js 7.0+. Verify anything newer against https://phaser.io/ and https://threejs.org/docs/.

## Core types & entry points
- Phaser: `this.sound.add(key)` + `.play()` (Web Audio under the hood)
- Three.js: `THREE.Audio` + `AudioListener` + `AudioLoader`
- Babylon.js: `BABYLON.Sound` (spatial + 2D)
- Browser autoplay policy: resume AudioContext on a user gesture

## See also
- `web-patterns` skill, `web-style` rule, `web-specialist` agent
- guides/ for cross-engine architecture patterns

> TODO: expand verified snippets and gotchas.
