# Defold 1.9+ — UI Reference

> Pinned to Defold 1.9+. Verify anything newer against https://defold.com/manuals/ and https://defold.com/ref/stable/.

## Core types & entry points
- A **GUI scene** (`.gui`) holds GUI nodes; driven by an attached **GUI script** (`.gui_script`).
- Node types: **box**, **text**, **pie**, **template**, **particlefx**; created in the editor or via `gui.new_*_node`.
- `gui.get_node("id")` to reference a node; `gui.set_text`, `gui.set_position`, `gui.set_color`, `gui.animate`.
- Templates instance reusable sub-trees; node ids are prefixed (`"template/child"`).
- Layouts adapt nodes to different screen orientations/resolutions.
- GUI script callbacks mirror normal scripts: `init`, `update`, `on_input`, `on_message`.

## Common tasks
Update a text node:
```lua
function init(self)
    self.score = 0
    msg.post(".", "acquire_input_focus")
end

function on_message(self, message_id, message, sender)
    if message_id == hash("add_score") then
        self.score = self.score + message.amount
        gui.set_text(gui.get_node("score"), "Score: " .. self.score)
    end
end
```

Button hit-testing in on_input:
```lua
function on_input(self, action_id, action)
    if action_id == hash("touch") and action.pressed then
        local btn = gui.get_node("start_button")
        if gui.pick_node(btn, action.x, action.y) then
            msg.post("/game#script", "start")
        end
    end
end
```

Animate a GUI node:
```lua
local n = gui.get_node("popup")
gui.animate(n, gui.PROP_SCALE, vmath.vector3(1, 1, 1),
    gui.EASING_OUTBACK, 0.3)
```

## Gotchas
- GUI uses its own coordinate space and node tree — `gui.get_node` works only inside the `.gui_script` attached to that scene.
- Must `acquire_input_focus` before `on_input` fires for the GUI.
- `gui.pick_node(node, x, y)` does hit-testing for buttons (there's no built-in Button widget).
- Template child ids are namespaced: `gui.get_node("my_template/label")`.
- GUI animation uses `gui.animate` with `gui.PROP_*` and `gui.EASING_*` constants (distinct from `go.animate`).

## See also
- `defold-patterns` skill, `defold-style` rule, `defold-specialist` agent
- guides/ for cross-engine architecture patterns
