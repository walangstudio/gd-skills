# Web (Phaser / Three.js / Babylon.js) — UI Reference

> Pinned to Phaser 3.80+, Three.js r160+, Babylon.js 7.0+. Verify anything newer against https://phaser.io/ and https://threejs.org/docs/.

## Core types & entry points
- Phaser text: `this.add.text(x, y, str, style)` (TTF/web fonts, slower) and `this.add.bitmapText(x, y, fontKey, str)` (pre-baked bitmap font, fast for changing text).
- Interactivity: `obj.setInteractive()` then `obj.on('pointerdown' | 'pointerover' | 'pointerout' | 'pointerup', handler)`.
- Hit area: `setInteractive({ useHandCursor: true })`, or pass a shape (`new Phaser.Geom.Circle(...)`, `Phaser.Geom.Circle.Contains`).
- Containers: `this.add.container(x, y, [children])` groups objects to transform/move as a unit (good for compound buttons/panels).
- DOM elements: enable `dom: { createContainer: true }` in config, then `this.add.dom(x, y, htmlElement)` for real inputs/forms.
- HTML/CSS overlay: position a normal absolutely-positioned `<div>` over the canvas for menus/HUD — often simpler than in-canvas UI for both Phaser and Three.js.
- Three.js: no built-in UI; use an HTML/CSS overlay, or `CSS2DRenderer`/`CSS2DObject` to anchor DOM to 3D positions.

## Common tasks
Clickable text button with hover (Phaser):
```javascript
create() {
  const btn = this.add.text(400, 300, 'Play', {
    fontSize: '32px', color: '#ffffff', backgroundColor: '#1d6fb8', padding: { x: 16, y: 8 },
  }).setOrigin(0.5).setInteractive({ useHandCursor: true });

  btn.on('pointerover', () => btn.setStyle({ color: '#ffff00' }));
  btn.on('pointerout',  () => btn.setStyle({ color: '#ffffff' }));
  btn.on('pointerdown', () => this.scene.start('GameScene'));
}
```

Compound button via container:
```javascript
const bg = this.add.rectangle(0, 0, 160, 48, 0x222222);
const label = this.add.text(0, 0, 'Start', { fontSize: '20px' }).setOrigin(0.5);
const button = this.add.container(400, 300, [bg, label]);
button.setSize(160, 48).setInteractive({ useHandCursor: true });
button.on('pointerdown', () => console.log('clicked'));
```

HTML overlay HUD (engine-agnostic):
```javascript
const hud = document.createElement('div');
hud.style.cssText = 'position:absolute;top:8px;left:8px;color:#fff;font:16px sans-serif;pointer-events:none;';
hud.textContent = 'Score: 0';
document.body.appendChild(hud);
```

## Gotchas
- A display object isn't clickable until `setInteractive()`; containers also need `setSize()` (or an explicit hit area) for the hit test to have bounds.
- Pointer coordinates are in the active camera's space — with a scrolling/zoomed camera, fixed HUD elements should use `setScrollFactor(0)`.
- DOM elements (`this.add.dom`) require `dom.createContainer: true` in the game config, or `add.dom` is undefined.
- HTML overlays intercept clicks; set `pointer-events: none` on a HUD div so input reaches the canvas, or `auto` only on the buttons.
- `bitmapText` can't change font/style at runtime; use `add.text` if you need dynamic styling (at a perf cost for frequently-updated strings — cache or use bitmap fonts for counters).

## See also
- `web-patterns` skill, `web-style` rule, `web-specialist` agent
- guides/ for cross-engine architecture patterns
