# Unreal Engine 5.4+ — Audio Reference

> Pinned to Unreal Engine 5.4+. Verify anything newer against https://dev.epicgames.com/documentation/en-us/unreal-engine.

## Core types & entry points
- `USoundBase` — base playable asset; concrete types are `USoundWave` (raw clip), `USoundCue` (legacy node graph), and MetaSound sources (`UMetaSoundSource`, the modern procedural graph).
- `UAudioComponent` — an attached, controllable sound instance (start/stop/fade, set params); spawned implicitly by the one-shot helpers.
- `UGameplayStatics::PlaySound2D` (non-positional/UI) and `PlaySoundAtLocation` (positional one-shots); `SpawnSoundAttached` / `SpawnSound2D` when you need the returned `UAudioComponent`.
- `USoundAttenuation` — distance falloff/spatialization for positional sounds.
- `USoundClass` (volume/mix grouping) + `USoundSubmix` (DSP/effects bus) for mixing.

## Common tasks
Fire a positional one-shot and a 2D UI sound:
```cpp
UPROPERTY(EditAnywhere, Category = "Audio")
TObjectPtr<USoundBase> ImpactSound;

void AMyActor::OnImpact(const FVector& Where)
{
    if (ImpactSound)
    {
        UGameplayStatics::PlaySoundAtLocation(this, ImpactSound, Where);
    }
}

void AMyActor::PlayClick(USoundBase* Click)
{
    UGameplayStatics::PlaySound2D(this, Click);
}
```
Blueprint equivalent: `Play Sound at Location` / `Play Sound 2D` nodes.

Looping, controllable sound via a returned audio component (e.g. an engine hum you fade out):
```cpp
UPROPERTY()
TObjectPtr<UAudioComponent> Loop;

void AMyActor::StartLoop(USoundBase* Sound)
{
    Loop = UGameplayStatics::SpawnSoundAttached(Sound, RootComponent);
    if (Loop) { Loop->FadeIn(0.5f); }
}

void AMyActor::StopLoop()
{
    if (Loop) { Loop->FadeOut(0.5f, 0.f); }
}
```

For MetaSounds, drive runtime parameters on the audio component:
```cpp
Loop->SetFloatParameter(TEXT("RPM"), CurrentRpm);
```

## Gotchas
- `PlaySound2D`/`PlaySoundAtLocation` are fire-and-forget — they return nothing controllable. Use `SpawnSound*` if you need to stop/modulate the instance.
- Positional sounds need a `USoundAttenuation` (on the asset or passed in) to actually attenuate with distance; without it they play at full volume everywhere.
- `SetFloatParameter`/`SetIntParameter` target MetaSound graph inputs by exact name; Sound Cues don't expose params that way.
- A looping sound with no owner/attachment that you don't hold a `UPROPERTY` reference to can be GC'd and stop unexpectedly.
- Sound Cues are legacy; new procedural/interactive audio should use MetaSounds. Both still play through `USoundBase` APIs.

## See also
- `unreal-patterns` skill, `unreal-style` rule, `unreal-specialist` agent
- guides/ for cross-engine architecture patterns
