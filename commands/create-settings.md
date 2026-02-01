---
description: Add a settings system with audio, video, controls, and accessibility options. Includes save/load and UI screen.
---

# Create Settings Command

## What This Command Does

Adds a complete settings system with:
- ✅ Audio settings (master, music, SFX volumes)
- ✅ Video settings (resolution, fullscreen, VSync, quality)
- ✅ Controls (input rebinding)
- ✅ Accessibility (colorblind mode, text size, subtitles)
- ✅ Settings persistence (save/load)
- ✅ Settings UI screen
- ✅ Apply/revert functionality

## How It Works

1. **Ask customization questions**:
   - Which categories (Audio, Video, Controls, Accessibility)
   - Input system type (Built-in, New Input System)
   - Platform (Desktop, Mobile, Console)
   - Engine (Godot, Unity, Unreal)

2. **Generate settings manager** (autoload/singleton)

3. **Create settings UI**

4. **Wire up persistence**

## Settings Categories

### Audio
- Master volume (slider 0-100%)
- Music volume
- SFX volume
- Voice volume (if applicable)

### Video
- Resolution dropdown
- Fullscreen toggle
- VSync toggle
- Quality preset (Low/Medium/High/Ultra)
- FPS limit

### Controls
- View current bindings
- Rebind any action
- Reset to defaults
- Controller/keyboard tabs

### Accessibility
- Colorblind mode (Deuteranopia, Protanopia, Tritanopia)
- Text size (Small, Medium, Large)
- Screen shake intensity
- Subtitle toggle
- High contrast mode

---

**Add settings!** Run `/create-settings` to get started.
