# Web (Phaser / Three.js / Babylon.js) — Rendering Reference

> Pinned to Phaser 3.80+, Three.js r160+, Babylon.js 7.0+. Verify anything newer against https://phaser.io/ and https://threejs.org/docs/.

## Core types & entry points
- Phaser display objects: `this.add.image`, `this.add.sprite` (animatable), `this.add.tileSprite` (scrolling), `this.add.container` (group/transform children).
- Sprite sheets: `this.load.spritesheet(key, url, { frameWidth, frameHeight })`; texture atlases: `this.load.atlas(key, png, json)` (TexturePacker JSON hash/array).
- Depth/z-order: `obj.setDepth(n)` (higher = front); within equal depth, creation order wins.
- Tilemaps: `this.make.tilemap({ key })` + `map.addTilesetImage(...)` + `map.createLayer(layerName, tileset)`.
- Cameras: `this.cameras.main`; `camera.startFollow(target, roundPixels, lerpX, lerpY)`, `setBounds`, `setZoom`.
- Three.js: `Mesh = Geometry + Material`; lights (`AmbientLight`, `DirectionalLight`, `PointLight`) are required for non-`MeshBasicMaterial` surfaces.
- Three.js textures: `new THREE.TextureLoader().load(url)`; set `texture.colorSpace = THREE.SRGBColorSpace` for color maps (r152+; `outputEncoding`/`encoding` are removed).

## Common tasks
Sprite sheet + camera follow (Phaser):
```javascript
preload() {
  this.load.spritesheet('hero', 'assets/hero.png', { frameWidth: 32, frameHeight: 48 });
}

create() {
  this.player = this.add.sprite(400, 300, 'hero', 0);
  this.player.setDepth(10);
  this.cameras.main.setBounds(0, 0, 1600, 1200);
  this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
}
```

Tilemap from Tiled JSON:
```javascript
const map = this.make.tilemap({ key: 'level1' });
const tiles = map.addTilesetImage('tileset-name-in-tiled', 'tilesImage');
const ground = map.createLayer('Ground', tiles, 0, 0);
ground.setCollisionByProperty({ collides: true });
```

Three.js mesh, material, and light (note: color-space on textures):
```javascript
const tex = new THREE.TextureLoader().load('assets/crate.png');
tex.colorSpace = THREE.SRGBColorSpace;
const mesh = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ map: tex })
);
scene.add(mesh);
scene.add(new THREE.DirectionalLight(0xffffff, 1));
scene.add(new THREE.AmbientLight(0x404040));
```

## Gotchas
- `MeshStandardMaterial`/`MeshPhongMaterial` render black with no light in the scene — add a light or use `MeshBasicMaterial` for unlit.
- Three.js r152+ removed `renderer.outputEncoding` and texture `.encoding`; use `renderer.outputColorSpace` / `texture.colorSpace = THREE.SRGBColorSpace`. Wrong color space = washed-out or oversaturated output.
- Phaser tileset name in `addTilesetImage` must match the name **inside Tiled**, not your asset key — silent blank layer if mismatched.
- `setDepth` only orders within the same camera/scene; cross-scene layering is by scene order, not depth.
- Sprite sheet frame size must exactly tile the image; off-by-a-pixel frames bleed neighboring frames (use atlases or `extrude` margins for filtered textures).
- `startFollow` lerp values near 1.0 snap hard; small values (0.05–0.1) give smooth camera trailing.

## See also
- `web-patterns` skill, `web-style` rule, `web-specialist` agent
- guides/ for cross-engine architecture patterns
