---
name: javascript-style
description: JavaScript/TypeScript coding standards for web game development. Enforces modern ES2024 features, TypeScript strict mode, and browser game best practices.
globs: ["*.js", "*.ts", "*.jsx", "*.tsx"]
---

# JavaScript/TypeScript Game Development Style Guide

Mandatory coding standards for web game development using modern JavaScript ES2024 and TypeScript.

## TypeScript Configuration (MANDATORY)

```typescript
// ✅ REQUIRED - Enable strict mode in tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## Naming Conventions

### Variables and Functions
```typescript
// ✅ CORRECT - camelCase for variables and functions
const playerHealth = 100;
const maxSpeed = 16;
let isAlive = true;

function calculateDamage(base: number): number {
  return base * 1.5;
}

const handleInput = (event: KeyboardEvent): void => {
  // Handle input
};

// ❌ WRONG
const PlayerHealth = 100;    // PascalCase for variable
const player_health = 100;   // snake_case
function CalculateDamage() { }  // PascalCase for function
```

### Constants
```typescript
// ✅ CORRECT - UPPER_SNAKE_CASE for true constants
const MAX_HEALTH = 100;
const SPAWN_DELAY = 5000;
const DEFAULT_SPEED = 200;
const TILE_SIZE = 32;

// ✅ CORRECT - camelCase for const references (not true constants)
const playerSprite = this.add.sprite(0, 0, 'player');
const gameConfig = { width: 800, height: 600 };

// ❌ WRONG
const maxHealth = 100;  // True constant should be UPPER_SNAKE_CASE
const PLAYER_SPRITE = this.add.sprite();  // Not a true constant
```

### Classes and Types
```typescript
// ✅ CORRECT - PascalCase for classes, interfaces, types, enums
class PlayerController { }
class EnemySpawner { }

interface PlayerData {
  health: number;
  score: number;
}

type Callback = () => void;

enum GameState {
  Menu,
  Playing,
  Paused,
  GameOver,
}

// ❌ WRONG
class playerController { }  // Should be PascalCase
interface playerData { }    // Should be PascalCase
type callback = () => void; // Should be PascalCase
```

### Private Members
```typescript
// ✅ CORRECT - Use # for true private fields (ES2022+)
class Player {
  #health: number = 100;
  #maxHealth: number = 100;

  get health(): number {
    return this.#health;
  }

  #calculateDamage(base: number): number {
    return base * 1.5;
  }
}

// ✅ ALSO CORRECT - Use private keyword in TypeScript
class Enemy {
  private health: number = 100;
  private readonly maxHealth: number = 100;

  private calculateDamage(base: number): number {
    return base * 1.5;
  }
}

// ❌ WRONG - Underscore prefix convention (outdated)
class OldStyle {
  _health: number = 100;  // Use # or private instead
  _calculateDamage() { }  // Use # or private instead
}
```

## Modern JavaScript Features (USE THESE)

### Variable Declarations
```typescript
// ✅ CORRECT - Use const by default
const MAX_ENEMIES = 10;
const player = new Player();
const config = { speed: 100 };

// ✅ CORRECT - Use let only when reassignment is needed
let score = 0;
let currentLevel = 1;
let isPlaying = true;

// ❌ WRONG - Never use var
var health = 100;  // Use const or let
```

### Arrow Functions
```typescript
// ✅ CORRECT - Arrow functions for callbacks and short functions
const add = (a: number, b: number): number => a + b;

enemies.forEach((enemy) => enemy.update(delta));

button.addEventListener('click', () => this.handleClick());

// ✅ CORRECT - Regular functions for methods and constructors
class Player {
  update(delta: number): void {
    // Use regular method syntax
  }
}

// ❌ WRONG - Arrow function where regular is better
class Player {
  // Arrow functions don't have their own 'this' context
  update = (delta: number): void => { };  // Avoid in classes
}
```

### Destructuring
```typescript
// ✅ CORRECT - Object destructuring
const { x, y, width, height } = sprite.getBounds();
const { health, maxHealth } = playerData;

function createEnemy({ x, y, type }: EnemyConfig): Enemy {
  return new Enemy(x, y, type);
}

// ✅ CORRECT - Array destructuring
const [first, second, ...rest] = items;
const [x, y] = position;

