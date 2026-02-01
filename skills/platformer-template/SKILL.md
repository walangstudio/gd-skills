---
name: platformer-template
description: Complete 2D/3D platformer template with player controller, enemies, collectibles, levels, and progression. Use for creating platformer games like Mario, Celeste, or Hollow Knight.
---

# Platformer Template

Production-ready platformer template with jumping, enemies, collectibles, and level progression.

## When to Use

- Creating 2D or 3D platformer games
- Need jumping, running, collecting mechanics
- Want classic platformer feel (Mario, Celeste, Sonic)
- Building level-based progression

## Core Features

### Player Controller
**Reference**: `player-controllers` skill → Platformer / Top-Down Controller base

Additional platformer features:
- **Movement**: Run left/right, variable speed
- **Jumping**: Single jump, double jump, wall jump options
- **Advanced**: Dash, slide, wall climb
- **Physics**: Gravity, acceleration, friction
- **Animation**: Idle, run, jump, fall, land
- **Game Feel**: Coyote time, jump buffer, variable jump height

### Enemy Types
**Reference**: `enemy-ai-patterns` skill → Patrol AI, Boss AI

Additional platformer enemy types:
- **Patrol Enemy**: Walks back and forth on platforms
- **Flying Enemy**: Moves in patterns (sine wave, circle)
- **Turret Enemy**: Stationary, shoots projectiles
- **Boss Enemy**: Special patterns, phases, health bar

### Collectibles
- **Coins/Gems**: Scattered throughout levels
- **Power-ups**: Temporary abilities (invincibility, speed)
- **Checkpoints**: Respawn points
- **Keys/Items**: Unlock doors, progress

### Level Design
- **Platforms**: Static, moving, falling
- **Hazards**: Spikes, pits, lava
- **Secrets**: Hidden areas, bonus rooms
- **Exit**: Level completion trigger

## Player Controller Implementation

### Godot Example (2D)
```gdscript
class_name Player
extends CharacterBody2D

# Movement
const SPEED: float = 300.0
const ACCELERATION: float = 2000.0
const FRICTION: float = 1500.0

# Jumping
const JUMP_VELOCITY: float = -400.0
const DOUBLE_JUMP_VELOCITY: float = -350.0
const WALL_JUMP_VELOCITY: Vector2 = Vector2(300, -400)

# Dash
const DASH_SPEED: float = 600.0
const DASH_DURATION: float = 0.2

# Physics
const GRAVITY: float = 980.0
const MAX_FALL_SPEED: float = 500.0

# Abilities
@export var can_double_jump: bool = true
@export var can_wall_jump: bool = true
@export var can_dash: bool = true

# State
var has_double_jump: bool = true
var dash_time_left: float = 0.0
var is_dashing: bool = false

@onready var sprite: Sprite2D = $Sprite2D
@onready var animation: AnimationPlayer = $AnimationPlayer

func _physics_process(delta: float) -> void:
    # Apply gravity
    if not is_on_floor():
        velocity.y = minf(velocity.y + GRAVITY * delta, MAX_FALL_SPEED)
    else:
        has_double_jump = true  # Reset double jump on landing

    # Dash
    if is_dashing:
        dash_time_left -= delta
        if dash_time_left <= 0:
            is_dashing = false
    else:
        # Normal movement
        var direction: float = Input.get_axis("move_left", "move_right")

        if direction != 0:
            # Accelerate
            velocity.x = move_toward(velocity.x, direction * SPEED, ACCELERATION * delta)
            sprite.flip_h = direction < 0
        else:
            # Friction
            velocity.x = move_toward(velocity.x, 0, FRICTION * delta)

        # Jump
        if Input.is_action_just_pressed("jump"):
            if is_on_floor():
                velocity.y = JUMP_VELOCITY
                AudioManager.play_sfx("jump")
            elif can_double_jump and has_double_jump:
                velocity.y = DOUBLE_JUMP_VELOCITY
                has_double_jump = false
                AudioManager.play_sfx("double_jump")
            elif can_wall_jump and is_on_wall():
                velocity = WALL_JUMP_VELOCITY * Vector2(-get_wall_normal().x, 1)
                AudioManager.play_sfx("wall_jump")

        # Dash
        if Input.is_action_just_pressed("dash") and can_dash and not is_dashing:
            is_dashing = true
            dash_time_left = DASH_DURATION
            velocity.x = sign(sprite.scale.x) * DASH_SPEED
            velocity.y = 0
            AudioManager.play_sfx("dash")

    # Variable jump height (release jump early)
    if Input.is_action_just_released("jump") and velocity.y < 0:
        velocity.y *= 0.5

    move_and_slide()
    update_animation()

func update_animation() -> void:
    if is_dashing:
        animation.play("dash")
    elif not is_on_floor():
        if velocity.y < 0:
            animation.play("jump")
        else:
            animation.play("fall")
    elif abs(velocity.x) > 10:
        animation.play("run")
    else:
        animation.play("idle")
```

