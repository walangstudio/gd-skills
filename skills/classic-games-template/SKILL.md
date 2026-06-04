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

### Defold

The board is a plain Lua 2D table inside a controller script. Cell changes, line clears, and a full board are reported as messages so the renderer (a tilemap or pooled tile factory) reacts without reaching into this script. Dimensions are `go.property`. This is the Tetris/Snake grid model.

```lua
go.property("width", 10)
go.property("height", 20)
go.property("cell_size", 32)

local MSG_CELL_CHANGED = hash("cell_changed")
local MSG_LINE_CLEARED = hash("line_cleared")

local function clear_board(self)
	self.grid = {}
	for y = 1, self.height do
		self.grid[y] = {}
		for x = 1, self.width do
			self.grid[y][x] = 0
		end
	end
end

local function is_valid(self, x, y)
	return x >= 1 and x <= self.width and y >= 1 and y <= self.height
end

function init(self)
	clear_board(self)
end

local function set_cell(self, x, y, value)
	if not is_valid(self, x, y) then return end
	self.grid[y][x] = value
	msg.post("#", MSG_CELL_CHANGED, { x = x, y = y, value = value })
end

local function get_cell(self, x, y)
	if is_valid(self, x, y) then return self.grid[y][x] end
	return -1
end

local function is_empty(self, x, y)
	return is_valid(self, x, y) and self.grid[y][x] == 0
end

local function check_full_rows(self)
	local full_rows = {}
	for y = 1, self.height do
		local full = true
		for x = 1, self.width do
			if self.grid[y][x] == 0 then full = false break end
		end
		if full then table.insert(full_rows, y) end
	end
	return full_rows
end

local function clear_row(self, row)
	table.remove(self.grid, row)
	local new_row = {}
	for x = 1, self.width do new_row[x] = 0 end
	table.insert(self.grid, 1, new_row)
	msg.post("#", MSG_LINE_CLEARED, { row = row })
end

local function grid_to_world(self, x, y)
	return vmath.vector3((x - 1) * self.cell_size, (y - 1) * self.cell_size, 0)
end

function on_message(self, message_id, message, sender)
	if message_id == hash("set_cell") then
		set_cell(self, message.x, message.y, message.value)
	elseif message_id == hash("clear_row") then
		clear_row(self, message.row)
	elseif message_id == hash("query_cell") then
		msg.post(sender, "cell_value", { x = message.x, y = message.y, value = get_cell(self, message.x, message.y) })
	elseif message_id == hash("check_full_rows") then
		msg.post(sender, "full_rows", { rows = check_full_rows(self) })
	elseif message_id == hash("clear_board") then
		clear_board(self)
	end
end
```

A Snake variant reuses this grid: the head advances one cell per tick (`dt` accumulated to a step timer), self-collision is a value lookup, and food is a random empty cell.

```lua
go.property("step_time", 0.15)

local DIRS = { up = { x = 0, y = 1 }, down = { x = 0, y = -1 },
	left = { x = -1, y = 0 }, right = { x = 1, y = 0 } }

function init(self)
	msg.post(".", "acquire_input_focus")
	self.body = { { x = 5, y = 5 } }     -- head first
	self.dir = DIRS.right
	self.timer = 0
	self.grow = 0
end

function update(self, dt)
	self.timer = self.timer + dt
	if self.timer < self.step_time then return end
	self.timer = self.timer - self.step_time

	local head = self.body[1]
	local nx, ny = head.x + self.dir.x, head.y + self.dir.y
	for _, seg in ipairs(self.body) do
		if seg.x == nx and seg.y == ny then
			msg.post("#", "game_over")
			return
		end
	end
	table.insert(self.body, 1, { x = nx, y = ny })
	if self.grow > 0 then self.grow = self.grow - 1 else table.remove(self.body) end
end

function on_input(self, action_id, action)
	if action.pressed then
		if action_id == hash("up") and self.dir ~= DIRS.down then self.dir = DIRS.up
		elseif action_id == hash("down") and self.dir ~= DIRS.up then self.dir = DIRS.down
		elseif action_id == hash("left") and self.dir ~= DIRS.right then self.dir = DIRS.left
		elseif action_id == hash("right") and self.dir ~= DIRS.left then self.dir = DIRS.right
		end
	end
end

function final(self)
	msg.post(".", "release_input_focus")
end
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

### Defold

Score, combo, and level are plain self fields. The combo timer decays with `dt` in `update`. High score persists with `sys.save`/`sys.load`. Changes are broadcast as messages for the HUD.

```lua
local MSG_SCORE = hash("score_changed")
local MSG_COMBO = hash("combo_changed")
local MSG_HIGH = hash("high_score_beaten")
local MSG_LEVEL_UP = hash("level_up")

