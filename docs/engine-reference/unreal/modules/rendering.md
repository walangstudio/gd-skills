# Unreal Engine 5.4+ — Rendering Reference

> Pinned to Unreal Engine 5.4+. Verify anything newer against https://dev.epicgames.com/documentation/en-us/unreal-engine.

## Core types & entry points
- `UStaticMeshComponent` (rigid geometry) / `USkeletalMeshComponent` (skinned/animated meshes).
- `UMaterial` (the asset/graph) → `UMaterialInstanceConstant` (editor-tuned) → `UMaterialInstanceDynamic` (runtime-tuned via code).
- Nanite — virtualized geometry; enable per static mesh asset. Lumen — dynamic global illumination + reflections, configured in Project Settings / Post Process.
- `UCameraComponent` — view; `APlayerCameraManager` blends active views. Post-process via `APostProcessVolume` or the camera's `PostProcessSettings`.
- `UMaterialParameterCollection` for global material parameters shared across materials.

## Common tasks
Create a Material Instance Dynamic and animate a scalar/vector param at runtime:
```cpp
UPROPERTY()
TObjectPtr<UMaterialInstanceDynamic> DynMat;

void AMyActor::BeginPlay()
{
    Super::BeginPlay();
    DynMat = Mesh->CreateDynamicMaterialInstance(0); // element index
}

void AMyActor::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    if (DynMat)
    {
        DynMat->SetScalarParameterValue(TEXT("Emissive"), Glow);
        DynMat->SetVectorParameterValue(TEXT("BaseColor"), FLinearColor::Red);
    }
}
```
Parameter names must match named `Scalar`/`Vector Parameter` nodes in the material graph. Blueprint equivalent: `Create Dynamic Material Instance` → `Set Scalar/Vector Parameter Value`.

Swap a mesh's material at runtime:
```cpp
Mesh->SetMaterial(0, NewMaterialInterface);
```

Camera component on a pawn (spring-arm rig is the common third-person setup):
```cpp
UPROPERTY(VisibleAnywhere)
TObjectPtr<USpringArmComponent> SpringArm;

UPROPERTY(VisibleAnywhere)
TObjectPtr<UCameraComponent> Camera;
// In ctor: SpringArm->SetupAttachment(RootComponent); Camera->SetupAttachment(SpringArm);
```

## Gotchas
- You can't change material parameters on a base `UMaterial` at runtime — you must create a `UMaterialInstanceDynamic` first.
- Nanite meshes don't support traditional LODs (Nanite manages detail itself) and have restrictions (no skeletal/deforming meshes pre-5.5, no world-position-offset shadows by default).
- Lumen has a real cost; on lower-end/perf-bound targets you may fall back to baked/screen-space methods. Verify it's actually enabled (Project Settings → Global Illumination + Reflections = Lumen).
- `CreateDynamicMaterialInstance` allocates each call — cache the result, don't recreate per frame.
- Parameter name typos fail silently (no error, no visual change). Confirm against the graph's parameter nodes.
- Multiple `APostProcessVolume`s blend by priority + `bUnbound`; unexpected look usually means an overlapping volume.

## See also
- `unreal-patterns` skill, `unreal-style` rule, `unreal-specialist` agent
- guides/ for cross-engine architecture patterns
