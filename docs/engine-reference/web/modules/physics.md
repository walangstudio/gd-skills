# Web (Phaser / Three.js / Babylon.js) — Physics Reference

> Pinned to Phaser 3.80+, Three.js r160+, Babylon.js 7.0+. Verify anything newer against https://phaser.io/ and https://threejs.org/docs/.

## Core types & entry points
- Phaser Arcade Physics: enable via `physics: { default: 'arcade' }` in the game config; AABB-only (axis-aligned rectangles/circles), fast, ideal for platformers and top-down.
- Create bodies with `this.physics.add.sprite(x, y, key)` / `.image()` / `.existing(obj)`; static via `this.physics.add.staticGroup()` or `.staticImage()`.
- Body methods: `setVelocity(x, y)`, `setVelocityX/Y`, `setAcceleration`, `setBounce`, `setCollideWorldBounds(true)`, `setGravityY` (per-body, adds to world gravity).
- Collision: `this.physics.add.collider(a, b, callback)` (separates bodies + optional callback); `this.physics.add.overlap(a, b, callback)` (detect only, no separation).
- Contact flags: `body.blocked.{down,up,left,right}` (against world/static), `body.touching.{...}` (against another body) — check after the physics step.
- Matter.js (`this.matter`): full rigid-body engine with rotation, constraints, polygons; enable via `default: 'matter'`. Heavier; use when you need real rotation/joints.
- Three.js has no physics — pair with `cannon-es` or `@dimforge/rapier3d`, syncing mesh `position`/`quaternion` from the body each frame.

## Common tasks
Platformer movement with gravity, jump, and ground check (Arcade):
```javascript
create() {
  this.player = this.physics.add.sprite(100, 450, 'hero');
  this.player.setCollideWorldBounds(true);
  this.platforms = this.physics.add.staticGroup();
  this.platforms.create(400, 568, 'ground');
  this.physics.add.collider(this.player, this.platforms);
  this.cursors = this.input.keyboard.createCursorKeys();
}

update() {
  const onGround = this.player.body.blocked.down;
  if (this.cursors.left.isDown)  this.player.setVelocityX(-160);
  else if (this.cursors.right.isDown) this.player.setVelocityX(160);
  else this.player.setVelocityX(0);

  if (this.cursors.up.isDown && onGround) this.player.setVelocityY(-450);
}
```

Overlap-based pickup (no physical separation):
```javascript
this.physics.add.overlap(this.player, this.coins, (player, coin) => {
  coin.destroy();
  this.score += 10;
});
```

## Gotchas
- Arcade bodies are AABB only — `setRotation` on the sprite does **not** rotate its collision box. Need rotated/polygon collision? Use Matter.
- `body.blocked.down` is only valid after the physics step has run, so read it in `update`, not `create`.
- Per-body `setGravityY` is **added** to the world gravity, not a replacement — double-gravity is a common surprise.
- World bounds collision needs `setCollideWorldBounds(true)`; bodies fly off-screen without it.
- Static groups don't update their body if you move the sprite later — call `refreshBody()` after repositioning a static object.
- The collider/overlap callback fires every frame they're in contact; guard one-shot logic (e.g. `coin.active`) yourself.

## See also
- `web-patterns` skill, `web-style` rule, `web-specialist` agent
- guides/ for cross-engine architecture patterns
