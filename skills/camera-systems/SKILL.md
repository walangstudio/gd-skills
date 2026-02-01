---
name: camera-systems
description: Reusable camera implementations (2D follow, 3D orbit, side-scroll, cinematic, screen shake). Reference from genre templates.
---

# Camera Systems

Production-ready camera controllers for all perspectives and engines.

## When to Use

Referenced by genre templates that need camera control:
- **Platformer Template** → Side-Scroll Camera 2D
- **FPS Template** → First-person (built into player controller)
- **Horror Template** → Third-person follow or first-person
- **RPG Template** → Third-Person Orbit Camera
- **Survival Template** → First-person or third-person follow
- **Farming Template** → Top-Down Camera
- **Racing Template** → Chase Camera 3D
- **Puzzle Template** → Fixed or follow camera
- **Tower Defense Template** → Top-Down with zoom/pan
- **Roguelike Template** → Top-Down or side-scroll follow

---

## Follow Camera 2D

Smooth follow with look-ahead and dead zone. Ideal for platformers.

### Godot
```gdscript
class_name FollowCamera2D
extends Camera2D

@export var target: Node2D
@export var smoothing_speed: float = 5.0
@export var look_ahead_distance: float = 50.0
@export var look_ahead_speed: float = 3.0
@export var dead_zone: Vector2 = Vector2(20.0, 10.0)

var look_ahead_offset: Vector2 = Vector2.ZERO

func _ready() -> void:
	position_smoothing_enabled = false  # We handle smoothing manually

func _physics_process(delta: float) -> void:
	if target == null:
		return

	# Calculate look-ahead based on target velocity
	var target_velocity: Vector2 = Vector2.ZERO
	if target is CharacterBody2D:
		target_velocity = target.velocity

	var desired_look_ahead := Vector2(
		sign(target_velocity.x) * look_ahead_distance,
		0
	)
	look_ahead_offset = look_ahead_offset.lerp(desired_look_ahead, look_ahead_speed * delta)

	# Apply dead zone
	var target_pos: Vector2 = target.global_position + look_ahead_offset
	var diff: Vector2 = target_pos - global_position

	if absf(diff.x) > dead_zone.x:
		global_position.x = lerpf(global_position.x, target_pos.x, smoothing_speed * delta)
	if absf(diff.y) > dead_zone.y:
		global_position.y = lerpf(global_position.y, target_pos.y, smoothing_speed * delta)
```

### Unity C#
```csharp
using UnityEngine;

public class FollowCamera2D : MonoBehaviour
{
    [SerializeField] private Transform target;
    [SerializeField] private float smoothSpeed = 5f;
    [SerializeField] private Vector2 offset = new(0, 2);
    [SerializeField] private Vector2 deadZone = new(1f, 0.5f);

    private void LateUpdate()
    {
        if (target == null) return;
        Vector3 targetPos = target.position + (Vector3)offset;
        Vector3 diff = targetPos - transform.position;

        Vector3 newPos = transform.position;
        if (Mathf.Abs(diff.x) > deadZone.x)
            newPos.x = Mathf.Lerp(newPos.x, targetPos.x, smoothSpeed * Time.deltaTime);
        if (Mathf.Abs(diff.y) > deadZone.y)
            newPos.y = Mathf.Lerp(newPos.y, targetPos.y, smoothSpeed * Time.deltaTime);
        newPos.z = -10f;
        transform.position = newPos;
    }
}
```

---

## Orbit Camera 3D

Third-person camera with spring arm, collision, and orbit control.

