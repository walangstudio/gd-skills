---
name: racing-template
description: Racing game template with vehicle physics, track system, AI opponents, and lap management. Use for games like Mario Kart, Need for Speed, or TrackMania.
---

# Racing Template

Production-ready racing game template with vehicle physics, tracks, AI racers, and progression.

## When to Use

- Creating racing or driving games
- Need vehicle physics and controls
- Want AI opponents and lap tracking
- Building kart racers or realistic racing

## Sub-Genres Supported

1. **Kart** (Mario Kart) - Items, drifting, arcade physics
2. **Arcade** (Need for Speed, Burnout) - Nitro, takedowns, open-world
3. **Simulation** (Gran Turismo, Forza) - Realistic physics, tuning
4. **Endless Runner** (Temple Run, Subway Surfers) - Procedural, dodge obstacles
5. **Time Trial** (TrackMania) - Precision driving, leaderboards

## Core Features

### Player Controller
**Reference**: `player-controllers` skill → Vehicle Controller

Additional racing features:
- Drift mechanic with boost reward
- Nitro/boost system
- Respawn on track reset

---

## Racing-Specific Systems

### Vehicle Controller
```gdscript
class_name RacingVehicle
extends CharacterBody3D

signal boost_changed(current: float, maximum: float)
signal lap_completed(lap_number: int)

@export var max_speed: float = 30.0
@export var acceleration: float = 15.0
@export var brake_force: float = 25.0
@export var turn_speed: float = 3.0
@export var drift_factor: float = 0.9
@export var grip_factor: float = 0.7
@export var max_boost: float = 100.0
@export var boost_multiplier: float = 1.5

var current_speed: float = 0.0
var steer_input: float = 0.0
var is_drifting: bool = false
var drift_timer: float = 0.0
var boost_amount: float = 0.0
var is_boosting: bool = false

func _physics_process(delta: float) -> void:
    # Input
    var throttle: float = Input.get_action_strength("accelerate") - Input.get_action_strength("brake")
    steer_input = Input.get_action_strength("steer_right") - Input.get_action_strength("steer_left")
    is_drifting = Input.is_action_pressed("drift") and absf(steer_input) > 0.3

    # Acceleration/braking
    var target_speed: float = max_speed * (boost_multiplier if is_boosting else 1.0)
    if throttle > 0:
        current_speed = move_toward(current_speed, target_speed, acceleration * delta)
    elif throttle < 0:
        current_speed = move_toward(current_speed, -max_speed * 0.3, brake_force * delta)
    else:
        current_speed = move_toward(current_speed, 0, acceleration * 0.5 * delta)

    # Steering
    var turn_amount: float = steer_input * turn_speed * delta
    if is_drifting:
        turn_amount *= 1.4
        drift_timer += delta
        # Build boost while drifting
        if drift_timer > 0.5:
            boost_amount = minf(boost_amount + 30.0 * delta, max_boost)
            boost_changed.emit(boost_amount, max_boost)
    else:
        if drift_timer > 1.0:
            activate_boost()
        drift_timer = 0.0

    if current_speed != 0:
        rotate_y(turn_amount * signf(current_speed))

    # Apply velocity
    var forward: Vector3 = -transform.basis.z
    var side_velocity: float = velocity.dot(transform.basis.x)

    var slip: float = drift_factor if is_drifting else grip_factor
    velocity = forward * current_speed
    velocity += transform.basis.x * side_velocity * slip
    velocity.y -= 9.8 * delta  # Gravity

    move_and_slide()

func activate_boost() -> void:
    if boost_amount <= 0:
        return
    is_boosting = true
    var boost_duration: float = boost_amount / 50.0
    boost_amount = 0.0
    boost_changed.emit(0, max_boost)

    await get_tree().create_timer(boost_duration).timeout
    is_boosting = false
```

