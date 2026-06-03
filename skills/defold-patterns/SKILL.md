---
name: defold-patterns
description: Best practices for Defold 1.9+ development with Lua, including the component/collection/GameObject model, message passing, factories and pooling, collection proxies, Box2D physics, GUI, and data-driven objects.
---

# Defold Patterns

Production-ready patterns for Defold 1.9+ game development with Lua.

## When to Activate

- Building games in the Defold engine
- Structuring a game with collections, game objects, and components
- Communicating between objects with message passing
- Spawning or pooling objects with factories
- Setting up Box2D collisions and physics responses
- Building GUI/HUD or swapping scenes

## The Model

- **Game object** (`.go`): transform + components, no logic of its own.
- **Component**: script, sprite, collision object, factory, sound, tilemap, GUI, particles.
- **Collection** (`.collection`): a tree of game objects — Defold's "scene".
- **Addresses**: URLs like `"/level/player#script"`; string ids are hashed.
- **No inheritance**: compose with components, communicate with messages.

## Project Structure

```
mygame/
├── game.project              # config; sets bootstrap collection
├── input/
│   └── game.input_binding    # action -> key/touch mappings
├── main/
│   ├── main.collection       # bootstrap scene
│   └── main.script           # top-level controller
├── objects/
│   ├── player.go
│   ├── player.script
│   ├── enemy.go
│   └── enemy.script
├── scripts/                  # shared modules (require'd)
│   ├── math_utils.lua
│   └── game_state.lua
├── gui/
│   ├── hud.gui
│   └── hud.gui_script
└── assets/                   # atlases, sounds, fonts, tilesources
```

## Message Passing (the core idiom)

### Sending and receiving
```lua
-- Send to a specific script component
msg.post("/enemies/goblin#script", "take_damage", { amount = 25 })

-- Send to self / sibling component
msg.post(".", "acquire_input_focus")
msg.post("#sprite", "play_animation", { id = hash("run") })

-- Receive and react (always hash the id)
function on_message(self, message_id, message, sender)
	if message_id == hash("take_damage") then
		self.health = math.max(0, self.health - message.amount)
		if self.health == 0 then
			msg.post("/game#controller", "enemy_killed", { id = go.get_id() })
			go.delete()
		end
	end
end
```

### Request / reply (messages are async — delivered next frame)
```lua
-- requester
msg.post("/score#script", "get_score")

-- owner replies to the sender
function on_message(self, message_id, message, sender)
	if message_id == hash("get_score") then
		msg.post(sender, "score", { value = self.score })
	end
end
```

### Best practices
- Compare `message_id` to `hash("...")`, never a string.
- Precompute frequently-used hashes as module-level locals.
- Never reach into another object's state — send it a message instead.
- Don't assume a reply is available the same frame you posted.

## Factories: Spawning and Object Pooling

### Simple spawn
```lua
-- object has a factory component "#bulletfactory"
local id = factory.create("#bulletfactory", spawn_pos, nil, { dir = direction })
```

### Object pool (preferred for bullets / particles / enemies)
```lua
function init(self)
	self.pool = {}
	self.active = {}
	for i = 1, 50 do
		local id = factory.create("#bulletfactory", vmath.vector3(-1000, -1000, 0))
		msg.post(id, "disable")
		table.insert(self.pool, id)
	end
end

function on_message(self, message_id, message, sender)
	if message_id == hash("spawn_bullet") then
		local id = table.remove(self.pool)
		if not id then return end           -- pool exhausted, drop request
		go.set_position(message.position, id)
		msg.post(id, "enable")
		msg.post(id, "fire", { dir = message.dir })
		self.active[id] = true
	elseif message_id == hash("recycle_bullet") then
		local id = sender
		msg.post(id, "disable")
		go.set_position(vmath.vector3(-1000, -1000, 0), id)
		self.active[id] = nil
		table.insert(self.pool, id)
	end
end
```

## Collections, Proxies, and Scene Flow

### Swap scenes with a collection proxy
```lua
-- main.script holds a collection proxy "#gameplay_proxy"
function on_message(self, message_id, message, sender)
	if message_id == hash("start_game") then
		msg.post("#menu_proxy", "unload")
		msg.post("#gameplay_proxy", "load")
	elseif message_id == hash("proxy_loaded") then
		msg.post(sender, "init")
		msg.post(sender, "enable")
	end
end
```

