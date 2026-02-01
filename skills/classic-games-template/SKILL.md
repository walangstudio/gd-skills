---
name: classic-games-template
description: Classic game templates for arcade, card, board, puzzle, and retro genres. Use for games like Tetris, Solitaire, Chess, Snake, Breakout, or Space Invaders.
---

# Classic Games Template

Production-ready templates for classic and arcade game genres.

## When to Use

- Recreating classic arcade games
- Building card or board games
- Need simple, polished game mechanics
- Rapid prototyping with proven designs

## Genres Supported

1. **Arcade** - Space Invaders, Asteroids, Pac-Man, Breakout
2. **Puzzle** - Tetris, Match-3, Minesweeper, 2048
3. **Card** - Solitaire, Poker, Blackjack, UNO
4. **Board** - Chess, Checkers, Othello, Tic-Tac-Toe
5. **Retro Action** - Snake, Pong, Frogger, Galaga

## Core Features

### Player Controller
Simple input schemes per genre:
- **Arcade**: Arrow keys + action button
- **Puzzle**: Grid movement or mouse clicks
- **Card/Board**: Mouse point-and-click, drag-and-drop

### Combat (if applicable)
**Reference**: `combat-systems` skill → Projectile combat (for shooters)

---

## Classic Game Systems

### Grid/Board System
```gdscript
class_name GameBoard
extends Node2D

signal cell_changed(x: int, y: int, value: int)
signal board_full
signal line_cleared(row: int)

@export var width: int = 10
@export var height: int = 20
@export var cell_size: float = 32.0

var grid: Array = []  # 2D array: grid[y][x]

func _ready() -> void:
    clear_board()

func clear_board() -> void:
    grid.clear()
    for y in range(height):
        grid.append([])
        for x in range(width):
            grid[y].append(0)

func set_cell(x: int, y: int, value: int) -> void:
    if is_valid(x, y):
        grid[y][x] = value
        cell_changed.emit(x, y, value)

func get_cell(x: int, y: int) -> int:
    if is_valid(x, y):
        return grid[y][x]
    return -1

func is_valid(x: int, y: int) -> bool:
    return x >= 0 and x < width and y >= 0 and y < height

func is_empty(x: int, y: int) -> bool:
    return is_valid(x, y) and grid[y][x] == 0

func check_full_rows() -> Array[int]:
    var full_rows: Array[int] = []
    for y in range(height):
        var full := true
        for x in range(width):
            if grid[y][x] == 0:
                full = false
                break
        if full:
            full_rows.append(y)
    return full_rows

func clear_row(row: int) -> void:
    grid.remove_at(row)
    grid.insert(0, [])
    for x in range(width):
        grid[0].append(0)
    line_cleared.emit(row)

func grid_to_world(x: int, y: int) -> Vector2:
    return Vector2(x * cell_size, y * cell_size)

func world_to_grid(pos: Vector2) -> Vector2i:
    return Vector2i(int(pos.x / cell_size), int(pos.y / cell_size))
```

### Unity C# — Grid/Board System
```csharp
public class GameBoard : MonoBehaviour
{
    public event System.Action<int, int, int> CellChanged;
    public event System.Action<int> LineCleared;

    [SerializeField] private int width = 10, height = 20;
    [SerializeField] private float cellSize = 1f;

    private int[,] grid;

    private void Awake() => ClearBoard();

    public void ClearBoard()
    {
        grid = new int[height, width];
    }

    public void SetCell(int x, int y, int value)
    {
        if (!IsValid(x, y)) return;
        grid[y, x] = value;
        CellChanged?.Invoke(x, y, value);
    }

    public int GetCell(int x, int y) => IsValid(x, y) ? grid[y, x] : -1;
    public bool IsValid(int x, int y) => x >= 0 && x < width && y >= 0 && y < height;
    public bool IsEmpty(int x, int y) => IsValid(x, y) && grid[y, x] == 0;

    public List<int> CheckFullRows()
    {
        var fullRows = new List<int>();
        for (int y = 0; y < height; y++)
        {
            bool full = true;
            for (int x = 0; x < width; x++) { if (grid[y, x] == 0) { full = false; break; } }
            if (full) fullRows.Add(y);
        }
        return fullRows;
    }

    public void ClearRow(int row)
    {
        for (int y = row; y > 0; y--)
            for (int x = 0; x < width; x++)
                grid[y, x] = grid[y - 1, x];
        for (int x = 0; x < width; x++) grid[0, x] = 0;
        LineCleared?.Invoke(row);
    }

    public Vector3 GridToWorld(int x, int y) => new(x * cellSize, y * cellSize, 0);
    public Vector2Int WorldToGrid(Vector3 pos) => new((int)(pos.x / cellSize), (int)(pos.y / cellSize));
}
```

