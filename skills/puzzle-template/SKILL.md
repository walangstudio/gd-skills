---
name: puzzle-template
description: Puzzle game template with grid mechanics, level progression, undo system, and multiple puzzle types. Use for games like Portal, Baba Is You, The Witness, or Sokoban.
---

# Puzzle Template

Production-ready puzzle game template with grid logic, level management, and puzzle mechanics.

## When to Use

- Creating puzzle or logic games
- Need grid-based movement and rules
- Want level progression with star ratings
- Building physics or spatial puzzles

## Sub-Genres Supported

1. **Sokoban/Push** (Baba Is You, Stephen's Sausage Roll) - Push blocks to targets
2. **Physics** (Portal, Cut the Rope) - Physics-based solutions
3. **Pattern** (The Witness, Nonogram) - Discover and apply rules
4. **Match** (Candy Crush, Bejeweled) - Match-3 or pattern matching
5. **Spatial** (Tetris Effect, Unpacking) - Spatial reasoning

## Core Features

### Player Controller
Grid-based or free movement depending on sub-genre:
- **Grid**: Tile-by-tile, turn-based input
- **Physics**: Real-time point-and-click or WASD
- **Match**: Mouse drag and click

---

## Puzzle-Specific Systems

### Grid Puzzle Engine
```gdscript
class_name PuzzleGrid
extends Node2D

signal move_made(entity: String, from: Vector2i, to: Vector2i)
signal puzzle_solved
signal move_undone

@export var width: int = 8
@export var height: int = 8
@export var cell_size: float = 64.0

var grid: Array = []  # grid[y][x] = Array of entity IDs
var entities: Dictionary = {}  # id -> {type, pos, properties}
var move_history: Array[Dictionary] = []

func _ready() -> void:
    clear_grid()

func clear_grid() -> void:
    grid.clear()
    for y in range(height):
        grid.append([])
        for x in range(width):
            grid[y].append([])

func add_entity(id: String, type: String, pos: Vector2i, properties: Dictionary = {}) -> void:
    entities[id] = {"type": type, "pos": pos, "properties": properties}
    grid[pos.y][pos.x].append(id)

func move_entity(id: String, direction: Vector2i) -> bool:
    var entity: Dictionary = entities[id]
    var from: Vector2i = entity.pos
    var to: Vector2i = from + direction

    if not is_valid(to):
        return false
    if not can_move_to(id, to, direction):
        return false

    # Record for undo
    var move_record := {"moves": []}

    # Push chain (Sokoban-style)
    var push_chain: Array = get_push_chain(id, direction)
    for pushed_id in push_chain:
        var pushed: Dictionary = entities[pushed_id]
        var pushed_from: Vector2i = pushed.pos
        var pushed_to: Vector2i = pushed_from + direction
        execute_move(pushed_id, pushed_from, pushed_to)
        move_record.moves.append({"id": pushed_id, "from": pushed_from, "to": pushed_to})

    # Move the entity itself
    execute_move(id, from, to)
    move_record.moves.append({"id": id, "from": from, "to": to})

    move_history.append(move_record)
    move_made.emit(id, from, to)
    check_solved()
    return true

func execute_move(id: String, from: Vector2i, to: Vector2i) -> void:
    grid[from.y][from.x].erase(id)
    grid[to.y][to.x].append(id)
    entities[id].pos = to

func undo() -> void:
    if move_history.is_empty():
        return
    var record: Dictionary = move_history.pop_back()
    # Reverse moves in reverse order
    for i in range(record.moves.size() - 1, -1, -1):
        var m: Dictionary = record.moves[i]
        execute_move(m.id, m.to, m.from)
    move_undone.emit()

func get_push_chain(pusher_id: String, direction: Vector2i) -> Array:
    var chain: Array = []
    var check_pos: Vector2i = entities[pusher_id].pos + direction
    while is_valid(check_pos):
        var occupants: Array = grid[check_pos.y][check_pos.x]
        var pushable_found := false
        for occ_id in occupants:
            if entities[occ_id].properties.get("pushable", false):
                chain.append(occ_id)
                pushable_found = true
                break
            elif entities[occ_id].properties.get("solid", false):
                return []  # Blocked
        if not pushable_found:
            break
        check_pos += direction
    return chain

func can_move_to(id: String, pos: Vector2i, direction: Vector2i) -> bool:
    if not is_valid(pos):
        return false
    for occ_id in grid[pos.y][pos.x]:
        var occ: Dictionary = entities[occ_id]
        if occ.properties.get("solid", false) and not occ.properties.get("pushable", false):
            return false
        if occ.properties.get("pushable", false):
            var next: Vector2i = pos + direction
            if not is_valid(next) or not can_move_to(occ_id, next, direction):
                return false
    return true

func check_solved() -> void:
    # Check if all targets have boxes on them
    for id in entities:
        var e: Dictionary = entities[id]
        if e.type == "target":
            var has_box := false
            for occ_id in grid[e.pos.y][e.pos.x]:
                if entities[occ_id].type == "box":
                    has_box = true
                    break
            if not has_box:
                return
    puzzle_solved.emit()

func is_valid(pos: Vector2i) -> bool:
    return pos.x >= 0 and pos.x < width and pos.y >= 0 and pos.y < height

func grid_to_world(pos: Vector2i) -> Vector2:
    return Vector2(pos.x * cell_size, pos.y * cell_size)
```

### Unity C# — Grid Puzzle Engine
```csharp
public class PuzzleGrid : MonoBehaviour
{
    public event System.Action PuzzleSolved;
    public event System.Action MoveUndone;

    [SerializeField] private int width = 8, height = 8;
    [SerializeField] private float cellSize = 1f;

    private readonly Dictionary<string, (string type, Vector2Int pos, Dictionary<string, bool> props)> entities = new();
    private List<string>[][] grid;
    private readonly Stack<List<(string id, Vector2Int from, Vector2Int to)>> moveHistory = new();

    private void Awake() => ClearGrid();

    public void ClearGrid()
    {
        grid = new List<string>[height][];
        for (int y = 0; y < height; y++)
        {
            grid[y] = new List<string>[width];
            for (int x = 0; x < width; x++) grid[y][x] = new List<string>();
        }
    }

    public void AddEntity(string id, string type, Vector2Int pos, Dictionary<string, bool> props = null)
    {
        entities[id] = (type, pos, props ?? new Dictionary<string, bool>());
        grid[pos.y][pos.x].Add(id);
    }

    public bool MoveEntity(string id, Vector2Int direction)
    {
        var (_, from, _) = entities[id];
        var to = from + direction;
        if (!IsValid(to)) return false;

        var record = new List<(string, Vector2Int, Vector2Int)>();
        // Push chain (Sokoban-style)
        var chain = GetPushChain(id, direction);
        if (chain == null) return false;
        foreach (string pushed in chain)
        {
            var pFrom = entities[pushed].pos;
            var pTo = pFrom + direction;
            ExecuteMove(pushed, pFrom, pTo);
            record.Add((pushed, pFrom, pTo));
        }
        ExecuteMove(id, from, to);
        record.Add((id, from, to));
        moveHistory.Push(record);
        CheckSolved();
        return true;
    }

    public void Undo()
    {
        if (moveHistory.Count == 0) return;
        var record = moveHistory.Pop();
        for (int i = record.Count - 1; i >= 0; i--)
            ExecuteMove(record[i].id, record[i].to, record[i].from);
        MoveUndone?.Invoke();
    }

    private void ExecuteMove(string id, Vector2Int from, Vector2Int to)
    {
        grid[from.y][from.x].Remove(id);
        grid[to.y][to.x].Add(id);
        var e = entities[id]; e.pos = to; entities[id] = e;
    }

    private List<string> GetPushChain(string pusherId, Vector2Int dir)
    {
        var chain = new List<string>();
        var check = entities[pusherId].pos + dir;
        while (IsValid(check))
        {
            bool found = false;
            foreach (string occ in grid[check.y][check.x])
            {
                if (entities[occ].props.GetValueOrDefault("pushable")) { chain.Add(occ); found = true; break; }
                if (entities[occ].props.GetValueOrDefault("solid")) return null;
            }
            if (!found) break;
            check += dir;
        }
        return chain;
    }

    private void CheckSolved()
    {
        foreach (var (id, (type, pos, _)) in entities)
        {
            if (type != "target") continue;
            if (!grid[pos.y][pos.x].Exists(occ => entities[occ].type == "box")) return;
        }
        PuzzleSolved?.Invoke();
    }

    private bool IsValid(Vector2Int p) => p.x >= 0 && p.x < width && p.y >= 0 && p.y < height;
    public Vector3 GridToWorld(Vector2Int p) => new(p.x * cellSize, p.y * cellSize, 0);
}
```

### Level Manager
```gdscript
class_name PuzzleLevelManager
extends Node

signal level_loaded(level_num: int)
signal level_completed(level_num: int, stars: int, moves: int)
signal all_levels_completed

var current_level: int = 0
var total_levels: int = 50
var level_data: Array[Dictionary] = []
var completion: Dictionary = {}  # level_num -> {completed, stars, best_moves}

const SAVE_PATH := "user://puzzle_progress.save"

func _ready() -> void:
    load_progress()

func load_level(level_num: int) -> Dictionary:
    current_level = level_num
    level_loaded.emit(level_num)
    return level_data[level_num]

func complete_level(moves: int) -> void:
    var par_moves: int = level_data[current_level].get("par", 20)
    var stars: int = 3 if moves <= par_moves else (2 if moves <= par_moves * 1.5 else 1)

    var prev: Dictionary = completion.get(str(current_level), {"completed": false, "stars": 0, "best_moves": 9999})
    completion[str(current_level)] = {
        "completed": true,
        "stars": maxi(prev.stars, stars),
        "best_moves": mini(prev.best_moves, moves)
    }

    level_completed.emit(current_level, stars, moves)
    save_progress()

    if current_level >= total_levels - 1:
        all_levels_completed.emit()

func next_level() -> void:
    if current_level < total_levels - 1:
        load_level(current_level + 1)

func is_unlocked(level_num: int) -> bool:
    if level_num == 0:
        return true
    return completion.get(str(level_num - 1), {}).get("completed", false)

func get_total_stars() -> int:
    var total: int = 0
    for key in completion:
        total += completion[key].stars
    return total

func save_progress() -> void:
    var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
    if file:
        file.store_string(JSON.stringify(completion))

func load_progress() -> void:
    if FileAccess.file_exists(SAVE_PATH):
        var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
        if file:
            var json := JSON.new()
            if json.parse(file.get_as_text()) == OK:
                completion = json.data
```

---

## Level Structure

```
PuzzleGame (Node2D)
├── PuzzleLevelManager
├── CurrentLevel
│   ├── PuzzleGrid
│   ├── Entities (walls, boxes, targets, player)
│   └── Decorations
├── Camera2D (centered on grid)
├── UI
│   ├── MoveCounter
│   ├── UndoButton
│   ├── ResetButton
│   ├── LevelSelect
│   └── StarRating
└── Audio
    ├── MoveSFX
    ├── SolveSFX
    └── Music
```

---

## Customization Options

**Sub-Genre**:
- Sokoban/Push block
- Physics puzzle
- Pattern/logic
- Match-3
- Spatial reasoning

**Perspective**:
- Top-down 2D
- Side-view 2D
- First-person 3D (The Witness/Portal style)

**Features**:
- Undo/redo system
- Star ratings (1-3 per level)
- Level editor
- Daily challenges
- Hint system

---

**Remember**: Puzzle games need a clear visual language (players must understand rules at a glance), satisfying "aha!" moments, and a smooth difficulty curve. Always include undo and reset. Teach through level design, not tutorials.