// ✅ CORRECT - With defaults
const { speed = 100, jump = true } = config;
```

### Template Literals
```typescript
// ✅ CORRECT - Use template literals for string interpolation
const message = `Player ${name} scored ${score} points`;
const path = `assets/sprites/${spriteName}.png`;

// ❌ WRONG - String concatenation
const message = 'Player ' + name + ' scored ' + score + ' points';
```

### Optional Chaining and Nullish Coalescing
```typescript
// ✅ CORRECT - Optional chaining
const health = player?.character?.health;
const callback = options?.onComplete?.();

// ✅ CORRECT - Nullish coalescing
const name = playerName ?? 'Guest';
const speed = config.speed ?? DEFAULT_SPEED;

// ❌ WRONG - Truthy check when nullish is intended
const name = playerName || 'Guest';  // '' becomes 'Guest'
const speed = config.speed || 100;   // 0 becomes 100
```

## Type Annotations

### Function Signatures
```typescript
// ✅ CORRECT - Full type annotations
function takeDamage(amount: number, type?: DamageType): boolean {
  return this.health > 0;
}

const calculateScore = (base: number, multiplier: number): number => {
  return base * multiplier;
};

// ✅ CORRECT - Callback types
function onComplete(callback: (success: boolean) => void): void {
  callback(true);
}

// ✅ CORRECT - Generic functions
function createPool<T>(factory: () => T, size: number): T[] {
  return Array.from({ length: size }, factory);
}

// ❌ WRONG - Missing return type
function calculateDamage(amount: number) {  // Add return type
  return amount * 1.5;
}
```

### Interface vs Type
```typescript
// ✅ CORRECT - Interface for object shapes (extensible)
interface PlayerData {
  health: number;
  score: number;
}

interface ExtendedPlayerData extends PlayerData {
  inventory: string[];
}

// ✅ CORRECT - Type for unions, intersections, primitives
type DamageType = 'physical' | 'fire' | 'ice';
type Callback = () => void;
type Nullable<T> = T | null;
type PlayerWithInventory = PlayerData & { inventory: string[] };

// ✅ CORRECT - Type for complex mapped types
type Readonly<T> = { readonly [K in keyof T]: T[K] };
```

### Generics
```typescript
// ✅ CORRECT - Generic classes and functions
class ObjectPool<T> {
  private pool: T[] = [];

  get(): T | undefined {
    return this.pool.pop();
  }

  release(item: T): void {
    this.pool.push(item);
  }
}

// ✅ CORRECT - Constrained generics
function clamp<T extends number>(value: T, min: T, max: T): T {
  return Math.max(min, Math.min(max, value)) as T;
}
```

## Async Patterns

### Promises and Async/Await
```typescript
// ✅ CORRECT - Async/await for readability
async function loadAssets(): Promise<void> {
  try {
    const sprites = await loadSprites();
    const sounds = await loadSounds();
    console.log('Assets loaded');
  } catch (error) {
    console.error('Failed to load assets:', error);
  }
}

// ✅ CORRECT - Parallel loading
async function loadAllAssets(): Promise<void> {
  const [sprites, sounds, data] = await Promise.all([
    loadSprites(),
    loadSounds(),
    loadGameData(),
  ]);
}

// ✅ CORRECT - Error handling
async function saveGame(data: SaveData): Promise<boolean> {
  try {
    await storage.save(data);
    return true;
  } catch (error) {
    console.error('Save failed:', error);
    return false;
  }
}

// ❌ WRONG - Callback hell
loadSprites((sprites) => {
  loadSounds((sounds) => {
    loadData((data) => {
      // Nested callbacks
    });
  });
});
```

## Class Patterns

### Modern Class Syntax
```typescript
// ✅ CORRECT - Modern class with all features
class Player {
  // Static properties
  static readonly MAX_HEALTH = 100;

  // Private fields
  #health: number;
  #isAlive = true;

  // Public readonly
  readonly id: string;

  // Constructor with parameter properties
  constructor(
    public readonly name: string,
    private startHealth: number = Player.MAX_HEALTH
  ) {
    this.id = crypto.randomUUID();
    this.#health = startHealth;
  }

  // Getters/setters
  get health(): number {
    return this.#health;
  }

  set health(value: number) {
    this.#health = Math.max(0, Math.min(Player.MAX_HEALTH, value));
    if (this.#health <= 0) {
      this.#die();
    }
  }

  get isAlive(): boolean {
    return this.#isAlive;
  }