### Unity C# — Player Controller (2D)
```csharp
public class PlayerController : MonoBehaviour
{
    [Header("Movement")]
    [SerializeField] private float speed = 8f;
    [SerializeField] private float acceleration = 50f;
    [SerializeField] private float friction = 40f;
    [SerializeField] private float jumpForce = 14f;
    [SerializeField] private float doubleJumpForce = 12f;

    [Header("Abilities")]
    [SerializeField] private bool canDoubleJump = true;
    [SerializeField] private bool canWallJump = true;

    private Rigidbody2D rb;
    private bool isGrounded;
    private bool hasDoubleJump = true;
    private float moveInput;

    private void Awake() => rb = GetComponent<Rigidbody2D>();

    private void Update()
    {
        moveInput = Input.GetAxisRaw("Horizontal");

        if (Input.GetButtonDown("Jump"))
        {
            if (isGrounded)
            {
                rb.linearVelocity = new Vector2(rb.linearVelocity.x, jumpForce);
            }
            else if (canDoubleJump && hasDoubleJump)
            {
                rb.linearVelocity = new Vector2(rb.linearVelocity.x, doubleJumpForce);
                hasDoubleJump = false;
            }
        }

        // Variable jump height
        if (Input.GetButtonUp("Jump") && rb.linearVelocity.y > 0)
            rb.linearVelocity = new Vector2(rb.linearVelocity.x, rb.linearVelocity.y * 0.5f);
    }

    private void FixedUpdate()
    {
        float targetSpeed = moveInput * speed;
        float accel = moveInput != 0 ? acceleration : friction;
        float newSpeed = Mathf.MoveTowards(rb.linearVelocity.x, targetSpeed, accel * Time.fixedDeltaTime);
        rb.linearVelocity = new Vector2(newSpeed, rb.linearVelocity.y);
    }

    private void OnCollisionEnter2D(Collision2D col)
    {
        if (col.contacts[0].normal.y > 0.5f)
        {
            isGrounded = true;
            hasDoubleJump = true;
        }
    }

    private void OnCollisionExit2D(Collision2D col) => isGrounded = false;
}
```

### Roblox Luau — Player Controller (2D-style)
```lua
--!strict
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")

local SPEED: number = 30
local JUMP_FORCE: number = 50
local DOUBLE_JUMP_FORCE: number = 45

local player: Player = Players.LocalPlayer
local character: Model = player.Character or player.CharacterAdded:Wait()
local humanoid: Humanoid = character:WaitForChild("Humanoid") :: Humanoid
local rootPart: BasePart = character:WaitForChild("HumanoidRootPart") :: BasePart

local hasDoubleJump: boolean = true
local canDoubleJump: boolean = true

humanoid.WalkSpeed = SPEED
humanoid.JumpPower = JUMP_FORCE

-- Reset double jump on landing
humanoid.StateChanged:Connect(function(oldState: Enum.HumanoidStateType, newState: Enum.HumanoidStateType)
    if newState == Enum.HumanoidStateType.Landed then
        hasDoubleJump = true
    end
end)

-- Double jump input
UserInputService.JumpRequest:Connect(function()
    if not humanoid:GetState() == Enum.HumanoidStateType.Freefall then
        return
    end
    if canDoubleJump and hasDoubleJump then
        hasDoubleJump = false
        rootPart.AssemblyLinearVelocity = Vector3.new(
            rootPart.AssemblyLinearVelocity.X,
            DOUBLE_JUMP_FORCE,
            rootPart.AssemblyLinearVelocity.Z
        )
    end
end)
```