local LINE_POINTS = { [0] = 0, 100, 300, 500, 800 }

local function high_score_path()
	return sys.get_save_file("classicgame", "highscore")
end

function init(self)
	self.score = 0
	self.combo = 0
	self.combo_timer = 0
	self.level = 1
	self.lines_to_next = 10
	local data = sys.load(high_score_path())
	self.high_score = data.high or 0
end

local function add_score(self, points)
	self.score = self.score + points * (1 + self.combo)
	msg.post("#", MSG_SCORE, { score = self.score })
	if self.score > self.high_score then
		self.high_score = self.score
		msg.post("#", MSG_HIGH, { high = self.high_score })
		sys.save(high_score_path(), { high = self.high_score })
	end
end

local function add_combo(self)
	self.combo = self.combo + 1
	self.combo_timer = 2.0
	msg.post("#", MSG_COMBO, { combo = self.combo })
end

local function add_lines(self, count)
	add_score(self, LINE_POINTS[math.min(count, 4)] * self.level)
	self.lines_to_next = self.lines_to_next - count
	if self.lines_to_next <= 0 then
		self.level = self.level + 1
		self.lines_to_next = self.lines_to_next + 10
		msg.post("#", MSG_LEVEL_UP, { level = self.level })
	end
end

function update(self, dt)
	if self.combo > 0 then
		self.combo_timer = self.combo_timer - dt
		if self.combo_timer <= 0 then
			self.combo = 0
			msg.post("#", MSG_COMBO, { combo = 0 })
		end
	end
end

function on_message(self, message_id, message, sender)
	if message_id == hash("add_score") then add_score(self, message.points)
	elseif message_id == hash("add_combo") then add_combo(self)
	elseif message_id == hash("add_lines") then add_lines(self, message.count)
	end
end
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

### Defold

Deck, discard, and hands are plain Lua tables of card tables. Each card is data: a suit index, a rank, and a face-up flag. Shuffle is a Fisher-Yates over the deck; draw pops the back. Events go out as messages.

