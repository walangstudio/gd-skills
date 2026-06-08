# Web (Phaser / Three.js / Babylon.js) — Animation Reference

> Pinned to Phaser 3.80+, Three.js r160+, Babylon.js 7.0+. Verify anything newer against https://phaser.io/ and https://threejs.org/docs/.

## Core types & entry points
- Phaser frame animation: `this.anims.create({ key, frames, frameRate, repeat })`; animations live on the global anim manager, shared across sprites.
- Frame helpers: `this.anims.generateFrameNumbers(textureKey, { start, end })` (sprite sheet) / `generateFrameNames(key, { prefix, start, end, zeroPad })` (atlas).
- Play on a sprite: `sprite.play('walk')`, `sprite.play({ key: 'walk', repeat: -1 })`, `sprite.stop()`, `sprite.anims.pause()`.
- `repeat: -1` = loop forever; `repeat: 0` = play once; listen with `sprite.on('animationcomplete', cb)`.
- Tweens: `this.tweens.add({ targets, x, y, alpha, scale, duration, ease, yoyo, repeat, onComplete })` — interpolate any numeric property over time.
- Three.js: `AnimationMixer(rootObject)` plays `AnimationClip`s (usually from glTF `gltf.animations`); `mixer.clipAction(clip).play()` and call `mixer.update(delta)` each frame.

## Common tasks
Sprite sheet walk cycle (Phaser):
```javascript
create() {
  this.anims.create({
    key: 'walk',
    frames: this.anims.generateFrameNumbers('hero', { start: 0, end: 7 }),
    frameRate: 10,
    repeat: -1,
  });
  this.player = this.add.sprite(400, 300, 'hero');
  this.player.play('walk');
}
```

Tween for a UI pop / movement:
```javascript
this.tweens.add({
  targets: this.coin,
  y: this.coin.y - 40,
  alpha: 0,
  duration: 500,
  ease: 'Cubic.easeOut',
  onComplete: () => this.coin.destroy(),
});
```

Three.js glTF animation (mixer must be updated with delta each frame):
```javascript
const mixer = new THREE.AnimationMixer(gltf.scene);
mixer.clipAction(gltf.animations[0]).play();

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  mixer.update(clock.getDelta()); // seconds — never raw frame count
  renderer.render(scene, camera);
});
```

## Gotchas
- Phaser anims are keyed globally — `anims.create` with a duplicate key is ignored (no overwrite); use unique keys or check `this.anims.exists(key)`.
- `frameRate` (not raw frame count) drives speed; it's independent of display refresh, so animations stay consistent across frame rates. Tweens use real-time `duration` in ms for the same reason.
- Three.js `AnimationMixer` does nothing unless you call `mixer.update(delta)` every frame with **delta in seconds** (`clock.getDelta()`), not milliseconds or frame counts.
- `generateFrameNumbers` end frame is inclusive; off-by-one gives a stutter or a missing frame.
- Tweens keep running on destroyed targets unless you stop them — `this.tweens.killTweensOf(obj)` before destroying, or guard in `onUpdate`/`onComplete`.

## See also
- `web-patterns` skill, `web-style` rule, `web-specialist` agent
- guides/ for cross-engine architecture patterns