### Unity C# — Vehicle Controller
```csharp
public class RacingVehicle : MonoBehaviour
{
    [Header("Speed")]
    [SerializeField] private float maxSpeed = 30f;
    [SerializeField] private float acceleration = 15f;
    [SerializeField] private float brakeForce = 25f;

    [Header("Handling")]
    [SerializeField] private float turnSpeed = 100f;
    [SerializeField] private float driftFactor = 0.9f;
    [SerializeField] private float gripFactor = 0.7f;

    [Header("Boost")]
    [SerializeField] private float maxBoost = 100f;
    [SerializeField] private float boostMultiplier = 1.5f;

    private CharacterController cc;
    private float currentSpeed;
    private float steerInput;
    private bool isDrifting;
    private float driftTimer;
    private float boostAmount;
    private bool isBoosting;

    private void Awake() => cc = GetComponent<CharacterController>();

    private void Update()
    {
        float throttle = Input.GetAxis("Vertical");
        steerInput = Input.GetAxis("Horizontal");
        isDrifting = Input.GetButton("Fire1") && Mathf.Abs(steerInput) > 0.3f;

        float targetSpeed = maxSpeed * (isBoosting ? boostMultiplier : 1f);
        if (throttle > 0) currentSpeed = Mathf.MoveTowards(currentSpeed, targetSpeed, acceleration * Time.deltaTime);
        else if (throttle < 0) currentSpeed = Mathf.MoveTowards(currentSpeed, -maxSpeed * 0.3f, brakeForce * Time.deltaTime);
        else currentSpeed = Mathf.MoveTowards(currentSpeed, 0, acceleration * 0.5f * Time.deltaTime);

        float turn = steerInput * turnSpeed * Time.deltaTime * (isDrifting ? 1.4f : 1f);
        if (currentSpeed != 0) transform.Rotate(0, turn * Mathf.Sign(currentSpeed), 0);

        if (isDrifting) { driftTimer += Time.deltaTime; if (driftTimer > 0.5f) boostAmount = Mathf.Min(boostAmount + 30f * Time.deltaTime, maxBoost); }
        else { if (driftTimer > 1f) ActivateBoost(); driftTimer = 0; }

        Vector3 move = transform.forward * currentSpeed + Vector3.down * 9.8f;
        cc.Move(move * Time.deltaTime);
    }

    private async void ActivateBoost()
    {
        if (boostAmount <= 0) return;
        isBoosting = true;
        float duration = boostAmount / 50f;
        boostAmount = 0;
        await System.Threading.Tasks.Task.Delay((int)(duration * 1000));
        isBoosting = false;
    }
}
```

### Defold (Vehicle Controller)
```lua
-- vehicle.script — arcade model: a heading yaw + forward speed, steer turns, friction decays
go.property("max_speed", 30.0)
go.property("acceleration", 15.0)
go.property("brake_force", 25.0)
go.property("turn_speed", 3.0)
go.property("grip", 0.7)
go.property("drift_grip", 0.9)
go.property("max_boost", 100.0)
go.property("boost_multiplier", 1.5)

local MSG_BOOST_CHANGED = hash("boost_changed")

local function move_toward(value, target, max_delta)
	if math.abs(target - value) <= max_delta then return target end
	return value + (target > value and max_delta or -max_delta)
end

function init(self)
	msg.post(".", "acquire_input_focus")
	self.speed = 0.0
	self.heading = 0.0            -- yaw in radians
	self.throttle = 0.0
	self.steer = 0.0
	self.drifting = false
	self.drift_timer = 0.0
	self.boost = 0.0
	self.boosting = false
	self.boost_left = 0.0
end

function final(self)
	msg.post(".", "release_input_focus")
end

function update(self, dt)
	local target = self.max_speed * (self.boosting and self.boost_multiplier or 1.0)
	if self.throttle > 0 then
		self.speed = move_toward(self.speed, target, self.acceleration * dt)
	elseif self.throttle < 0 then
		self.speed = move_toward(self.speed, -self.max_speed * 0.3, self.brake_force * dt)
	else
		self.speed = move_toward(self.speed, 0, self.acceleration * 0.5 * dt)
	end

	local turn = self.steer * self.turn_speed * dt
	if self.drifting then
		turn = turn * 1.4
		self.drift_timer = self.drift_timer + dt
		if self.drift_timer > 0.5 then
			self.boost = math.min(self.boost + 30.0 * dt, self.max_boost)
			msg.post("#hud", MSG_BOOST_CHANGED, { current = self.boost, max = self.max_boost })
		end
	else
		if self.drift_timer > 1.0 and self.boost > 0 then
			self.boosting = true
			self.boost_left = self.boost / 50.0
			self.boost = 0.0
			msg.post("#hud", MSG_BOOST_CHANGED, { current = 0, max = self.max_boost })
		end
		self.drift_timer = 0.0
	end

	if self.speed ~= 0 then
		self.heading = self.heading + turn * (self.speed >= 0 and 1 or -1)
	end

	if self.boosting then
		self.boost_left = self.boost_left - dt
		if self.boost_left <= 0 then self.boosting = false end
	end

	-- heading drives a forward vector; grip blends the previous direction (drift slip)
	local forward = vmath.vector3(math.sin(self.heading), 0, math.cos(self.heading))
	local pos = go.get_position() + forward * self.speed * dt
	go.set_position(pos)
	go.set_rotation(vmath.quat_rotation_y(self.heading))
end

function on_input(self, action_id, action)
	if action_id == hash("accelerate") then
		self.throttle = action.value
	elseif action_id == hash("brake") then
		self.throttle = -action.value
	elseif action_id == hash("steer_right") then
		self.steer = action.value
	elseif action_id == hash("steer_left") then
		self.steer = -action.value
	elseif action_id == hash("drift") then
		self.drifting = action.value > 0 and math.abs(self.steer) > 0.3
	end
end
```