### Unreal C++ — Player Controller (2D Side-Scroller)
```cpp
// PlatformerCharacter.h
#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "PlatformerCharacter.generated.h"

UCLASS()
class APlatformerCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    APlatformerCharacter();

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
    float MoveSpeed = 600.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
    float JumpForce = 800.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
    float DoubleJumpForce = 700.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Abilities")
    bool bCanDoubleJump = true;

protected:
    virtual void SetupPlayerInputComponent(UInputComponent* PlayerInputComponent) override;
    virtual void Landed(const FHitResult& Hit) override;

private:
    void MoveRight(float Value);
    void StartJump();
    void StopJump();

    bool bHasDoubleJump = true;
};

// PlatformerCharacter.cpp
#include "PlatformerCharacter.h"
#include "GameFramework/CharacterMovementComponent.h"

APlatformerCharacter::APlatformerCharacter()
{
    GetCharacterMovement()->MaxWalkSpeed = MoveSpeed;
    GetCharacterMovement()->JumpZVelocity = JumpForce;
    GetCharacterMovement()->AirControl = 0.8f;
}

void APlatformerCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
    Super::SetupPlayerInputComponent(PlayerInputComponent);
    PlayerInputComponent->BindAxis("MoveRight", this, &APlatformerCharacter::MoveRight);
    PlayerInputComponent->BindAction("Jump", IE_Pressed, this, &APlatformerCharacter::StartJump);
    PlayerInputComponent->BindAction("Jump", IE_Released, this, &APlatformerCharacter::StopJump);
}

void APlatformerCharacter::MoveRight(float Value)
{
    AddMovementInput(FVector(1.0f, 0.0f, 0.0f), Value);
}

void APlatformerCharacter::StartJump()
{
    if (GetCharacterMovement()->IsMovingOnGround())
    {
        Jump();
    }
    else if (bCanDoubleJump && bHasDoubleJump)
    {
        bHasDoubleJump = false;
        LaunchCharacter(FVector(0.0f, 0.0f, DoubleJumpForce), false, true);
    }
}

void APlatformerCharacter::StopJump()
{
    StopJumping();
}

void APlatformerCharacter::Landed(const FHitResult& Hit)
{
    Super::Landed(Hit);
    bHasDoubleJump = true;
}
```

### Coyote Time & Jump Buffer
```gdscript
# Coyote time: Grace period after leaving platform
const COYOTE_TIME: float = 0.1
var coyote_timer: float = 0.0

# Jump buffer: Remember jump input before landing
const JUMP_BUFFER_TIME: float = 0.15
var jump_buffer_timer: float = 0.0

func _physics_process(delta: float) -> void:
    # Coyote time
    if is_on_floor():
        coyote_timer = COYOTE_TIME
    else:
        coyote_timer -= delta

    # Jump buffer
    if Input.is_action_just_pressed("jump"):
        jump_buffer_timer = JUMP_BUFFER_TIME

    if jump_buffer_timer > 0:
        jump_buffer_timer -= delta

    # Jump with coyote time and buffer
    if jump_buffer_timer > 0 and coyote_timer > 0:
        velocity.y = JUMP_VELOCITY
        jump_buffer_timer = 0
        coyote_timer = 0
```

## Enemy Implementation

### Patrol Enemy
```gdscript
class_name EnemyPatrol
extends CharacterBody2D

@export var speed: float = 100.0
@export var patrol_distance: float = 200.0
@export var damage: int = 10

var direction: int = 1
var start_position: Vector2

@onready var sprite: Sprite2D = $Sprite2D
@onready var raycast_floor: RayCast2D = $RayCastFloor
@onready var raycast_wall: RayCast2D = $RayCastWall

func _ready() -> void:
    start_position = global_position

func _physics_process(delta: float) -> void:
    # Move
    velocity.x = direction * speed
    velocity.y += 980 * delta  # Gravity

    # Check for walls or edges
    if raycast_wall.is_colliding() or not raycast_floor.is_colliding():
        direction *= -1
        sprite.flip_h = direction < 0

    # Patrol distance limit
    var distance: float = global_position.x - start_position.x
    if abs(distance) > patrol_distance:
        direction *= -1
        sprite.flip_h = direction < 0

    move_and_slide()

func _on_hitbox_body_entered(body: Node2D) -> void:
    if body.has_method("take_damage"):
        body.take_damage(damage)
```

