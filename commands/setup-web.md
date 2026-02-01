---
description: Set up a web game project with Phaser 3, Three.js, or vanilla Canvas. Includes Vite bundler, asset pipeline, mobile touch support, and deployment config.
---

# Setup Web Command

## What This Command Does

Creates a complete web game project structure:
- Framework setup (Phaser 3 / Three.js / Babylon.js / Vanilla Canvas)
- Vite bundler configuration for fast development
- Asset loading pipeline
- Game loop boilerplate
- Mobile touch controls template
- Deployment configuration (itch.io, static hosting)

## Folder Structure Created

### Phaser 3 Project
```
game/
├── src/
│   ├── main.js                  # Entry point, Phaser config
│   ├── scenes/
│   │   ├── BootScene.js         # Asset preloading
│   │   ├── MenuScene.js         # Main menu
│   │   ├── GameScene.js         # Main gameplay
│   │   └── GameOverScene.js     # Results screen
│   ├── entities/
│   │   ├── Player.js            # Player sprite + physics
│   │   └── Enemy.js             # Enemy behavior
│   ├── managers/
│   │   ├── AudioManager.js      # Sound handling
│   │   └── ScoreManager.js      # Score tracking
│   └── utils/
│       └── constants.js         # Game constants
├── public/
│   ├── assets/
│   │   ├── sprites/
│   │   ├── audio/
│   │   └── fonts/
│   └── index.html
├── package.json
├── vite.config.js
└── .gitignore
```

## Boilerplate Code

### Phaser 3 Entry Point
```javascript
// src/main.js
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 300 }, debug: false }
  },
  scene: [BootScene, MenuScene, GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);
```

### Vite Config
```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: { port: 3000 }
});
```

### package.json
```json
{
  "name": "my-web-game",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "phaser": "^3.80.0"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

## Usage

```
User: /setup-web

Agent: Setting up web game project...

[AskUserQuestion]:
1. Which framework?
   → Phaser 3 (Recommended for 2D)
   → Three.js (3D)
   → Babylon.js (3D, feature-rich)
   → Vanilla Canvas (lightweight)

2. Include mobile support?
   → Yes (touch controls, responsive) ✓
   → No (desktop only)

Done! Run `npm install && npm run dev` to start.
```

## Next Steps
- Run `npm install` to install dependencies
- Run `npm run dev` for development server
- Open `http://localhost:3000` in browser
- Use `/create-game` to add gameplay systems
- Deploy with `npm run build` then upload `dist/` to itch.io

---

**Set up your web game project!** Run `/setup-web` to get started.
