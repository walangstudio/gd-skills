---
name: javascript-patterns
description: JavaScript/TypeScript web game development patterns for Phaser 3.80+, Three.js r160+, and Babylon.js 7.0+. Covers modern ES2024, game architecture, and browser-specific patterns.
---

# JavaScript Web Game Patterns

Production-ready patterns for web game development using modern JavaScript ES2024, TypeScript, and popular game frameworks.

## When to Use

- Building browser-based games
- Using Phaser 3.80+ for 2D games
- Using Three.js r160+ for 3D graphics
- Using Babylon.js 7.0+ for 3D game engines
- Need web-specific optimization patterns

## Project Structure

### Recommended Organization
```
src/
├── assets/                     # Static assets
│   ├── images/
│   ├── audio/
│   ├── fonts/
│   └── data/                   # JSON data files
├── scenes/                     # Game scenes (Phaser)
│   ├── BootScene.ts
│   ├── PreloadScene.ts
│   ├── MenuScene.ts
│   ├── GameScene.ts
│   └── UIScene.ts
├── entities/                   # Game objects
│   ├── Player.ts
│   ├── Enemy.ts
│   └── Projectile.ts
├── systems/                    # Game systems
│   ├── InputManager.ts
│   ├── AudioManager.ts
│   ├── SaveManager.ts
│   └── EventBus.ts
├── components/                 # Reusable components
│   ├── HealthComponent.ts
│   ├── MovementComponent.ts
│   └── CollisionComponent.ts
├── ui/                         # UI components
│   ├── HUD.ts
│   ├── Menu.ts
│   └── Dialog.ts
├── utils/                      # Utilities
│   ├── math.ts
│   ├── pool.ts
│   └── helpers.ts
├── types/                      # TypeScript types
│   └── index.ts
├── config/                     # Configuration
│   ├── game.config.ts
│   └── assets.config.ts
└── main.ts                     # Entry point
```

## TypeScript Configuration

