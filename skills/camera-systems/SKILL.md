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

### Defold

A game object holds a `camera` component; the script acquires focus and moves the camera object toward the target each frame. Smoothing is a per-axis lerp; a dead zone skips small corrections. The active render script reads the focused camera's view/projection. Tunables go through `go.property`.

```lua
-- objects/follow_camera.script  (game object has a "#camera" component)
go.property("smoothing_speed", 5.0)
go.property("look_ahead_distance", 50.0)
go.property("look_ahead_speed", 3.0)
go.property("dead_zone_x", 20.0)
go.property("dead_zone_y", 10.0)
go.property("target", msg.url())   -- the followed object

function init(self)
	msg.post("#camera", "acquire_camera_focus")
	self.look_ahead = vmath.vector3()
end

function update(self, dt)
	-- look-ahead from the target's facing/velocity (sent via "set_velocity")
	local desired = vmath.vector3(
		(self.vel_x or 0) >= 0 and self.look_ahead_distance or -self.look_ahead_distance,
		0, 0)
	self.look_ahead = vmath.lerp(self.look_ahead_speed * dt, self.look_ahead, desired)

	local target_pos = go.get_position(self.target) + self.look_ahead
	local pos = go.get_position()

	if math.abs(target_pos.x - pos.x) > self.dead_zone_x then
		pos.x = vmath.lerp(self.smoothing_speed * dt, pos.x, target_pos.x)
	end
	if math.abs(target_pos.y - pos.y) > self.dead_zone_y then
		pos.y = vmath.lerp(self.smoothing_speed * dt, pos.y, target_pos.y)
	end
	go.set_position(pos)
end

function on_message(self, message_id, message, sender)
	if message_id == hash("set_velocity") then
		self.vel_x = message.x   -- player posts its horizontal velocity
	end
end

function final(self)
	msg.post("#camera", "release_camera_focus")
end
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

### Defold

The orbit rig is a game object with a child camera object offset back by `distance`. Mouse motion (delivered through `on_input` as a relative move action) drives yaw/pitch; the rig rotates and the camera looks at the target. Pitch is clamped; the wheel zooms the offset.

```lua
-- objects/orbit_camera.script  (child "/orbit/camera#camera")
go.property("distance", 5.0)
go.property("min_distance", 2.0)
go.property("max_distance", 10.0)
go.property("rotation_speed", 0.003)
go.property("zoom_speed", 0.5)
go.property("smoothing", 10.0)
go.property("target", msg.url())

local MIN_PITCH = math.rad(-80)
local MAX_PITCH = math.rad(80)

function init(self)
	msg.post("camera#camera", "acquire_camera_focus")
	msg.post(".", "acquire_input_focus")
	self.yaw = 0
	self.pitch = math.rad(-20)
	self.cur_distance = self.distance
end

function on_input(self, action_id, action)
	if action_id == hash("look") then
		self.yaw = self.yaw - action.dx * self.rotation_speed
		self.pitch = self.pitch - action.dy * self.rotation_speed
		self.pitch = math.max(MIN_PITCH, math.min(MAX_PITCH, self.pitch))
	elseif action_id == hash("zoom_in") and action.pressed then
		self.distance = math.max(self.distance - self.zoom_speed, self.min_distance)
	elseif action_id == hash("zoom_out") and action.pressed then
		self.distance = math.min(self.distance + self.zoom_speed, self.max_distance)
	end
end

function update(self, dt)
	-- follow target position smoothly
	local pos = vmath.lerp(self.smoothing * dt,
		go.get_position(), go.get_position(self.target))
	go.set_position(pos)

	-- apply orbit rotation to the rig
	local rot = vmath.quat_rotation_y(self.yaw) * vmath.quat_rotation_x(self.pitch)
	go.set_rotation(rot)

	-- pull the child camera back along local -Z by the (smoothed) distance
	self.cur_distance = vmath.lerp(self.smoothing * dt, self.cur_distance, self.distance)
	go.set_position(vmath.vector3(0, 0, self.cur_distance), "camera")
end

function final(self)
	msg.post(".", "release_input_focus")
	msg.post("camera#camera", "release_camera_focus")
end
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

### Defold

Horizontal-focused 2D follow with independent per-axis smoothing and a clamp to the level bounds. The "look down" hold is tracked with a `dt` timer. Bounds are set via a message from the level controller.

