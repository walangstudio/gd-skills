---
description: Optimize your game's performance by finding and fixing FPS drops, memory leaks, GPU bottlenecks, and loading times.
---

# Optimize Performance Command

## What This Command Does

Profiles and optimizes your game's performance:
- ✅ CPU optimization (hot paths, algorithms, pooling)
- ✅ GPU optimization (draw calls, overdraw, shaders)
- ✅ Memory optimization (leaks, asset loading, compression)
- ✅ Loading time optimization (lazy loading, streaming)
- ✅ GC optimization (allocation reduction for C#/JS)
- ✅ Physics optimization (collision layers, spatial hashing)

## How It Works

1. **Scan codebase** for performance anti-patterns

2. **Ask about target**:
   - Target FPS (30, 60, 120)
   - Target platform (Desktop, Mobile, Console, Web)
   - Main bottleneck (CPU, GPU, Memory, Loading)

3. **Route to performance-debugger agent**

4. **Generate optimization report**

5. **Apply fixes** with user approval

## What Gets Checked

### CPU
- `_process` / `Update` complexity
- Allocation in hot paths
- Unnecessary node queries per frame
- Algorithm complexity (O(n²) loops)
- Object pooling opportunities

### GPU
- Draw call count
- Overdraw from transparency
- Shader complexity
- Shadow and light count
- Texture resolution vs display size

### Memory
- Scene/node lifecycle (freed properly?)
- Asset duplication
- Texture compression
- Audio streaming vs preloaded

### Loading
- Startup asset loading
- Scene transition loading
- Resource preloading strategy
- Thread pool utilization

---

**Optimize your game!** Run `/optimize-performance` to find and fix bottlenecks.
