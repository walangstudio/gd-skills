# Web (Phaser / Three.js / Babylon.js) — Core Reference

> Pinned to Phaser 3.80+, Three.js r160+, Babylon.js 7.0+. Verify anything newer against https://phaser.io/ and https://threejs.org/docs/.

## Core types & entry points
- Phaser: `new Phaser.Game(config)` boots the game; `config.scene` is a Scene class or array of them.
- Scene lifecycle: `preload()` (queue asset loads) → `create()` (build the world) → `update(time, delta)` (per-frame).
- `config.type`: `Phaser.AUTO` (WebGL, falls back to Canvas), `Phaser.WEBGL`, or `Phaser.CANVAS`.
- `config.physics.default`: `'arcade'` or `'matter'` to enable a physics system.
- `config.scale`: `mode` (`Phaser.Scale.FIT`, `RESIZE`) + `autoCenter` for responsive canvas.
- Three.js: `Scene` (graph root) + `PerspectiveCamera` + `WebGLRenderer`; you drive the loop yourself.
- `renderer.setAnimationLoop(fn)` (preferred, WebXR-safe) or `requestAnimationFrame` for the render loop.
- `delta` in Phaser `update` is milliseconds; Three.js uses `THREE.Clock.getDelta()` (seconds).

## Common tasks
Boot a Phaser game with one scene:
```javascript
class MainScene extends Phaser.Scene {
  constructor() { super('MainScene'); }
  preload() { this.load.image('logo', 'assets/logo.png'); }
  create() { this.add.image(400, 300, 'logo'); }
  update(time, delta) { /* delta is ms since last frame */ }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: MainScene,
  physics: { default: 'arcade', arcade: { gravity: { y: 300 } } },
});
```

Three.js minimal scene + loop (delta in seconds):
```javascript
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const delta = clock.getDelta();
  renderer.render(scene, camera);
});
```

Handle resize (Three.js — camera aspect + renderer must both update):
```javascript
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
```

## Gotchas
- Phaser `update(time, delta)` delta is **milliseconds**; Three.js `clock.getDelta()` is **seconds**. Scale movement by delta or it varies with frame rate.
- Phaser ticks at the display's refresh rate (not a fixed timestep); Arcade physics steps internally but `update` is variable. Don't assume 60 FPS.
- Three.js `setAnimationLoop` pauses when the tab is backgrounded; `requestAnimationFrame` throttles too — never rely on wall-clock frame counts.
- The canvas only exists after `new Phaser.Game()` / `renderer.domElement` is appended — don't query it before then.
- Scene `preload` is the only place asset loads are guaranteed complete before `create`; loading mid-game needs `load.start()` + a complete callback.

## See also
- `web-patterns` skill, `web-style` rule, `web-specialist` agent
- guides/ for cross-engine architecture patterns