### Godot
```gdscript
class_name OrbitCamera3D
extends Node3D

@export var target: Node3D
@export var distance: float = 5.0
@export var min_distance: float = 2.0
@export var max_distance: float = 10.0
@export var rotation_speed: float = 0.003
@export var zoom_speed: float = 0.5
@export var min_pitch: float = -80.0
@export var max_pitch: float = 80.0
@export var smoothing: float = 10.0

var yaw: float = 0.0
var pitch: float = -20.0

@onready var spring_arm: SpringArm3D = $SpringArm3D
@onready var camera: Camera3D = $SpringArm3D/Camera3D

func _ready() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	spring_arm.spring_length = distance

func _input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		yaw -= event.relative.x * rotation_speed
		pitch -= event.relative.y * rotation_speed
		pitch = clampf(pitch, deg_to_rad(min_pitch), deg_to_rad(max_pitch))

	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			distance = maxf(distance - zoom_speed, min_distance)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			distance = minf(distance + zoom_speed, max_distance)

func _physics_process(delta: float) -> void:
	if target == null:
		return

	# Follow target
	global_position = global_position.lerp(target.global_position, smoothing * delta)

	# Apply rotation
	rotation.y = yaw
	spring_arm.rotation.x = pitch
	spring_arm.spring_length = lerpf(spring_arm.spring_length, distance, smoothing * delta)
```

### Unity C#
```csharp
using UnityEngine;

public class OrbitCamera3D : MonoBehaviour
{
    [SerializeField] private Transform target;
    [SerializeField] private float distance = 5f;
    [SerializeField] private float rotationSpeed = 3f;
    [SerializeField] private float smoothSpeed = 10f;
    [SerializeField] private float minPitch = -30f, maxPitch = 60f;

    private float yaw, pitch;

    private void Start()
    {
        Cursor.lockState = CursorLockMode.Locked;
        Vector3 angles = transform.eulerAngles;
        yaw = angles.y;
        pitch = angles.x;
    }

    private void LateUpdate()
    {
        if (target == null) return;
        yaw += Input.GetAxis("Mouse X") * rotationSpeed;
        pitch -= Input.GetAxis("Mouse Y") * rotationSpeed;
        pitch = Mathf.Clamp(pitch, minPitch, maxPitch);

        Quaternion rotation = Quaternion.Euler(pitch, yaw, 0);
        Vector3 targetPos = target.position + rotation * new Vector3(0, 0, -distance);
        transform.position = Vector3.Lerp(transform.position, targetPos, smoothSpeed * Time.deltaTime);
        transform.LookAt(target.position);
    }
}
```

---

## Side-Scroll Camera

Horizontal-focused camera for platformers with vertical follow.

### Godot
```gdscript
class_name SideScrollCamera
extends Camera2D

@export var target: Node2D
@export var horizontal_smooth: float = 8.0
@export var vertical_smooth: float = 5.0
@export var vertical_offset: float = -50.0
@export var look_down_distance: float = 100.0
@export var look_down_threshold: float = 1.0  # Seconds holding down

var look_down_timer: float = 0.0
var bounds_min: Vector2 = Vector2(-INF, -INF)
var bounds_max: Vector2 = Vector2(INF, INF)

func _physics_process(delta: float) -> void:
	if target == null:
		return

	var target_pos: Vector2 = target.global_position
	target_pos.y += vertical_offset

	# Look down when pressing down for a while
	if Input.is_action_pressed("move_down") and target is CharacterBody2D and target.is_on_floor():
		look_down_timer += delta
		if look_down_timer > look_down_threshold:
			target_pos.y += look_down_distance
	else:
		look_down_timer = 0.0

	# Smooth follow with different speeds per axis
	global_position.x = lerpf(global_position.x, target_pos.x, horizontal_smooth * delta)
	global_position.y = lerpf(global_position.y, target_pos.y, vertical_smooth * delta)

	# Clamp to level bounds
	global_position.x = clampf(global_position.x, bounds_min.x, bounds_max.x)
	global_position.y = clampf(global_position.y, bounds_min.y, bounds_max.y)

func set_bounds(min_pos: Vector2, max_pos: Vector2) -> void:
	bounds_min = min_pos
	bounds_max = max_pos
```

---

## Chase Camera 3D

Third-person chase camera for racing games.

