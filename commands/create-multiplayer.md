---
description: Add multiplayer to your game with lobby system, player synchronization, and networking. Supports P2P, client-server, and relay models.
---

# Create Multiplayer Command

## What This Command Does

Adds multiplayer networking to your game:
- ✅ Lobby system (create, join, ready-up)
- ✅ Player spawning and synchronization
- ✅ State replication (position, health, score)
- ✅ Chat system (text, optional voice)
- ✅ Lag compensation (interpolation, prediction)
- ✅ Disconnect handling and reconnection

## How It Works

1. **Ask customization questions**:
   - Multiplayer type (Local split-screen, Online co-op, PvP, MMO)
   - Network model (Client-server, P2P, Relay)
   - Player count (2, 4, 8, 16+)
   - What to sync (Position, Health, Inventory, World state)
   - Engine (Godot, Unity, Unreal)

2. **Generate networking layer**

3. **Create lobby UI**

4. **Set up synchronization**

## Multiplayer Types

### Local Split-Screen
- Multiple viewports
- Shared input device mapping
- No networking needed

### Online Co-op (2-4 players)
- Client-server or P2P
- Lobby with invite codes
- Sync player actions and world state

### Online PvP
- Dedicated server recommended
- Anti-cheat considerations
- Ranked matchmaking (optional)

### MMO-Lite (8-64 players)
- Dedicated server required
- Area-of-interest filtering
- Persistent world state

## Boilerplate Code

### Godot — Lobby System
```gdscript
class_name Lobby
extends Node

signal player_connected(id: int)
signal player_disconnected(id: int)

const PORT: int = 7000
const MAX_PLAYERS: int = 4

var players: Dictionary = {}  # id -> {name, ready}

func host_game() -> void:
    var peer := ENetMultiplayerPeer.new()
    peer.create_server(PORT, MAX_PLAYERS)
    multiplayer.multiplayer_peer = peer
    multiplayer.peer_connected.connect(_on_peer_connected)
    multiplayer.peer_disconnected.connect(_on_peer_disconnected)
    _register_player(1, "Host")

func join_game(address: String) -> void:
    var peer := ENetMultiplayerPeer.new()
    peer.create_client(address, PORT)
    multiplayer.multiplayer_peer = peer

@rpc("any_peer", "reliable")
func _register_player(id: int, player_name: String) -> void:
    players[id] = {"name": player_name, "ready": false}
    player_connected.emit(id)

func _on_peer_connected(id: int) -> void:
    _register_player.rpc_id(id, multiplayer.get_unique_id(), "Player")

func _on_peer_disconnected(id: int) -> void:
    players.erase(id)
    player_disconnected.emit(id)
```

### Godot — Player Sync
```gdscript
class_name NetworkPlayer
extends CharacterBody3D

@export var speed: float = 5.0

func _physics_process(delta: float) -> void:
    if is_multiplayer_authority():
        var input := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
        velocity = Vector3(input.x, 0, input.y) * speed
        move_and_slide()

@rpc("authority", "unreliable_ordered")
func sync_position(pos: Vector3, vel: Vector3) -> void:
    global_position = pos
    velocity = vel
```

### Unity Note
For Unity, use **Netcode for GameObjects** (`com.unity.netcode.gameobjects`). Key classes: `NetworkManager`, `NetworkObject`, `NetworkVariable<T>`, `ServerRpc`/`ClientRpc` attributes.

## Files Created

```
src/
├── networking/
│   ├── Lobby.gd             # Lobby create/join/ready
│   ├── NetworkManager.gd    # Connection handling
│   └── PlayerSync.gd        # Position/state replication
├── ui/
│   └── LobbyUI.gd           # Player list, ready button
└── scenes/
    └── network_player.tscn   # Synced player prefab
```

---

**Add multiplayer!** Run `/create-multiplayer` and choose your model.