```lua
-- objects/side_scroll_camera.script  (has a "#camera" component)
go.property("horizontal_smooth", 8.0)
go.property("vertical_smooth", 5.0)
go.property("vertical_offset", -50.0)
go.property("look_down_distance", 100.0)
go.property("look_down_threshold", 1.0)
go.property("target", msg.url())

function init(self)
	msg.post("#camera", "acquire_camera_focus")
	msg.post(".", "acquire_input_focus")
	self.look_down_timer = 0
	self.holding_down = false
	self.on_floor = true
	self.bounds_min = vmath.vector3(-math.huge, -math.huge, 0)
	self.bounds_max = vmath.vector3(math.huge, math.huge, 0)
end

function on_input(self, action_id, action)
	if action_id == hash("move_down") then
		self.holding_down = action.pressed or action.repeated
	end
end

function update(self, dt)
	local target_pos = go.get_position(self.target)
	target_pos.y = target_pos.y + self.vertical_offset

	if self.holding_down and self.on_floor then
		self.look_down_timer = self.look_down_timer + dt
		if self.look_down_timer > self.look_down_threshold then
			target_pos.y = target_pos.y + self.look_down_distance
		end
	else
		self.look_down_timer = 0
	end

	local pos = go.get_position()
	pos.x = vmath.lerp(self.horizontal_smooth * dt, pos.x, target_pos.x)
	pos.y = vmath.lerp(self.vertical_smooth * dt, pos.y, target_pos.y)
	pos.x = math.max(self.bounds_min.x, math.min(self.bounds_max.x, pos.x))
	pos.y = math.max(self.bounds_min.y, math.min(self.bounds_max.y, pos.y))
	go.set_position(pos)
end

function on_message(self, message_id, message, sender)
	if message_id == hash("set_bounds") then
		self.bounds_min = message.min
		self.bounds_max = message.max
	elseif message_id == hash("set_on_floor") then
		self.on_floor = message.value
	end
end
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

### Defold

Position the camera object behind the target along its forward axis, lerp toward it, then orient the camera with a look-at quaternion built from the camera-to-target vector. The target's forward comes from rotating world -Z by the target's rotation.

```lua
-- objects/chase_camera.script  (has a "#camera" component)
go.property("follow_distance", 8.0)
go.property("follow_height", 3.0)
go.property("look_ahead", 5.0)
go.property("position_smooth", 5.0)
go.property("rotation_smooth", 8.0)
go.property("target", msg.url())

local FORWARD = vmath.vector3(0, 0, -1)

function init(self)
	msg.post("#camera", "acquire_camera_focus")
end

function update(self, dt)
	local target_pos = go.get_position(self.target)
	local forward = vmath.rotate(go.get_rotation(self.target), FORWARD)

	local desired = target_pos - forward * self.follow_distance
	desired.y = target_pos.y + self.follow_height
	go.set_position(vmath.lerp(self.position_smooth * dt, go.get_position(), desired))

	-- look at a point ahead of the target
	local look_target = target_pos + forward * self.look_ahead
	local dir = vmath.normalize(look_target - go.get_position())
	local desired_rot = vmath.quat_from_to(FORWARD, dir)
	go.set_rotation(vmath.slerp(self.rotation_smooth * dt, go.get_rotation(), desired_rot))
end
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

### Defold

Shake lives on the camera object as an additive offset applied on top of the follow logic. Keep a base (followed) position and add a decaying random offset each frame; trauma falls off quadratically. Other objects request shake by posting `add_trauma`.

```lua
-- objects/screen_shake.script  (sits on the camera object)
go.property("trauma_decay", 1.5)
go.property("max_offset_x", 10.0)
go.property("max_offset_y", 8.0)
go.property("max_rotation", 2.0)

function init(self)
	self.trauma = 0
	self.base_pos = go.get_position()
end

function update(self, dt)
	-- record where the follow logic left us this frame, then shake around it
	self.base_pos = go.get_position()
	if self.trauma <= 0 then return end

	self.trauma = math.max(self.trauma - self.trauma_decay * dt, 0)
	local amount = self.trauma * self.trauma   -- quadratic falloff

	local offset = vmath.vector3(
		(math.random() * 2 - 1) * self.max_offset_x * amount,
		(math.random() * 2 - 1) * self.max_offset_y * amount,
		0)
	go.set_position(self.base_pos + offset)

	local angle = (math.random() * 2 - 1) * math.rad(self.max_rotation) * amount
	go.set_rotation(vmath.quat_rotation_z(angle))
end

function on_message(self, message_id, message, sender)
	if message_id == hash("add_trauma") then
		-- amount: 0.3 landing, 0.6 explosion, 1.0 boss hit
		self.trauma = math.min(self.trauma + message.amount, 1.0)
	end
end

-- usage:  msg.post("/camera#screen_shake", "add_trauma", { amount = 0.6 })
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
