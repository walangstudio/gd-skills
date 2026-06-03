# Web (Phaser / Three.js / Babylon.js) — Physics Reference

> Pinned to Phaser 3.80+, Three.js r160+, Babylon.js 7.0+. Verify anything newer against https://phaser.io/ and https://threejs.org/docs/.

## Core types & entry points
- Phaser: Arcade Physics (`this.physics`) or Matter.js (`this.matter`)
- Three.js: no built-in physics — use cannon-es / Rapier / Ammo.js
- Babylon.js: `HavokPlugin` / Cannon / Ammo via `scene.enablePhysics`
- Collision callbacks vary per engine

## See also
- `web-patterns` skill, `web-style` rule, `web-specialist` agent
- guides/ for cross-engine architecture patterns

> TODO: expand verified snippets and gotchas.
