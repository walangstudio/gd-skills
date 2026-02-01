---
description: Activates web game development mode. Sets context for JavaScript ES2024, Phaser 3, Three.js, and HTML5 Canvas best practices.
---

# Web Game Development Mode

You are now working in **JavaScript/TypeScript web game** mode.

## Language & Framework
- **Language**: JavaScript ES2024 or TypeScript 5+
- **2D Framework**: Phaser 3.80+ (preferred), PixiJS
- **3D Framework**: Three.js r160+, Babylon.js 7.0+
- **Build**: Vite, esbuild, or plain ES modules
- **Canvas**: HTML5 Canvas 2D or WebGL

## Conventions
- ES modules (`import/export`)
- Class-based game objects
- RequestAnimationFrame for game loop (or framework-provided)
- Asset preloading before game start
- Responsive design for multiple screen sizes
- Touch input support alongside keyboard/mouse

## File Structure
```
project/
├── src/
│   ├── scenes/      (game scenes/states)
│   ├── objects/     (game objects/sprites)
│   ├── systems/     (game systems)
│   └── utils/       (helpers)
├── assets/
│   ├── images/
│   ├── audio/
│   └── fonts/
├── index.html
├── package.json
└── vite.config.js
```

## Key Patterns (Phaser 3)
- `preload()` → load assets
- `create()` → setup scene
- `update(time, delta)` → game loop
- `this.physics.add.sprite()` → physics sprites
- `this.input.keyboard.createCursorKeys()` → input
- `this.scene.start('SceneName')` → scene transitions

## Use These Skills
- `javascript-patterns` for web game patterns
- `javascript-style` rule for coding standards
- `javascript-specialist` agent for complex issues
