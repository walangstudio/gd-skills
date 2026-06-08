# Unity 6 — Audio Reference

> Pinned to Unity 6 (2023 LTS) / 2023.2+. Verify anything newer against https://docs.unity3d.com/.

## Core types & entry points
- `AudioListener` — the "ears"; exactly one active per scene, usually on the main camera.
- `AudioClip` — the loaded sound asset; assign to an `AudioSource.clip`.
- `AudioSource` — plays clips. `Play()`/`Stop()`/`Pause()`, `loop`, `volume`, `pitch`, `playOnAwake`.
- `PlayOneShot(clip, volume)` — fires a clip without interrupting whatever the source is already playing; ideal for overlapping SFX.
- `spatialBlend` (0 = pure 2D/non-positional, 1 = full 3D positional); 3D mode adds rolloff/Doppler via the source's 3D settings.
- `AudioMixer` asset + `AudioMixerGroup` buses; route a source via `outputAudioMixerGroup`. Expose a parameter to drive volume from code.

## Common tasks
Fire-and-forget SFX without cutting off overlaps:
```csharp
using UnityEngine;

[RequireComponent(typeof(AudioSource))]
public class Sfx : MonoBehaviour
{
    [SerializeField] AudioClip shoot;
    AudioSource src;

    void Awake() => src = GetComponent<AudioSource>();

    public void PlayShoot() => src.PlayOneShot(shoot, 0.8f);
}
```

Set a mixer volume from a 0–1 slider (mixer volume is in dB):
```csharp
using UnityEngine;
using UnityEngine.Audio;

public class VolumeControl : MonoBehaviour
{
    [SerializeField] AudioMixer mixer; // exposed param named "MusicVol"

    public void SetMusic(float linear) // 0..1 from a UI Slider
    {
        float dB = linear > 0.0001f ? Mathf.Log10(linear) * 20f : -80f;
        mixer.SetFloat("MusicVol", dB);
    }
}
```

3D positional sound on a moving object:
```csharp
var src = gameObject.AddComponent<AudioSource>();
src.clip = engineLoop;
src.loop = true;
src.spatialBlend = 1f;   // fully 3D
src.Play();
```

## Gotchas
- More than one active `AudioListener` logs a warning and produces undefined behaviour — keep exactly one.
- `spatialBlend` defaults to 0 (2D): a "3D" sound at a distant position will still play at full volume until you set it to 1.
- Mixer volume is logarithmic dB, not linear — convert with `Mathf.Log10(x) * 20`, and clamp 0 to ~ -80 dB.
- `PlayOneShot` ignores `loop` and can't be stopped individually; use a dedicated source per looping sound you need to control.
- Exposed mixer parameters only exist after you right-click the field in the mixer and "Expose"; `SetFloat` with a wrong name silently fails.
- `AudioClip` import "Load Type" (Decompress on Load vs Streaming) affects memory and latency — short SFX = decompress, music = streaming.

## See also
- `unity-patterns` skill, `unity-style` rule, `unity-specialist` agent
- guides/ for cross-engine architecture patterns