  // Public methods
  takeDamage(amount: number): void {
    this.health -= amount;
  }

  // Private methods
  #die(): void {
    this.#isAlive = false;
  }
}
```

## Common Anti-Patterns

### Avoid These
```typescript
// ❌ WRONG - Type assertions to silence errors
const element = document.getElementById('game') as HTMLCanvasElement;
// ✅ CORRECT - Proper null handling
const element = document.getElementById('game');
if (element instanceof HTMLCanvasElement) {
  // Use element
}

// ❌ WRONG - any type
function process(data: any): any {
  return data;
}
// ✅ CORRECT - Proper typing or unknown
function process<T>(data: T): T {
  return data;
}
function processUnknown(data: unknown): void {
  if (typeof data === 'string') {
    // Handle string
  }
}

// ❌ WRONG - Non-null assertion abuse
const player = players.find(p => p.id === id)!;
// ✅ CORRECT - Handle undefined
const player = players.find(p => p.id === id);
if (player) {
  // Use player
}

// ❌ WRONG - == instead of ===
if (value == null) { }
// ✅ CORRECT - Strict equality (except for null/undefined check)
if (value === null || value === undefined) { }
// ✅ ALSO CORRECT - == null is acceptable idiom
if (value == null) { } // Checks both null and undefined

// ❌ WRONG - Modifying function parameters
function update(config: Config): void {
  config.speed = 100;  // Mutating parameter
}
// ✅ CORRECT - Return new object
function update(config: Config): Config {
  return { ...config, speed: 100 };
}
```

## Performance Considerations

### Memory Management
```typescript
// ✅ CORRECT - Reuse objects in game loops
class BulletPool {
  private bullets: Bullet[] = [];

  // Pre-allocate
  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      this.bullets.push(new Bullet());
    }
  }

  // Reuse instead of creating new
  get(): Bullet {
    return this.bullets.pop() ?? new Bullet();
  }

  release(bullet: Bullet): void {
    bullet.reset();
    this.bullets.push(bullet);
  }
}

// ❌ WRONG - Creating objects every frame
class Game {
  update(): void {
    const position = { x: 0, y: 0 };  // New object each frame
  }
}

// ✅ CORRECT - Reuse object
class Game {
  private tempPosition = { x: 0, y: 0 };

  update(): void {
    this.tempPosition.x = 0;
    this.tempPosition.y = 0;
  }
}
```

### Event Handling
```typescript
// ✅ CORRECT - Clean up event listeners
class GameScene {
  private boundHandleResize: () => void;

  constructor() {
    this.boundHandleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.boundHandleResize);
  }

  destroy(): void {
    window.removeEventListener('resize', this.boundHandleResize);
  }

  private handleResize(): void {
    // Handle resize
  }
}

// ❌ WRONG - Anonymous functions can't be removed
window.addEventListener('resize', () => this.handleResize());
// This listener can never be removed!
```

## Import/Export

```typescript
// ✅ CORRECT - Named exports for utilities
// utils.ts
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ✅ CORRECT - Default export for classes
// Player.ts
export default class Player {
  // ...
}

// ✅ CORRECT - Type-only imports
import type { PlayerData, GameConfig } from './types';
import { clamp, lerp } from './utils';
import Player from './Player';

// ✅ CORRECT - Barrel exports
// index.ts
export { Player } from './Player';
export { Enemy } from './Enemy';
export type { PlayerData, EnemyData } from './types';
```

## Summary

| Element | Convention | Example |
|---------|------------|---------|
| Variables | camelCase | `playerHealth` |
| Functions | camelCase | `calculateDamage()` |
| Constants | UPPER_SNAKE_CASE | `MAX_HEALTH` |
| Classes | PascalCase | `PlayerController` |
| Interfaces | PascalCase | `PlayerData` |
| Types | PascalCase | `DamageType` |
| Enums | PascalCase | `GameState` |
| Private | # prefix or private | `#health`, `private health` |
| Generics | Single uppercase | `<T>`, `<K, V>` |

---

**Key Rules**:
1. Enable TypeScript strict mode
2. Use `const` by default, `let` when needed, never `var`
3. Prefer arrow functions for callbacks
4. Use optional chaining (`?.`) and nullish coalescing (`??`)
5. Always provide explicit return types
6. Handle null/undefined properly
7. Clean up event listeners and resources
8. Use object pooling for performance-critical code