### Track/Lap System
```gdscript
class_name TrackSystem
extends Node3D

signal race_started
signal lap_completed(racer_id: String, lap: int, lap_time: float)
signal race_finished(racer_id: String, total_time: float, position: int)

@export var total_laps: int = 3
@export var checkpoint_count: int = 0  # Auto-counted from children

var racers: Dictionary = {}  # id -> {lap, checkpoint, total_time, lap_time, finished}
var checkpoints: Array[Area3D] = []
var finish_order: Array[String] = []

func _ready() -> void:
    # Collect checkpoints
    for child in get_children():
        if child is Area3D and child.is_in_group("checkpoint"):
            checkpoints.append(child)
            child.body_entered.connect(_on_checkpoint.bind(checkpoints.size() - 1))
    checkpoint_count = checkpoints.size()

func register_racer(id: String) -> void:
    racers[id] = {"lap": 0, "checkpoint": 0, "total_time": 0.0, "lap_time": 0.0, "finished": false}

func _process(delta: float) -> void:
    for id in racers:
        if not racers[id].finished:
            racers[id].total_time += delta
            racers[id].lap_time += delta

func _on_checkpoint(body: Node3D, checkpoint_index: int) -> void:
    var id: String = body.get_meta("racer_id", "")
    if id == "" or id not in racers:
        return

    var racer: Dictionary = racers[id]

    # Must hit checkpoints in order
    if checkpoint_index == racer.checkpoint:
        racer.checkpoint += 1

        # Crossed finish line (checkpoint 0 after all others)
        if racer.checkpoint >= checkpoint_count:
            racer.checkpoint = 0
            racer.lap += 1
            var lap_time: float = racer.lap_time
            racer.lap_time = 0.0
            lap_completed.emit(id, racer.lap, lap_time)

            if racer.lap >= total_laps:
                racer.finished = true
                finish_order.append(id)
                race_finished.emit(id, racer.total_time, finish_order.size())

func get_position(racer_id: String) -> int:
    # Calculate race position based on lap and checkpoint progress
    var sorted_racers: Array = racers.keys()
    sorted_racers.sort_custom(func(a: String, b: String) -> bool:
        var ra: Dictionary = racers[a]
        var rb: Dictionary = racers[b]
        if ra.lap != rb.lap:
            return ra.lap > rb.lap
        return ra.checkpoint > rb.checkpoint
    )
    return sorted_racers.find(racer_id) + 1

func start_race() -> void:
    race_started.emit()
```

### Defold (Track/Lap System)
```lua
-- track.script — checkpoints must be hit in order; finish line increments laps
-- each checkpoint is a trigger collision object that posts its index here
go.property("total_laps", 3)
go.property("checkpoint_count", 8)

local MSG_LAP_COMPLETED = hash("lap_completed")
local MSG_RACE_FINISHED = hash("race_finished")

local function ensure(self, id)
	if not self.racers[id] then
		self.racers[id] = { lap = 0, checkpoint = 0, total_time = 0.0, lap_time = 0.0, finished = false }
	end
	return self.racers[id]
end

function init(self)
	self.racers = {}
	self.finish_order = {}
	self.running = false
end

function update(self, dt)
	if not self.running then return end
	for _, r in pairs(self.racers) do
		if not r.finished then
			r.total_time = r.total_time + dt
			r.lap_time = r.lap_time + dt
		end
	end
end

function on_message(self, message_id, message, sender)
	if message_id == hash("start_race") then
		self.running = true
	elseif message_id == hash("register_racer") then
		ensure(self, message.racer_id)
	elseif message_id == hash("checkpoint_hit") then
		local r = ensure(self, message.racer_id)
		if r.finished or message.index ~= r.checkpoint then return end   -- enforce order
		r.checkpoint = r.checkpoint + 1
		if r.checkpoint >= self.checkpoint_count then
			r.checkpoint = 0
			r.lap = r.lap + 1
			msg.post("#hud", MSG_LAP_COMPLETED, { racer = message.racer_id, lap = r.lap, time = r.lap_time })
			r.lap_time = 0.0
			if r.lap >= self.total_laps then
				r.finished = true
				table.insert(self.finish_order, message.racer_id)
				msg.post("#hud", MSG_RACE_FINISHED, {
					racer = message.racer_id, total = r.total_time, position = #self.finish_order,
				})
			end
		end
	end
end
```