### Scoring System
```gdscript
class_name ScoreSystem
extends Node

signal score_changed(new_score: int)
signal high_score_beaten(new_high: int)
signal combo_changed(combo: int)
signal level_up(new_level: int)

var score: int = 0
var high_score: int = 0
var combo: int = 0
var combo_timer: float = 0.0
var level: int = 1
var lines_to_next_level: int = 10

const SAVE_PATH := "user://highscore.save"

func _ready() -> void:
    load_high_score()

func _process(delta: float) -> void:
    if combo > 0:
        combo_timer -= delta
        if combo_timer <= 0:
            combo = 0
            combo_changed.emit(0)

func add_score(points: int) -> void:
    var multiplier: int = 1 + combo
    score += points * multiplier
    score_changed.emit(score)

    if score > high_score:
        high_score = score
        high_score_beaten.emit(high_score)
        save_high_score()

func add_combo() -> void:
    combo += 1
    combo_timer = 2.0
    combo_changed.emit(combo)

func add_lines(count: int) -> void:
    # Tetris-style scoring: more lines = exponentially more points
    var points_table: Array[int] = [0, 100, 300, 500, 800]
    var pts: int = points_table[mini(count, 4)]
    add_score(pts * level)

    lines_to_next_level -= count
    if lines_to_next_level <= 0:
        level += 1
        lines_to_next_level += 10
        level_up.emit(level)

func save_high_score() -> void:
    var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
    if file:
        file.store_32(high_score)

func load_high_score() -> void:
    if FileAccess.file_exists(SAVE_PATH):
        var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
        if file:
            high_score = file.get_32()
```

### Card System
```gdscript
class_name CardSystem
extends Node

signal card_drawn(card: Dictionary)
signal card_played(card: Dictionary)
signal deck_shuffled
signal deck_empty

enum Suit { HEARTS, DIAMONDS, CLUBS, SPADES }
enum Rank { ACE = 1, TWO, THREE, FOUR, FIVE, SIX, SEVEN, EIGHT, NINE, TEN, JACK, QUEEN, KING }

var deck: Array[Dictionary] = []
var discard: Array[Dictionary] = []
var hands: Dictionary = {}  # player_id -> Array[Dictionary]

func _ready() -> void:
    create_standard_deck()
    shuffle()

func create_standard_deck() -> void:
    deck.clear()
    for suit in Suit.values():
        for rank in Rank.values():
            deck.append({"suit": suit, "rank": rank, "face_up": false})

func shuffle() -> void:
    deck.shuffle()
    deck_shuffled.emit()

func draw(count: int = 1) -> Array[Dictionary]:
    var drawn: Array[Dictionary] = []
    for i in range(count):
        if deck.is_empty():
            deck_empty.emit()
            break
        drawn.append(deck.pop_back())
    return drawn

func deal(player_ids: Array, cards_each: int) -> void:
    for id in player_ids:
        hands[id] = draw(cards_each)

func play_card(player_id: String, card_index: int) -> Dictionary:
    var hand: Array = hands[player_id]
    var card: Dictionary = hand[card_index]
    hand.remove_at(card_index)
    discard.append(card)
    card_played.emit(card)
    return card

func get_hand(player_id: String) -> Array:
    return hands.get(player_id, [])

func card_value(card: Dictionary) -> int:
    return card.rank as int

func card_name(card: Dictionary) -> String:
    var rank_names: Array[String] = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
    var suit_names: Array[String] = ["Hearts", "Diamonds", "Clubs", "Spades"]
    return "%s of %s" % [rank_names[card.rank], suit_names[card.suit]]
```