### tsconfig.json for Games
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@scenes/*": ["scenes/*"],
      "@entities/*": ["entities/*"],
      "@systems/*": ["systems/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Phaser 3.80+ Patterns

### Scene Management
```typescript
// scenes/GameScene.ts
import Phaser from 'phaser';
import { Player } from '@entities/Player';
import { Enemy } from '@entities/Enemy';
import { EventBus } from '@systems/EventBus';

interface GameSceneData {
  level: number;
  score: number;
}

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.GameObjects.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private score = 0;
  private level = 1;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameSceneData): void {
    this.level = data.level ?? 1;
    this.score = data.score ?? 0;
  }

  create(): void {
    // Create tilemap
    const map = this.make.tilemap({ key: 'level1' });
    const tileset = map.addTilesetImage('tiles', 'tileset');
    const groundLayer = map.createLayer('Ground', tileset!, 0, 0);
    groundLayer?.setCollisionByProperty({ collides: true });

    // Create player
    this.player = new Player(this, 100, 100);

    // Create enemy group with physics
    this.enemies = this.physics.add.group({
      classType: Enemy,
      maxSize: 20,
      runChildUpdate: true,
    });

    // Spawn initial enemies
    this.spawnEnemies(5);

    // Setup collisions
    if (groundLayer) {
      this.physics.add.collider(this.player, groundLayer);
      this.physics.add.collider(this.enemies, groundLayer);
    }

    this.physics.add.overlap(
      this.player.bullets,
      this.enemies,
      this.onBulletHitEnemy,
      undefined,
      this
    );

    // Setup input
    this.cursors = this.input.keyboard!.createCursorKeys();

    // Setup camera
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.5);

    // Events
    EventBus.emit('scene-ready', this);
  }

  update(time: number, delta: number): void {
    this.player.update(this.cursors);

    // Check win condition
    if (this.enemies.countActive() === 0) {
      this.nextLevel();
    }
  }

  private spawnEnemies(count: number): void {
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(200, 600);
      const y = Phaser.Math.Between(100, 400);
      const enemy = this.enemies.get(x, y) as Enemy;
      enemy?.spawn(x, y);
    }
  }

  private onBulletHitEnemy(
    bullet: Phaser.GameObjects.GameObject,
    enemy: Phaser.GameObjects.GameObject
  ): void {
    (bullet as Phaser.Physics.Arcade.Sprite).destroy();
    (enemy as Enemy).takeDamage(25);
    this.score += 10;
    EventBus.emit('score-changed', this.score);
  }

  private nextLevel(): void {
    this.scene.restart({ level: this.level + 1, score: this.score });
  }
}
```

### Entity with Components
```typescript
// entities/Player.ts
import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public bullets!: Phaser.Physics.Arcade.Group;

  private health = 100;
  private maxHealth = 100;
  private speed = 200;
  private jumpForce = -400;
  private canDoubleJump = true;
  private isOnGround = false;

  // Game feel
  private coyoteTime = 100; // ms
  private coyoteTimer = 0;
  private jumpBufferTime = 100; // ms
  private jumpBuffer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setSize(24, 32);
    this.setOffset(4, 0);

    // Create bullet group
    this.bullets = scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 10,
      runChildUpdate: true,
    });

    // Setup animations
    this.createAnimations();
  }

  private createAnimations(): void {
    const anims = this.scene.anims;

    if (!anims.exists('player-idle')) {
      anims.create({
        key: 'player-idle',
        frames: anims.generateFrameNumbers('player', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1,
      });
    }

    if (!anims.exists('player-run')) {
      anims.create({
        key: 'player-run',
        frames: anims.generateFrameNumbers('player', { start: 4, end: 11 }),
        frameRate: 12,
        repeat: -1,
      });
    }

    if (!anims.exists('player-jump')) {
      anims.create({
        key: 'player-jump',
        frames: anims.generateFrameNumbers('player', { start: 12, end: 15 }),
        frameRate: 8,
        repeat: 0,
      });
    }
  }

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // Ground detection with coyote time
    const wasOnGround = this.isOnGround;
    this.isOnGround = body.blocked.down;

    if (this.isOnGround) {
      this.coyoteTimer = this.coyoteTime;
      this.canDoubleJump = true;
    } else if (wasOnGround) {
      // Just left ground, start coyote timer
    }

    // Update timers
    if (this.coyoteTimer > 0) {
      this.coyoteTimer -= this.scene.game.loop.delta;
    }
    if (this.jumpBuffer > 0) {
      this.jumpBuffer -= this.scene.game.loop.delta;
    }

    // Horizontal movement
    if (cursors.left.isDown) {
      this.setVelocityX(-this.speed);
      this.setFlipX(true);
    } else if (cursors.right.isDown) {
      this.setVelocityX(this.speed);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    // Jump input buffering
    if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
      this.jumpBuffer = this.jumpBufferTime;
    }

    // Jump execution
    if (this.jumpBuffer > 0) {
      if (this.coyoteTimer > 0) {
        // Normal jump (or coyote jump)
        this.setVelocityY(this.jumpForce);
        this.coyoteTimer = 0;
        this.jumpBuffer = 0;
      } else if (this.canDoubleJump) {
        // Double jump
        this.setVelocityY(this.jumpForce * 0.9);
        this.canDoubleJump = false;
        this.jumpBuffer = 0;
      }
    }

    // Variable jump height
    if (cursors.up.isUp && body.velocity.y < -100) {
      this.setVelocityY(body.velocity.y * 0.5);
    }

    // Animations
    if (!this.isOnGround) {
      this.anims.play('player-jump', true);
    } else if (Math.abs(body.velocity.x) > 10) {
      this.anims.play('player-run', true);
    } else {
      this.anims.play('player-idle', true);
    }
  }

  shoot(): void {
    const bullet = this.bullets.get(this.x, this.y);
    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.setTexture('bullet');
      const direction = this.flipX ? -1 : 1;
      bullet.body.velocity.x = direction * 400;

      // Auto-destroy after 2 seconds
      this.scene.time.delayedCall(2000, () => {
        bullet.destroy();
      });
    }
  }

  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);

    // Visual feedback
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
    });

    // Screen shake
    this.scene.cameras.main.shake(100, 0.01);

    if (this.health <= 0) {
      this.die();
    }
  }

  private die(): void {
    this.scene.scene.start('GameOverScene', { score: 0 });
  }
}
```

### Event Bus Pattern
```typescript
// systems/EventBus.ts
import Phaser from 'phaser';

// Singleton event emitter for cross-scene communication
export const EventBus = new Phaser.Events.EventEmitter();

// Type-safe event definitions
export interface GameEvents {
  'scene-ready': (scene: Phaser.Scene) => void;
  'score-changed': (score: number) => void;
  'health-changed': (current: number, max: number) => void;
  'player-died': () => void;
  'level-complete': (level: number) => void;
  'game-paused': (isPaused: boolean) => void;
}

// Usage:
// EventBus.emit('score-changed', 100);
// EventBus.on('score-changed', (score) => console.log(score));
```

## Three.js r160+ Patterns

### Game Engine Structure
```typescript
// Game.ts
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private clock: THREE.Clock;

  private entities: Set<Entity> = new Set();
  private isRunning = false;

  constructor(container: HTMLElement) {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    // Clock
    this.clock = new THREE.Clock();

    // Lighting
    this.setupLighting();

    // Handle resize
    window.addEventListener('resize', () => this.onResize(container));
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    this.scene.add(directionalLight);
  }

  addEntity(entity: Entity): void {
    this.entities.add(entity);
    this.scene.add(entity.object3D);
  }

  removeEntity(entity: Entity): void {
    this.entities.delete(entity);
    this.scene.remove(entity.object3D);
    entity.dispose();
  }

  start(): void {
    this.isRunning = true;
    this.clock.start();
    this.animate();
  }

  stop(): void {
    this.isRunning = false;
  }

  private animate(): void {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    // Update entities
    for (const entity of this.entities) {
      entity.update(delta);
    }

    // Update controls
    this.controls.update();

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  private onResize(container: HTMLElement): void {
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  dispose(): void {
    this.stop();
    for (const entity of this.entities) {
      entity.dispose();
    }
    this.renderer.dispose();
  }
}

// Entity base class
export abstract class Entity {
  public readonly object3D: THREE.Object3D;

  constructor() {
    this.object3D = new THREE.Group();
  }

  abstract update(delta: number): void;

  dispose(): void {
    // Override in subclasses for cleanup
  }
}
```

### Physics with Cannon.js
```typescript
// systems/PhysicsWorld.ts
import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export class PhysicsWorld {
  public world: CANNON.World;
  private bodies: Map<THREE.Object3D, CANNON.Body> = new Map();

  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0),
    });

    // Collision detection
    this.world.broadphase = new CANNON.NaiveBroadphase();

    // Materials
    const defaultMaterial = new CANNON.Material('default');
    const defaultContactMaterial = new CANNON.ContactMaterial(
      defaultMaterial,
      defaultMaterial,
      {
        friction: 0.3,
        restitution: 0.3,
      }
    );
    this.world.addContactMaterial(defaultContactMaterial);
    this.world.defaultContactMaterial = defaultContactMaterial;
  }

  addBody(mesh: THREE.Mesh, body: CANNON.Body): void {
    this.world.addBody(body);
    this.bodies.set(mesh, body);
  }

  removeBody(mesh: THREE.Mesh): void {
    const body = this.bodies.get(mesh);
    if (body) {
      this.world.removeBody(body);
      this.bodies.delete(mesh);
    }
  }

  update(delta: number): void {
    // Fixed timestep
    this.world.step(1 / 60, delta, 3);

    // Sync Three.js meshes with physics bodies
    for (const [mesh, body] of this.bodies) {
      mesh.position.copy(body.position as unknown as THREE.Vector3);
      mesh.quaternion.copy(body.quaternion as unknown as THREE.Quaternion);
    }
  }

  // Helper to create physics body from Three.js mesh
  static createBoxBody(
    mesh: THREE.Mesh,
    mass: number = 1
  ): CANNON.Body {
    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());

    const shape = new CANNON.Box(
      new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2)
    );

    const body = new CANNON.Body({
      mass,
      shape,
      position: new CANNON.Vec3(
        mesh.position.x,
        mesh.position.y,
        mesh.position.z
      ),
    });

    return body;
  }
}
```

## Common Patterns

### Object Pool
```typescript
// utils/ObjectPool.ts
export class ObjectPool<T> {
  private pool: T[] = [];
  private active: Set<T> = new Set();
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  private maxSize: number;

  constructor(
    createFn: () => T,
    resetFn: (obj: T) => void,
    initialSize: number = 10,
    maxSize: number = 100
  ) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFn());
    }
  }

  get(): T | null {
    let obj: T;

    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
    } else if (this.active.size < this.maxSize) {
      obj = this.createFn();
    } else {
      return null; // Pool exhausted
    }

    this.active.add(obj);
    return obj;
  }

  release(obj: T): void {
    if (this.active.has(obj)) {
      this.active.delete(obj);
      this.resetFn(obj);
      this.pool.push(obj);
    }
  }

  releaseAll(): void {
    for (const obj of this.active) {
      this.resetFn(obj);
      this.pool.push(obj);
    }
    this.active.clear();
  }

  get activeCount(): number {
    return this.active.size;
  }

  get availableCount(): number {
    return this.pool.length;
  }
}

// Usage with Phaser
const bulletPool = new ObjectPool<Phaser.Physics.Arcade.Sprite>(
  () => scene.physics.add.sprite(0, 0, 'bullet').setActive(false).setVisible(false),
  (bullet) => {
    bullet.setActive(false);
    bullet.setVisible(false);
    bullet.body.stop();
  },
  20
);
```

### State Machine
```typescript
// systems/StateMachine.ts
export interface State<T> {
  name: string;
  onEnter?: (owner: T, prevState?: string) => void;
  onUpdate?: (owner: T, delta: number) => void;
  onExit?: (owner: T, nextState?: string) => void;
}

export class StateMachine<T> {
  private states: Map<string, State<T>> = new Map();
  private currentState: State<T> | null = null;
  private owner: T;

  constructor(owner: T) {
    this.owner = owner;
  }

  addState(state: State<T>): this {
    this.states.set(state.name, state);
    return this;
  }

  setState(name: string): void {
    if (this.currentState?.name === name) return;

    const newState = this.states.get(name);
    if (!newState) {
      console.warn(`State "${name}" not found`);
      return;
    }

    const prevStateName = this.currentState?.name;

    // Exit current state
    this.currentState?.onExit?.(this.owner, name);

    // Enter new state
    this.currentState = newState;
    this.currentState.onEnter?.(this.owner, prevStateName);
  }

  update(delta: number): void {
    this.currentState?.onUpdate?.(this.owner, delta);
  }

  getCurrentState(): string | null {
    return this.currentState?.name ?? null;
  }
}

// Usage
const enemyStateMachine = new StateMachine(enemy)
  .addState({
    name: 'idle',
    onEnter: (e) => e.playAnimation('idle'),
    onUpdate: (e) => {
      if (e.canSeePlayer()) {
        enemyStateMachine.setState('chase');
      }
    },
  })
  .addState({
    name: 'chase',
    onEnter: (e) => e.playAnimation('run'),
    onUpdate: (e, dt) => {
      e.moveTowardPlayer(dt);
      if (e.isInAttackRange()) {
        enemyStateMachine.setState('attack');
      }
    },
  })
  .addState({
    name: 'attack',
    onEnter: (e) => e.attack(),
    onUpdate: (e) => {
      if (e.attackFinished()) {
        enemyStateMachine.setState('chase');
      }
    },
  });

enemyStateMachine.setState('idle');
```

### Save System
```typescript
// systems/SaveManager.ts
interface SaveData {
  version: number;
  timestamp: number;
  playerData: {
    level: number;
    score: number;
    highScore: number;
    inventory: string[];
  };
  settings: {
    musicVolume: number;
    sfxVolume: number;
    fullscreen: boolean;
  };
}

const SAVE_KEY = 'game_save';
const SAVE_VERSION = 1;

export class SaveManager {
  private static defaultData: SaveData = {
    version: SAVE_VERSION,
    timestamp: 0,
    playerData: {
      level: 1,
      score: 0,
      highScore: 0,
      inventory: [],
    },
    settings: {
      musicVolume: 0.7,
      sfxVolume: 1.0,
      fullscreen: false,
    },
  };

  static save(data: Partial<SaveData>): boolean {
    try {
      const saveData: SaveData = {
        ...this.load(),
        ...data,
        version: SAVE_VERSION,
        timestamp: Date.now(),
      };

      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      return true;
    } catch (error) {
      console.error('Failed to save:', error);
      return false;
    }
  }

  static load(): SaveData {
    try {
      const json = localStorage.getItem(SAVE_KEY);
      if (!json) return { ...this.defaultData };

      const data = JSON.parse(json) as SaveData;

      // Version migration
      if (data.version < SAVE_VERSION) {
        return this.migrate(data);
      }

      return data;
    } catch (error) {
      console.error('Failed to load:', error);
      return { ...this.defaultData };
    }
  }

  static delete(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  static exists(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  private static migrate(oldData: SaveData): SaveData {
    // Handle version migrations
    const migrated = { ...this.defaultData, ...oldData };
    migrated.version = SAVE_VERSION;
    this.save(migrated);
    return migrated;
  }
}
```

### Audio Manager
```typescript
// systems/AudioManager.ts
export class AudioManager {
  private static instance: AudioManager;

  private context: AudioContext;
  private masterGain: GainNode;
  private musicGain: GainNode;
  private sfxGain: GainNode;

  private sounds: Map<string, AudioBuffer> = new Map();
  private currentMusic: AudioBufferSourceNode | null = null;

  private constructor() {
    this.context = new AudioContext();

    // Create gain nodes
    this.masterGain = this.context.createGain();
    this.musicGain = this.context.createGain();
    this.sfxGain = this.context.createGain();

    // Connect nodes
    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  async loadSound(key: string, url: string): Promise<void> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
    this.sounds.set(key, audioBuffer);
  }

  playSFX(key: string, volume: number = 1): void {
    const buffer = this.sounds.get(key);
    if (!buffer) return;

    const source = this.context.createBufferSource();
    source.buffer = buffer;

    const gainNode = this.context.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(this.sfxGain);

    source.start(0);
  }

  playMusic(key: string, loop: boolean = true): void {
    this.stopMusic();

    const buffer = this.sounds.get(key);
    if (!buffer) return;

    this.currentMusic = this.context.createBufferSource();
    this.currentMusic.buffer = buffer;
    this.currentMusic.loop = loop;
    this.currentMusic.connect(this.musicGain);
    this.currentMusic.start(0);
  }

  stopMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic.disconnect();
      this.currentMusic = null;
    }
  }

  setMasterVolume(volume: number): void {
    this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  setMusicVolume(volume: number): void {
    this.musicGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  setSFXVolume(volume: number): void {
    this.sfxGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  // Resume audio context (required after user interaction)
  resume(): void {
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }
}
```

## Performance Patterns

### Request Animation Frame with Fixed Timestep
```typescript
class GameLoop {
  private lastTime = 0;
  private accumulator = 0;
  private readonly timestep = 1000 / 60; // 60 FPS physics
  private isRunning = false;
  private frameId: number | null = null;

  private updateFn: (dt: number) => void;
  private renderFn: (alpha: number) => void;

  constructor(
    updateFn: (dt: number) => void,
    renderFn: (alpha: number) => void
  ) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
  }

  start(): void {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop(): void {
    this.isRunning = false;
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    this.frameId = requestAnimationFrame((t) => this.loop(t));

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Prevent spiral of death
    this.accumulator += Math.min(deltaTime, 250);

    // Fixed timestep updates
    while (this.accumulator >= this.timestep) {
      this.updateFn(this.timestep / 1000);
      this.accumulator -= this.timestep;
    }

    // Interpolation factor for rendering
    const alpha = this.accumulator / this.timestep;
    this.renderFn(alpha);
  }
}
```

---

**Remember**: Use TypeScript for type safety, implement object pooling for frequently created objects, use fixed timestep for physics, handle browser audio context restrictions, optimize with requestAnimationFrame, and properly manage resources to prevent memory leaks.