### AI Racer
```gdscript
class_name AIRacer
extends RacingVehicle

@export var skill_level: float = 0.8  # 0-1, affects speed and accuracy
@export var path: Path3D

var path_follow: PathFollow3D
var target_offset: float = 0.0
var rubber_band_speed: float = 1.0

func _ready() -> void:
    super._ready()
    if path:
        path_follow = PathFollow3D.new()
        path.add_child(path_follow)

func _physics_process(delta: float) -> void:
    if path_follow == null:
        return

    # Advance along path
    target_offset += current_speed * delta * rubber_band_speed
    path_follow.progress = target_offset

    # Steer toward next path point
    var target_pos: Vector3 = path_follow.global_position
    var to_target: Vector3 = (target_pos - global_position).normalized()
    var forward: Vector3 = -transform.basis.z

    var cross: float = forward.cross(to_target).y
    steer_input = clampf(cross * 2.0, -1.0, 1.0)

    # Speed based on skill
    current_speed = move_toward(current_speed, max_speed * skill_level, acceleration * delta)

    # Apply movement
    if current_speed != 0:
        rotate_y(steer_input * turn_speed * delta)
    var vel: Vector3 = -transform.basis.z * current_speed
    vel.y -= 9.8 * delta
    velocity = vel
    move_and_slide()

func set_rubber_band(player_position: int, my_position: int) -> void:
    # Slow down if ahead, speed up if behind
    if my_position < player_position:
        rubber_band_speed = 0.85
    elif my_position > player_position:
        rubber_band_speed = 1.15
    else:
        rubber_band_speed = 1.0
```

### Defold (AI Racer)
```lua
-- ai_racer.script — steers toward the next waypoint, rubber-bands to stay competitive
go.property("max_speed", 30.0)
go.property("acceleration", 15.0)
go.property("turn_speed", 3.0)
go.property("skill_level", 0.8)        -- 0..1

local function move_toward(value, target, max_delta)
	if math.abs(target - value) <= max_delta then return target end
	return value + (target > value and max_delta or -max_delta)
end

function init(self)
	-- waypoints: a plain list of vmath.vector3, set via "set_waypoints"
	self.waypoints = {}
	self.target_index = 1
	self.speed = 0.0
	self.heading = 0.0
	self.rubber_band = 1.0
end

function update(self, dt)
	local node = self.waypoints[self.target_index]
	if not node then return end

	local here = go.get_position()
	if vmath.length(node - here) < 2.0 then
		self.target_index = self.target_index % #self.waypoints + 1
		node = self.waypoints[self.target_index]
	end

	-- steer: signed angle between current heading and the direction to the waypoint
	local to_target = vmath.normalize(node - here)
	local forward = vmath.vector3(math.sin(self.heading), 0, math.cos(self.heading))
	local cross = forward.z * to_target.x - forward.x * to_target.z
	local steer = math.max(-1.0, math.min(1.0, cross * 2.0))

	self.speed = move_toward(self.speed, self.max_speed * self.skill_level * self.rubber_band, self.acceleration * dt)
	if self.speed ~= 0 then
		self.heading = self.heading + steer * self.turn_speed * dt
	end

	go.set_position(here + forward * self.speed * dt)
	go.set_rotation(vmath.quat_rotation_y(self.heading))
end

function on_message(self, message_id, message, sender)
	if message_id == hash("set_waypoints") then
		self.waypoints = message.points
	elseif message_id == hash("set_rubber_band") then
		-- slow if ahead of the player, speed up if behind
		if message.my_position < message.player_position then
			self.rubber_band = 0.85
		elseif message.my_position > message.player_position then
			self.rubber_band = 1.15
		else
			self.rubber_band = 1.0
		end
	end
end
```

---

## Level Structure

```
RaceTrack (Node3D)
├── WorldEnvironment
├── TrackSystem
├── Track Geometry
│   ├── Road mesh
│   ├── Barriers/walls
│   └── Scenery
├── Checkpoints (Area3D)
│   ├── StartFinish
│   ├── Checkpoint1..N
├── Path3D (AI racing line)
├── SpawnPoints
│   ├── Grid positions
├── Player Vehicle
├── AI Racers
├── Items/PowerUps (kart racer)
└── UI
    ├── Speedometer
    ├── Minimap
    ├── Lap counter
    └── Position display
```

---

## Customization Options

**Sub-Genre**:
- Kart (Mario Kart)
- Arcade (Need for Speed)
- Simulation (Gran Turismo)
- Endless Runner (Temple Run)

**Camera**:
- Third-person chase cam
- Bumper cam
- Top-down

**Features**:
- Drift + boost
- Items/power-ups (kart)
- Vehicle customization
- Split-screen multiplayer
- Online leaderboards

---

**Remember**: Racing games need tight controls, a sense of speed (motion blur, FOV changes, particles), fair AI opponents, and satisfying drift mechanics. Camera work is critical - use dynamic FOV and smooth follow.
