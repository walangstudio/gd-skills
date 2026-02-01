# Debugging Best Practices (Cross-Engine)

## Universal Debugging Principles (CRITICAL)

### 1. Reproduce Before Fixing
**ALWAYS reproduce the bug reliably before attempting a fix**
- Document exact steps to reproduce
- Note any specific conditions (time of day, player state, etc.)
- Test on multiple sessions/builds
- Record reproduction steps in bug report

### 2. Isolate the Problem
- Use binary search: disable half the features to narrow down
- Test with minimal scene/level
- Remove recent changes one by one
- Create isolated test case

### 3. Use Engine-Specific Tools FIRST
**DO NOT** guess or add random prints everywhere

**Godot**:
- Use built-in debugger (F5 debug mode, breakpoints)
- Profiler (Debug → Profiler) for performance
- Remote debugger for testing on device

**Roblox**:
- Developer Console (F9) for errors and logs
- Script Performance window
- Memory profiler

**Unity**:
- Visual Studio debugger with breakpoints
- Unity Profiler (Window → Analysis → Profiler)
- Frame Debugger for rendering issues
- Memory Profiler

**Unreal**:
- Visual Studio debugger for C++
- Blueprint debugger for Blueprint scripts
- stat commands (stat fps, stat unit, stat memory)
- Unreal Insights for deep profiling

**Web/JavaScript**:
- Browser DevTools (F12)
- Breakpoints in Sources tab
- Performance profiler
- Memory heap snapshots

### 4. Breakpoints Over Print Statements
**Use breakpoints for complex logic, not print/console.log spam**

✅ **CORRECT**: Set breakpoint, inspect variables, step through
❌ **WRONG**: Adding `print()` everywhere and rerunning

**When to use print debugging**:
- Quick sanity checks
- Asynchronous/threaded code
- Remote/mobile testing (no debugger access)

### 5. Read Error Messages Carefully
- Read the ENTIRE error message
- Note the line number and file
- Check the stack trace (bottom-up usually most useful)
- Google the exact error message if unfamiliar

### 6. Check Obvious Things First
Before deep debugging, verify:
- [ ] Variables are initialized
- [ ] Null/undefined checks
- [ ] Array/collection bounds
- [ ] File paths exist
- [ ] Network connection active
- [ ] Correct variable scope
- [ ] Updated code is actually running (clear build cache)

## Engine-Specific Debugging

### Godot Debugging

**Breakpoints**:
```gdscript
# Set breakpoint in GDScript editor (click line number gutter)
# Run with F5 (debug mode)
# Inspector shows all variable values
```

**Print Debugging** (when necessary):
```gdscript
print("Player health: ", health)  # Standard print
push_warning("Suspicious value: ", value)  # Yellow warning
push_error("Critical issue: ", error)  # Red error
```

**Performance Profiling**:
- Debug → Profiler → Start
- Check frame time, physics time, script time
- Look for spikes (bottlenecks)
- Use Monitors tab for FPS, memory, objects

**Common Godot Issues**:
- Signal not emitted? Check if connected: `signal_name.is_connected()`
- Node not found? Use `has_node()` before `get_node()`
- Physics issues? Check collision layers/masks

### Roblox Debugging

**Output Window** (View → Output or F9):
```lua
print("Debug:", variable)  -- Standard output
warn("Warning:", issue)    -- Yellow warning
error("Error:", problem)   -- Red error (stops execution)
```

**Breakpoints**:
- Roblox Studio debugger (set breakpoints in script)
- F5 to start, F8 to toggle breakpoint

**Common Roblox Issues**:
- RemoteEvent not firing? Check FilteringEnabled
- DataStore errors? Use pcall() for error handling
- Client-server desync? Validate all client input on server

### Unity Debugging

**Visual Studio Breakpoints**:
- Attach Unity debugger (Debug → Attach Unity Debugger)
- Set breakpoints in .cs files
- Inspect variables, evaluate expressions
- Conditional breakpoints for specific cases

**Debug.Log**:
```csharp
Debug.Log("Normal message");  // White
Debug.LogWarning("Warning");  // Yellow
Debug.LogError("Error");      // Red
Debug.LogFormat("Formatted: {0}", value);  // With formatting
```

**Unity Profiler** (Window → Analysis → Profiler):
- CPU usage (scripts, rendering, physics)
- Memory usage (find leaks)
- Rendering stats (batches, vertices)
- Deep Profile for detailed script timing