### Collection factory (spawn a whole sub-tree, e.g. a wave or a room)
```lua
-- object has a collectionfactory component "#wavefactory"
local ids = collectionfactory.create("#wavefactory", spawn_pos)
-- ids is a table mapping the collection's instance ids to runtime ids
```

## Input

```lua
-- input/game.input_binding maps "jump" -> KEY_SPACE, "move" -> analog, etc.
function init(self)
	msg.post(".", "acquire_input_focus")   -- only objects that need input
end

function on_input(self, action_id, action)
	if action_id == hash("jump") and action.pressed then
		self.velocity.y = JUMP_VELOCITY
	elseif action_id == hash("move_right") then
		self.move = action.value            -- analog 0..1
	end
end

function final(self)
	msg.post(".", "release_input_focus")
end
```

## Box2D Physics and Collisions

```lua
-- collision object component reports contacts via messages
function on_message(self, message_id, message, sender)
	if message_id == hash("collision_response") then
		-- something in our mask touched us
		if message.other_group == hash("pickup") then
			msg.post(message.other_id, "collected")
		end
	elseif message_id == hash("contact_point_response") then
		-- manually resolve overlap for kinematic bodies
		if message.distance > 0 then
			local proj = vmath.project(self.correction, message.normal * message.distance)
			self.correction = self.correction + message.normal * message.distance
			local pos = go.get_position() + message.normal * message.distance
			go.set_position(pos)
		end
	end
end
```
- Configure **group** and **mask** on each collision object component.
- **Dynamic** bodies are moved by the physics sim; **kinematic** bodies you move and resolve yourself; **static** bodies don't move.

## GUI / HUD

```lua
-- gui/hud.gui_script
function init(self)
	self.health_node = gui.get_node("health_bar")
end

function on_message(self, message_id, message, sender)
	if message_id == hash("update_health") then
		gui.set_scale(self.health_node, vmath.vector3(message.pct, 1, 1))
	end
end

-- drive from gameplay:
-- msg.post("/hud#gui", "update_health", { pct = health / max_health })
```

## Data-Driven Objects with go.property

```lua
go.property("speed", 200)
go.property("damage", 10)
go.property("target", msg.url())            -- reference another object
go.property("tint", vmath.vector4(1,1,1,1))

function init(self)
	self.health = self.max_health           -- max_health also a go.property
end
```
Each `go.property` is editable per-instance in the editor — the idiomatic way to make objects configurable without code changes.

## Shared Code via Modules

```lua
-- scripts/game_state.lua
local M = {}
M.score = 0
function M.add_score(n) M.score = M.score + n end
return M

-- in any script
local game_state = require("scripts.game_state")
game_state.add_score(100)
```

## Save / Load

```lua
local function save(slot, data)
	local path = sys.get_save_file("mygame", slot)
	return sys.save(path, data)
end

local function load(slot)
	local path = sys.get_save_file("mygame", slot)
	return sys.load(path)     -- returns {} if nothing saved
end
```

## Common Mistakes to Avoid

### ❌ WRONG: Luau typing (that's Roblox, not Defold)
```lua
--!strict
local health: number = 100
```
### ✅ CORRECT: Plain Lua
```lua
local health = 100
```

### ❌ WRONG: Comparing message_id to a string
```lua
if message_id == "jump" then end       -- never matches
```
### ✅ CORRECT: Hash it
```lua
if message_id == hash("jump") then end
```

### ❌ WRONG: Reaching into another object
```lua
-- there is no shared self to read; this doesn't exist in Defold
local hp = some_other_object.health
```
### ✅ CORRECT: Ask via message
```lua
msg.post("/enemy#script", "take_damage", { amount = 10 })
```

### ❌ WRONG: create/delete every frame
```lua
local id = factory.create("#bulletfactory", pos)  -- ... go.delete(id) shortly after
```
### ✅ CORRECT: Pool and recycle (see Factories above)

---

**Remember**: compose with components (never inherit), pass messages (never reach in), hash every id, make objects data-driven with `go.property`, pool with factories, and keep scripts plain Lua. See also the `defold-style` rule and `defold-specialist` agent.
