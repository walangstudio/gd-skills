# Web (Phaser / Three.js / Babylon.js) — Audio Reference

> Pinned to Phaser 3.80+, Three.js r160+, Babylon.js 7.0+. Verify anything newer against https://phaser.io/ and https://threejs.org/docs/.

## Core types & entry points
- Phaser: `this.load.audio(key, [url1, url2])` in `preload`, then `this.sound.add(key, config)` → `.play()`.
- Sound config: `{ volume, loop, rate, detune, seek, delay }`; control instances with `.play()`, `.pause()`, `.resume()`, `.stop()`, `.setVolume()`, `.setRate()`.
- Global: `this.sound.volume`, `this.sound.mute`, `this.sound.pauseOnBlur` (default true — audio stops when tab loses focus).
- Sound managers: Phaser uses Web Audio (`WebAudioSoundManager`) when available, falling back to `HTML5AudioSoundManager`. Web Audio gives precise timing, mixing, and rate control; HTML5 is for huge streaming files where decoding the whole buffer is impractical.
- Three.js: `THREE.AudioListener` (attach to camera) + `THREE.Audio` (global) / `THREE.PositionalAudio` (3D) + `THREE.AudioLoader`.
- Howler.js: standalone, engine-agnostic audio library (`new Howl({ src, loop, volume })`) — good if you're not in Phaser or want sprite-sheet audio.

## Common tasks
Load, play, and loop background music (Phaser):
```javascript
preload() {
  this.load.audio('music', ['assets/music.ogg', 'assets/music.mp3']); // browser picks a supported format
  this.load.audio('jump', 'assets/jump.wav');
}

create() {
  this.music = this.sound.add('music', { loop: true, volume: 0.4 });
  this.music.play();
  this.jumpSfx = this.sound.add('jump');
}
```

Unlock audio on the first user gesture (autoplay policy):
```javascript
this.input.once('pointerdown', () => {
  if (this.sound.locked) return; // Phaser auto-resumes on gesture, but you can gate music start here
  this.music.play();
});
// Phaser fires this.sound.once('unlocked', cb) when the context resumes
```

## Gotchas
- **Autoplay is blocked.** Browsers (Chrome/Safari/Firefox) won't start audio until a user gesture (pointer/keydown). Phaser sets `this.sound.locked = true` and emits `'unlocked'` after the first interaction — start music there, not in `create()`.
- Provide multiple formats (`.ogg` + `.mp3`/`.aac`); Safari historically lacks Ogg Vorbis support, and Phaser picks the first the browser can decode.
- `pauseOnBlur` defaults to true — audio cuts when the tab is backgrounded; set `this.sound.pauseOnBlur = false` if you want it to keep playing.
- Web Audio decodes the whole file into memory; for long music tracks consider an HTML5 sound (`{ stream: true }`-style large assets) to avoid a decode spike.
- Calling `.play()` on an already-playing one-shot restarts/overlaps depending on the manager — use a fresh `add` per overlapping SFX or check `.isPlaying`.

## See also
- `web-patterns` skill, `web-style` rule, `web-specialist` agent
- guides/ for cross-engine architecture patterns