### Godot
```gdscript
class_name ChaseCamera3D
extends Camera3D

@export var target: Node3D
@export var follow_distance: float = 8.0
@export var follow_height: float = 3.0
@export var look_ahead: float = 5.0
@export var position_smooth: float = 5.0
@export var rotation_smooth: float = 8.0

func _physics_process(delta: float) -> void:
	if target == null:
		return

	# Position behind target
	var target_forward: Vector3 = -target.global_transform.basis.z
	var desired_pos: Vector3 = target.global_position - target_forward * follow_distance
	desired_pos.y = target.global_position.y + follow_height

	global_position = global_position.lerp(desired_pos, position_smooth * delta)

	# Look at point ahead of target
	var look_target: Vector3 = target.global_position + target_forward * look_ahead
	var desired_transform := global_transform.looking_at(look_target, Vector3.UP)
	global_transform = global_transform.interpolate_with(desired_transform, rotation_smooth * delta)
```

---

## Screen Shake

Trauma-based screen shake system with decay.

### Godot
```gdscript
class_name ScreenShake
extends Node

var trauma: float = 0.0
var trauma_decay: float = 1.5
var max_offset: Vector2 = Vector2(10.0, 8.0)
var max_rotation: float = 2.0

var camera: Camera2D  # Or Camera3D

func _ready() -> void:
	camera = get_viewport().get_camera_2d()

func _process(delta: float) -> void:
	if trauma <= 0:
		return

	trauma = maxf(trauma - trauma_decay * delta, 0.0)
	var shake_amount: float = trauma * trauma  # Quadratic falloff

	if camera is Camera2D:
		camera.offset = Vector2(
			randf_range(-1.0, 1.0) * max_offset.x * shake_amount,
			randf_range(-1.0, 1.0) * max_offset.y * shake_amount
		)
		camera.rotation = randf_range(-1.0, 1.0) * deg_to_rad(max_rotation) * shake_amount

func add_trauma(amount: float) -> void:
	trauma = minf(trauma + amount, 1.0)

# Usage:
# ScreenShake.add_trauma(0.3)  # Light shake (landing)
# ScreenShake.add_trauma(0.6)  # Medium shake (explosion)
# ScreenShake.add_trauma(1.0)  # Heavy shake (boss attack)
```

### Unity C#
```csharp
using UnityEngine;

public class ScreenShake : MonoBehaviour
{
    public static ScreenShake Instance { get; private set; }

    private float trauma;
    [SerializeField] private float traumaDecay = 1.5f;
    [SerializeField] private float maxOffset = 0.5f;
    [SerializeField] private float maxRotation = 2f;

    private Vector3 originalPos;

    private void Awake() { Instance = this; }
    private void Start() { originalPos = transform.localPosition; }

    private void Update()
    {
        if (trauma <= 0) { transform.localPosition = originalPos; return; }
        trauma = Mathf.Max(trauma - traumaDecay * Time.deltaTime, 0f);
        float shake = trauma * trauma;
        transform.localPosition = originalPos + new Vector3(
            Random.Range(-1f, 1f) * maxOffset * shake,
            Random.Range(-1f, 1f) * maxOffset * shake, 0);
        transform.localRotation = Quaternion.Euler(0, 0, Random.Range(-1f, 1f) * maxRotation * shake);
    }

    public void AddTrauma(float amount) => trauma = Mathf.Min(trauma + amount, 1f);
}
```

---

## Configuration by Genre

| Genre | Camera Type | Key Features |
|-------|-----------|--------------|
| Platformer | Side-Scroll 2D | Look-ahead, dead zone, bounds |
| FPS | First-Person (in player controller) | Mouse look, head bob |
| Horror | First/Third Person | Narrow FOV, slow follow |
| RPG | Orbit 3D / Top-Down | Zoom, rotation, target lock |
| Survival | First/Third Person | Free look, zoom |
| Farming | Top-Down 2D/3D | Fixed angle, zoom |
| Racing | Chase 3D | Speed-based FOV, smooth follow |
| Puzzle | Fixed / Follow | Centered on grid, zoom |
| Tower Defense | Top-Down | Pan, zoom, edge scrolling |
| Roguelike | Top-Down / Side-Scroll | Room-based snap or follow |

---

**Reference this skill** from genre templates for camera implementations.
