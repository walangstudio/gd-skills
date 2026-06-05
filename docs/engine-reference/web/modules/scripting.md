# Web (Phaser / Three.js / Babylon.js) — Scripting Reference

> Pinned to Phaser 3.80+, Three.js r160+, Babylon.js 7.0+. Verify anything newer against https://phaser.io/ and https://threejs.org/docs/.

## Core types & entry points
- ES6 modules: `import Phaser from 'phaser'` / `import * as THREE from 'three'`; bundle with Vite/webpack or use ESM CDN (`import ... from 'https://...'`).
- Phaser pattern: one class per scene extending `Phaser.Scene`, `super(keyOrConfig)` in the constructor.
- Inside a scene, factories live on `this`: `this.add` (display), `this.physics` (Arcade), `this.input`, `this.tweens`, `this.sound`, `this.cameras`, `this.scene` (scene manager).
- Event emitter: every Scene/GameObject has `.on(event, fn, context)`, `.once`, `.off`, `.emit`; `this.events` is the scene's emitter.
- Scene transitions: `this.scene.start('Other')`, `this.scene.launch` (parallel), `this.scene.pause/resume`.
- Three.js has no scene class — you structure your own loop and module functions.

## Common tasks
Phaser scene as an ES6 class with state and events:
```javascript
export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  preload() {
    this.load.spritesheet('hero', 'assets/hero.png', { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    this.score = 0;
    this.player = this.add.sprite(100, 100, 'hero');
    this.input.on('pointerdown', () => this.events.emit('shoot'));
    this.events.on('shoot', () => { this.score += 1; });
  }

  update(time, delta) {
    this.player.x += 0.1 * delta;
  }
}
```

Emit and listen across objects (scope matters — pass `this`):
```javascript
this.player.on('died', this.onPlayerDeath, this); // 3rd arg binds `this` in the handler
```

Three.js render loop structured as a module:
```javascript
import * as THREE from 'three';

const clock = new THREE.Clock();
function animate() {
  const delta = clock.getDelta();
  update(delta);
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
```

## Gotchas
- ES6 modules are scoped — top-level `const`/`let` are not globals. Export/import explicitly; don't rely on script-tag globals unless using the UMD build.
- Phaser event handlers lose `this` unless you pass the context arg (`on(event, fn, this)`) or use an arrow function.
- Don't call `this.add` / `this.physics` before `create()` — those systems aren't wired in the constructor.
- A scene key collision (two scenes with the same key) silently breaks `scene.start`; keep keys unique.
- Removing a listener requires the same function reference; anonymous inline functions can't be `.off()`'d.

## See also
- `web-patterns` skill, `web-style` rule, `web-specialist` agent
- guides/ for cross-engine architecture patterns
