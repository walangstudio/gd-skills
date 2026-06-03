# Unreal Engine 5.4+ — Breaking Changes & Version Notes

Pinned baseline: Unreal Engine 5.4+. Notable changes around this baseline that affect generated code.

| Version | Change | Migration |
|---------|--------|-----------|
| 5.0 | Nanite + Lumen introduced; legacy LOD workflows still valid. | Enable Nanite/Lumen per-project; not mandatory. |
| 5.1 | Enhanced Input becomes default; legacy input bindings deprecated. | Use `UInputAction`/`UInputMappingContext` + `EnhancedInputComponent`. |
| 5.3 | `TObjectPtr<>` preferred over raw pointers for UPROPERTY members. | Declare UPROPERTY object refs as `TObjectPtr<UType>`. |
| 5.4 | AnimNext/PCG previews; core gameplay framework (Actor/Pawn/Controller) unchanged. | Safe to target 5.2/5.3 gameplay APIs on 5.4. |

> Verify against the authoritative docs for versions beyond the pinned baseline.