```lua
local SUITS = { "hearts", "diamonds", "clubs", "spades" }
local RANK_NAMES = { "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K" }

local function create_standard_deck()
	local deck = {}
	for suit = 1, 4 do
		for rank = 1, 13 do
			table.insert(deck, { suit = suit, rank = rank, face_up = false })
		end
	end
	return deck
end

local function shuffle(deck)
	for i = #deck, 2, -1 do
		local j = math.random(i)
		deck[i], deck[j] = deck[j], deck[i]
	end
end

function init(self)
	math.randomseed(os.time())
	self.deck = create_standard_deck()
	self.discard = {}
	self.hands = {}       -- player_id -> list of cards
	shuffle(self.deck)
	msg.post("#", "deck_shuffled")
end

local function draw(self, count)
	local drawn = {}
	for _ = 1, count or 1 do
		if #self.deck == 0 then
			msg.post("#", "deck_empty")
			break
		end
		table.insert(drawn, table.remove(self.deck))
	end
	return drawn
end

local function deal(self, player_ids, cards_each)
	for _, id in ipairs(player_ids) do
		self.hands[id] = draw(self, cards_each)
	end
end

local function play_card(self, player_id, card_index)
	local hand = self.hands[player_id]
	local card = table.remove(hand, card_index)
	table.insert(self.discard, card)
	msg.post("#", "card_played", { player = player_id, card = card })
	return card
end

local function card_name(card)
	return RANK_NAMES[card.rank] .. " of " .. SUITS[card.suit]
end

function on_message(self, message_id, message, sender)
	if message_id == hash("draw") then
		local drawn = draw(self, message.count)
		msg.post(sender, "drawn", { cards = drawn })
	elseif message_id == hash("deal") then
		deal(self, message.players, message.cards_each)
	elseif message_id == hash("play_card") then
		play_card(self, message.player, message.index)
	elseif message_id == hash("shuffle") then
		shuffle(self.deck)
		msg.post("#", "deck_shuffled")
	end
end
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

### Defold

Tetromino shapes are a plain Lua table of relative cell offsets. The piece falls on a step timer (`dt` accumulated), rotation builds a new offset list normalized to non-negative coordinates, and world cells are computed for the board controller to test against and render. The lock decision is left to the board (send it the candidate cells, it replies whether the move is legal).

```lua
go.property("fall_time", 0.8)

local SHAPES = {
	I = { {0,0},{1,0},{2,0},{3,0} },
	O = { {0,0},{1,0},{0,1},{1,1} },
	T = { {0,0},{1,0},{2,0},{1,1} },
	S = { {1,0},{2,0},{0,1},{1,1} },
	Z = { {0,0},{1,0},{1,1},{2,1} },
	L = { {0,0},{0,1},{0,2},{1,2} },
	J = { {1,0},{1,1},{1,2},{0,2} },
}
local SHAPE_KEYS = { "I", "O", "T", "S", "Z", "L", "J" }

local function spawn_piece(self, shape)
	shape = shape or SHAPE_KEYS[math.random(#SHAPE_KEYS)]
	self.shape = shape
	self.cells = {}
	for _, c in ipairs(SHAPES[shape]) do
		table.insert(self.cells, { c[1], c[2] })
	end
	self.gx, self.gy = 4, 0
	self.rotation = 0
end

function init(self)
	math.randomseed(os.time())
	self.timer = 0
	spawn_piece(self)
end

local function world_cells(self)
	local out = {}
	for _, c in ipairs(self.cells) do
		table.insert(out, { x = c[1] + self.gx, y = c[2] + self.gy })
	end
	return out
end

local function rotate_cw(self)
	local rotated = {}
	for _, c in ipairs(self.cells) do
		table.insert(rotated, { c[2], -c[1] })
	end
	local min_x, min_y = math.huge, math.huge
	for _, c in ipairs(rotated) do
		min_x = math.min(min_x, c[1])
		min_y = math.min(min_y, c[2])
	end
	for _, c in ipairs(rotated) do
		c[1], c[2] = c[1] - min_x, c[2] - min_y
	end
	return rotated
end

local function apply_rotation(self, new_cells)
	self.cells = new_cells
	self.rotation = (self.rotation + 1) % 4
	msg.post("#", "piece_rotated")
end

function update(self, dt)
	self.timer = self.timer + dt
	if self.timer >= self.fall_time then
		self.timer = 0
		self.gy = self.gy + 1
		-- ask the board whether this position is legal; it replies "fall_result"
		msg.post("/board#controller", "test_cells", { cells = world_cells(self), owner = msg.url() })
	end
end

function on_message(self, message_id, message, sender)
	if message_id == hash("move") then
		self.gx = self.gx + message.dx
		self.gy = self.gy + message.dy
	elseif message_id == hash("rotate") then
		apply_rotation(self, rotate_cw(self))
	elseif message_id == hash("fall_result") then
		if not message.legal then
			self.gy = self.gy - 1   -- revert, board locks and spawns next
			msg.post("/board#controller", "lock_piece", { cells = world_cells(self) })
			spawn_piece(self)
		end
	end
end
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