### Flying Enemy
```gdscript
class_name EnemyFlying
extends CharacterBody2D

@export var speed: float = 150.0
@export var amplitude: float = 50.0
@export var frequency: float = 2.0

var start_position: Vector2
var time: float = 0.0

func _ready() -> void:
    start_position = global_position

func _physics_process(delta: float) -> void:
    time += delta

    # Sine wave movement using velocity (let move_and_slide handle position)
    velocity.x = speed
    velocity.y = cos(time * frequency) * amplitude * frequency

    move_and_slide()
```

## Collectible System

### Coin
```gdscript
class_name Coin
extends Area2D

@export var value: int = 1

signal collected(value: int)

func _ready() -> void:
    body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node2D) -> void:
    if body.is_in_group("player"):
        collect()

func collect() -> void:
    collected.emit(value)
    AudioManager.play_sfx("coin_collect")

    # Play collection animation
    var tween: Tween = create_tween()
    tween.set_parallel(true)
    tween.tween_property($Sprite2D, "scale", Vector2(1.5, 1.5), 0.2)
    tween.tween_property($Sprite2D, "modulate:a", 0.0, 0.2)
    tween.tween_callback(queue_free)
```

## Level Structure

### Complete Level Template
```
Level Scene (Node2D)
├── TileMap (platforms, walls)
├── Background (parallax layers)
├── Player (spawn point)
├── Enemies (Node2D)
│   ├── PatrolEnemy1
│   ├── PatrolEnemy2
│   └── FlyingEnemy1
├── Collectibles (Node2D)
│   ├── Coin1
│   ├── Coin2
│   └── PowerUp
├── Hazards (Node2D)
│   ├── Spikes1
│   └── Pit (Area2D)
├── Checkpoints (Node2D)
│   └── Checkpoint1
├── Exit (Area2D)
└── Camera2D (follows player)
```

## Game Manager

```gdscript
extends Node

signal score_changed(new_score: int)
signal lives_changed(new_lives: int)

var score: int = 0
var lives: int = 3
var current_level: int = 1
var coins_collected: int = 0

const EXTRA_LIFE_COINS: int = 100

func add_score(amount: int) -> void:
    score += amount
    score_changed.emit(score)

func add_coins(amount: int) -> void:
    coins_collected += amount

    # Extra life every 100 coins
    if coins_collected >= EXTRA_LIFE_COINS:
        coins_collected -= EXTRA_LIFE_COINS
        add_life()

    add_score(amount)

func add_life() -> void:
    lives += 1
    lives_changed.emit(lives)
    AudioManager.play_sfx("extra_life")

func lose_life() -> void:
    lives -= 1
    lives_changed.emit(lives)

    if lives <= 0:
        game_over()
    else:
        respawn_player()

func game_over() -> void:
    get_tree().change_scene_to_file("res://scenes/game_over.tscn")

func complete_level() -> void:
    current_level += 1
    get_tree().change_scene_to_file("res://scenes/levels/level_%d.tscn" % current_level)
```

## HUD Display

```gdscript
extends CanvasLayer

@onready var score_label: Label = $ScoreLabel
@onready var lives_label: Label = $LivesLabel
@onready var coin_label: Label = $CoinLabel

func _ready() -> void:
    GameManager.score_changed.connect(_on_score_changed)
    GameManager.lives_changed.connect(_on_lives_changed)

func _on_score_changed(new_score: int) -> void:
    score_label.text = "Score: %d" % new_score

func _on_lives_changed(new_lives: int) -> void:
    lives_label.text = "Lives: %d" % new_lives
```

## Customization Options

When using `/create-platformer`, users can choose:

**Player Abilities**:
- Jump only (basic)
- Jump + Double Jump
- Jump + Wall Jump
- Jump + Dash
- All abilities

**Enemy Types**:
- Patrol enemies (ground)
- Flying enemies (air)
- Turret enemies (stationary)
- Boss enemy (special)

**Level Count**:
- 3 levels (short)
- 5 levels (medium)
- 10 levels (full game)

**Health System**:
- Lives system (3 lives, like Mario)
- Health bar (100 HP, can take multiple hits)
- One-hit death (hardcore mode)

**Theme**:
- Forest/Nature
- Desert/Canyon
- Cave/Underground
- Castle/Medieval
- Volcano/Lava

---

**Remember**: Platformers need tight controls, satisfying jump feel, clear level design, and progressive difficulty. Add coyote time and jump buffering for better player experience.