### Piece/Tetromino System
```gdscript
class_name PieceSystem
extends Node2D

signal piece_placed
signal piece_rotated

# Standard tetromino shapes (relative cell positions)
const SHAPES: Dictionary = {
    "I": [[0,0], [1,0], [2,0], [3,0]],
    "O": [[0,0], [1,0], [0,1], [1,1]],
    "T": [[0,0], [1,0], [2,0], [1,1]],
    "S": [[1,0], [2,0], [0,1], [1,1]],
    "Z": [[0,0], [1,0], [1,1], [2,1]],
    "L": [[0,0], [0,1], [0,2], [1,2]],
    "J": [[1,0], [1,1], [1,2], [0,2]],
}

var current_shape: String
var cells: Array = []  # Current piece cell positions
var position_grid: Vector2i = Vector2i(4, 0)
var rotation_state: int = 0

func spawn_piece(shape: String = "") -> void:
    if shape == "":
        shape = SHAPES.keys()[randi() % SHAPES.size()]
    current_shape = shape
    cells = SHAPES[shape].duplicate(true)
    position_grid = Vector2i(4, 0)
    rotation_state = 0

func get_world_cells() -> Array[Vector2i]:
    var world_cells: Array[Vector2i] = []
    for cell in cells:
        world_cells.append(Vector2i(cell[0] + position_grid.x, cell[1] + position_grid.y))
    return world_cells

func rotate_cw() -> Array:
    # Rotate 90 degrees clockwise around center
    var rotated: Array = []
    for cell in cells:
        rotated.append([cell[1], -cell[0]])
    # Normalize to positive coordinates
    var min_x: int = 999
    var min_y: int = 999
    for cell in rotated:
        min_x = mini(min_x, cell[0])
        min_y = mini(min_y, cell[1])
    for cell in rotated:
        cell[0] -= min_x
        cell[1] -= min_y
    return rotated

func apply_rotation(new_cells: Array) -> void:
    cells = new_cells
    rotation_state = (rotation_state + 1) % 4
    piece_rotated.emit()

func move(dir: Vector2i) -> void:
    position_grid += dir
```

---

## Level Structure

### Arcade Game
```
ArcadeGame (Node2D)
├── GameBoard
├── Player (or Paddle/Ship)
├── Enemies/Obstacles
├── Projectiles
├── PowerUps
├── UI
│   ├── ScoreLabel
│   ├── LivesDisplay
│   └── LevelIndicator
└── Audio
    ├── SFX (blip, boom, powerup)
    └── Music (chiptune)
```

### Card/Board Game
```
CardGame (Node2D)
├── Table (background)
├── Deck (draw pile)
├── DiscardPile
├── PlayerHand
├── OpponentHand (hidden)
├── PlayArea
├── UI
│   ├── ScoreLabel
│   ├── TurnIndicator
│   └── ActionButtons
└── Audio
    ├── CardShuffle
    └── CardPlace
```

---

## Customization Options

**Genre**:
- Arcade (Space Invaders, Breakout, Pac-Man)
- Puzzle (Tetris, Match-3, 2048)
- Card (Solitaire, Poker, Blackjack)
- Board (Chess, Checkers, Tic-Tac-Toe)
- Retro Action (Snake, Pong, Frogger)

**Visual Style**:
- Pixel art retro
- Clean minimalist
- Neon/synthwave
- Hand-drawn

**Features**:
- High score leaderboard
- Difficulty progression
- Power-ups
- Multiplayer (local/online)

---

**Remember**: Classic games succeed through tight controls, clear feedback, and "just one more try" game feel. Polish the core loop before adding features. Juice (screen shake, particles, sound) makes all the difference.
