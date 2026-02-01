---
name: player-controllers
description: Reusable player controller implementations for all perspectives (FPS, third-person, top-down, side-scroll). Reference from genre templates.
---

# Player Controllers

Production-ready player controller implementations for multiple perspectives and engines.

## When to Use

Referenced by genre templates that need player movement:
- **FPS Template** → First-Person Controller
- **Horror Template** → First-Person or Third-Person Controller
- **RPG Template** → Third-Person or Top-Down Controller
- **Survival Template** → First-Person or Third-Person Controller
- **Platformer Template** → Side-Scroll Controller (see platformer-template)

---

## First-Person Controller

### Godot 3D
```gdscript
class_name FPSController
extends CharacterBody3D

# Movement
@export var walk_speed: float = 5.0
@export var sprint_speed: float = 8.0
@export var crouch_speed: float = 2.5
@export var jump_velocity: float = 4.5
@export var acceleration: float = 10.0

# Mouse Look
@export var mouse_sensitivity: float = 0.002
const MAX_PITCH: float = 89.0

# State
var current_speed: float = walk_speed
var is_crouching: bool = false
const GRAVITY: float = 9.8

@onready var head: Node3D = $Head
@onready var camera: Camera3D = $Head/Camera3D

func _ready() -> void:
    Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _input(event: InputEvent) -> void:
    if event is InputEventMouseMotion:
        rotate_y(-event.relative.x * mouse_sensitivity)
        head.rotate_x(-event.relative.y * mouse_sensitivity)
        head.rotation.x = clampf(head.rotation.x, deg_to_rad(-MAX_PITCH), deg_to_rad(MAX_PITCH))

func _physics_process(delta: float) -> void:
    # Gravity
    if not is_on_floor():
        velocity.y -= GRAVITY * delta

    # Jump
    if Input.is_action_just_pressed("jump") and is_on_floor():
        velocity.y = jump_velocity

    # Sprint/Crouch speed
    if Input.is_action_pressed("sprint"):
        current_speed = sprint_speed
    elif Input.is_action_pressed("crouch"):
        current_speed = crouch_speed
    else:
        current_speed = walk_speed

    # Movement
    var input_dir := Input.get_vector("move_left", "move_right", "move_forward", "move_backward")
    var direction := (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()

    if direction:
        velocity.x = lerpf(velocity.x, direction.x * current_speed, acceleration * delta)
        velocity.z = lerpf(velocity.z, direction.z * current_speed, acceleration * delta)
    else:
        velocity.x = lerpf(velocity.x, 0.0, acceleration * delta)
        velocity.z = lerpf(velocity.z, 0.0, acceleration * delta)

    move_and_slide()
```

### Unity C#
```csharp
using UnityEngine;

public class FPSController : MonoBehaviour
{
    [Header("Movement")]
    [SerializeField] private float walkSpeed = 5f;
    [SerializeField] private float sprintSpeed = 8f;
    [SerializeField] private float jumpForce = 5f;

    [Header("Mouse Look")]
    [SerializeField] private float mouseSensitivity = 2f;
    [SerializeField] private Transform cameraTransform;

    private CharacterController controller;
    private float verticalVelocity;
    private float cameraPitch;

    private void Start()
    {
        controller = GetComponent<CharacterController>();
        Cursor.lockState = CursorLockMode.Locked;
    }

    private void Update()
    {
        HandleMouseLook();
        HandleMovement();
    }

    private void HandleMouseLook()
    {
        float mouseX = Input.GetAxis("Mouse X") * mouseSensitivity;
        float mouseY = Input.GetAxis("Mouse Y") * mouseSensitivity;

        cameraPitch = Mathf.Clamp(cameraPitch - mouseY, -89f, 89f);
        cameraTransform.localRotation = Quaternion.Euler(cameraPitch, 0, 0);
        transform.Rotate(Vector3.up * mouseX);
    }

    private void HandleMovement()
    {
        float speed = Input.GetKey(KeyCode.LeftShift) ? sprintSpeed : walkSpeed;
        Vector3 move = transform.right * Input.GetAxis("Horizontal") +
                       transform.forward * Input.GetAxis("Vertical");

        if (controller.isGrounded)
        {
            verticalVelocity = -0.5f;
            if (Input.GetButtonDown("Jump"))
                verticalVelocity = jumpForce;
        }
        else
        {
            verticalVelocity -= 9.8f * Time.deltaTime;
        }

        Vector3 velocity = move * speed + Vector3.up * verticalVelocity;
        controller.Move(velocity * Time.deltaTime);
    }
}
```

---

## Third-Person Controller