**Common Unity Issues**:
- NullReferenceException? Check all public/serialized fields assigned
- Update vs FixedUpdate? Use FixedUpdate for physics
- Scene not loading? Check Build Settings → Scenes In Build

### Unreal Debugging

**Visual Studio C++ Debugging**:
- Set breakpoints in .cpp files
- Run with F5 (DebugGame configuration)
- Inspect UObject properties

**Blueprint Debugging**:
- Set breakpoints on nodes (right-click → Add Breakpoint)
- Watch values update in real-time
- Step through execution with F10

**Stat Commands** (type in console ~):
```cpp
stat fps          // Show FPS
stat unit         // Frame time breakdown
stat memory       // Memory usage
stat startfile    // Start profiling
stat stopfile     // Stop profiling
```

**Common Unreal Issues**:
- Crashes? Check for nullptr before accessing
- Replication not working? Set bReplicates = true
- Blueprint compile errors? Refresh nodes

### Web/JavaScript Debugging

**Chrome DevTools** (F12):
- Console tab for errors and logs
- Sources tab for breakpoints
- Network tab for asset loading
- Performance tab for profiling
- Memory tab for leak detection

**Console Methods**:
```javascript
console.log("Standard log");
console.warn("Warning");
console.error("Error");
console.table(arrayOfObjects);  // Table format
console.time("timer");          // Start timer
console.timeEnd("timer");       // End timer
```

## Performance Debugging

### Profile Before Optimizing
**NEVER optimize without profiling first**
1. Run profiler during typical gameplay
2. Identify the actual bottleneck
3. Optimize only the bottleneck
4. Measure improvement
5. Repeat

### Memory Leak Detection
**Signs of memory leak**:
- Memory usage increases over time
- FPS degrades gradually
- Game slows down during long sessions

**Finding leaks**:
- Take memory snapshots before/after gameplay
- Look for growing object counts
- Check for unreleased references
- Ensure despawned objects are freed

### FPS Debugging Checklist
- [ ] Profile to find bottleneck (CPU or GPU?)
- [ ] Check draw calls (too many?)
- [ ] Check physics calculations (too complex?)
- [ ] Check scripts (infinite loops, expensive operations in update?)
- [ ] Check memory (garbage collection causing stutters?)

## Common Bug Patterns

### Null/Undefined References
```gdscript
# ❌ WRONG
var player = get_node("Player")
player.health = 100  # Crashes if Player doesn't exist

# ✅ CORRECT
var player = get_node_or_null("Player")
if player:
    player.health = 100
else:
    push_error("Player node not found!")
```

### Off-by-One Errors
```python
# ❌ WRONG
for i in range(len(array)):
    if array[i+1] > array[i]:  # Crashes on last element
        ...

# ✅ CORRECT
for i in range(len(array) - 1):  # Stop before last element
    if array[i+1] > array[i]:
        ...
```

### Race Conditions (Multiplayer/Async)
- Add debug timestamps to trace event order
- Use locks/mutexes for shared data
- Check for client-server synchronization issues

## Debugging Workflow

### Step-by-Step Process
1. **Reproduce**: Get reliable reproduction steps
2. **Isolate**: Create minimal test case
3. **Hypothesize**: Form theory about the cause
4. **Test**: Add breakpoint or log to test theory
5. **Fix**: Implement fix
6. **Verify**: Confirm bug is gone
7. **Prevent**: Add checks/tests to prevent regression

### When Stuck
- Take a break (fresh eyes help)
- Explain the problem to someone else (rubber duck debugging)
- Search for similar issues online
- Check recent changes (git blame, diff)
- Ask for help (provide reproduction steps + minimal code)

## Clean Up Debug Code

Before committing:
- [ ] Remove all `print()` / `console.log()` debug statements
- [ ] Remove debug visualizations (boxes, lines)
- [ ] Remove test/debug scenes
- [ ] Re-enable any disabled systems
- [ ] Test in release build (not just debug)

## Tools Reference

| Engine | Debugger | Profiler | Memory | Network |
|--------|----------|----------|--------|---------|
| **Godot** | Built-in (F5) | Profiler tab | Monitors | Network profiler |
| **Roblox** | Studio debugger | Performance stats | Developer Console | N/A |
| **Unity** | Visual Studio | Unity Profiler | Memory Profiler | Network Profiler |
| **Unreal** | VS debugger | Unreal Insights | stat memory | Network profiler |
| **Web** | Chrome DevTools | Performance tab | Memory tab | Network tab |

---

**Remember**: The best debugging is prevention. Write defensive code with null checks, assertions, and error handling from the start.