### Godot 3D
```gdscript
class_name ThirdPersonController
extends CharacterBody3D

@export var move_speed: float = 5.0
@export var sprint_speed: float = 8.0
@export var jump_velocity: float = 4.5
@export var rotation_speed: float = 10.0

const GRAVITY: float = 9.8

@onready var camera_pivot: Node3D = $CameraPivot
@onready var spring_arm: SpringArm3D = $CameraPivot/SpringArm3D
@onready var model: Node3D = $Model

func _physics_process(delta: float) -> void:
    # Gravity
    if not is_on_floor():
        velocity.y -= GRAVITY * delta

    # Jump
    if Input.is_action_just_pressed("jump") and is_on_floor():
        velocity.y = jump_velocity

    # Get input relative to camera
    var input_dir := Input.get_vector("move_left", "move_right", "move_forward", "move_backward")
    var cam_basis := camera_pivot.global_transform.basis
    var direction := (cam_basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
    direction.y = 0

    # Movement
    var speed := sprint_speed if Input.is_action_pressed("sprint") else move_speed
    if direction:
        velocity.x = direction.x * speed
        velocity.z = direction.z * speed
        # Rotate model to face movement direction
        var target_rotation := atan2(direction.x, direction.z)
        model.rotation.y = lerp_angle(model.rotation.y, target_rotation, rotation_speed * delta)
    else:
        velocity.x = move_toward(velocity.x, 0, speed)
        velocity.z = move_toward(velocity.z, 0, speed)

    move_and_slide()
```

### Unity C#
```csharp
using UnityEngine;

public class ThirdPersonController : MonoBehaviour
{
    [SerializeField] private float moveSpeed = 5f;
    [SerializeField] private float rotationSpeed = 10f;
    [SerializeField] private Transform cameraTransform;

    private CharacterController controller;
    private float verticalVelocity;

    private void Start()
    {
        controller = GetComponent<CharacterController>();
    }

    private void Update()
    {
        Vector3 input = new Vector3(Input.GetAxis("Horizontal"), 0, Input.GetAxis("Vertical"));
        Vector3 moveDir = cameraTransform.TransformDirection(input);
        moveDir.y = 0;
        moveDir.Normalize();

        if (moveDir.magnitude > 0.1f)
        {
            Quaternion targetRotation = Quaternion.LookRotation(moveDir);
            transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, rotationSpeed * Time.deltaTime);
        }

        if (controller.isGrounded)
        {
            verticalVelocity = -0.5f;
            if (Input.GetButtonDown("Jump"))
                verticalVelocity = 5f;
        }
        else
        {
            verticalVelocity -= 9.8f * Time.deltaTime;
        }

        Vector3 velocity = moveDir * moveSpeed + Vector3.up * verticalVelocity;
        controller.Move(velocity * Time.deltaTime);
    }
}
```

---

## Top-Down Controller

### Godot 2D/3D
```gdscript
class_name TopDownController
extends CharacterBody2D  # Or CharacterBody3D for 3D

@export var move_speed: float = 200.0
@export var acceleration: float = 1500.0
@export var friction: float = 1200.0

func _physics_process(delta: float) -> void:
    var input_dir := Input.get_vector("move_left", "move_right", "move_up", "move_down")

    if input_dir != Vector2.ZERO:
        velocity = velocity.move_toward(input_dir * move_speed, acceleration * delta)
        # Face movement direction (optional)
        rotation = input_dir.angle()
    else:
        velocity = velocity.move_toward(Vector2.ZERO, friction * delta)

    move_and_slide()

# For mouse-aim variant:
func look_at_mouse() -> void:
    var mouse_pos := get_global_mouse_position()
    look_at(mouse_pos)
```

---

## Vehicle Controller

### Godot 3D
```gdscript
class_name VehicleController
extends VehicleBody3D

@export var max_engine_force: float = 400.0
@export var max_brake_force: float = 50.0
@export var max_steer_angle: float = 0.5

func _physics_process(_delta: float) -> void:
    var throttle := Input.get_axis("brake", "accelerate")
    var steer := Input.get_axis("steer_right", "steer_left")

    engine_force = throttle * max_engine_force
    steering = steer * max_steer_angle

    if Input.is_action_pressed("handbrake"):
        brake = max_brake_force
    else:
        brake = 0.0
```

---

## Controller Scene Structure

### FPS Player Scene
```
FPSPlayer (CharacterBody3D)
├── CollisionShape3D
├── Head (Node3D)
│   └── Camera3D
│       └── WeaponHolder (Node3D)
└── AudioStreamPlayer3D (footsteps)
```

### Third-Person Scene
```
TPSPlayer (CharacterBody3D)
├── CollisionShape3D
├── Model (Node3D) - visual mesh
├── CameraPivot (Node3D)
│   └── SpringArm3D
│       └── Camera3D
└── AnimationTree
```

---

## Configuration Options

| Option | FPS | Third-Person | Top-Down |
|--------|-----|--------------|----------|
| Walk Speed | 5.0 | 5.0 | 200.0 (px) |
| Sprint Speed | 8.0 | 8.0 | 300.0 |
| Mouse Sensitivity | 0.002 | N/A | N/A |
| Jump Velocity | 4.5 | 4.5 | N/A |
| Camera Distance | N/A | 5.0 | N/A |

---

**Reference this skill** from genre templates for player controller implementations.
