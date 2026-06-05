# Unity 6 — Rendering Reference

> Pinned to Unity 6 (2023 LTS) / 2023.2+. Verify anything newer against https://docs.unity3d.com/.

## Core types & entry points
- `Camera` — `Camera.main` (tagged `MainCamera`), `orthographic` for 2D, `ScreenToWorldPoint`/`WorldToScreenPoint`.
- 2D: `Sprite` asset + `SpriteRenderer` (`sprite`, `color`, `flipX`, `sortingLayerName`, `sortingOrder`).
- 3D: `Mesh` + `MeshFilter` + `MeshRenderer`; assign `Material`(s) via `MeshRenderer.material`/`sharedMaterial`.
- `Material` wraps a `Shader`. Set values with `SetFloat`/`SetColor`/`SetTexture`; per-renderer overrides via `MaterialPropertyBlock`.
- Pipelines: Built-in (legacy), URP (`com.unity.render-pipelines.universal`, the default 2D/3D choice), HDRP (high-end). Shaders are not cross-pipeline — a Built-in shader renders pink under URP.
- Sorting: `SpriteRenderer` draws by Sorting Layer, then Order in Layer, then distance. UI uses `Canvas` render modes (Screen Space – Overlay / Camera / World Space).

## Common tasks
Set a sprite's sorting + tint at runtime:
```csharp
using UnityEngine;

public class SpriteSetup : MonoBehaviour
{
    [SerializeField] Sprite idle;

    void Start()
    {
        var sr = GetComponent<SpriteRenderer>();
        sr.sprite = idle;
        sr.sortingLayerName = "Characters";
        sr.sortingOrder = 5;
        sr.color = new Color(1f, 1f, 1f, 0.8f);
    }
}
```

Tween a material color without leaking material instances (use a property block):
```csharp
MaterialPropertyBlock mpb;
Renderer rend;

void Awake()
{
    rend = GetComponent<Renderer>();
    mpb = new MaterialPropertyBlock();
}

void SetColor(Color c)
{
    rend.GetPropertyBlock(mpb);
    mpb.SetColor("_BaseColor", c); // URP Lit uses _BaseColor; Built-in uses _Color
    rend.SetPropertyBlock(mpb);
}
```

Frame an orthographic 2D camera to a world point:
```csharp
Camera cam = Camera.main;
cam.orthographicSize = 5f;
Vector3 world = cam.ScreenToWorldPoint(Input.mousePosition);
```

## Gotchas
- `renderer.material` clones the material (one instance per renderer, leaks at scene end); `sharedMaterial` edits the asset for every user. Prefer `MaterialPropertyBlock` for per-object tweaks.
- URP and Built-in use different shader property names: `_BaseColor`/`_BaseMap` (URP Lit) vs `_Color`/`_MainTex` (Built-in). Wrong name = silent no-op.
- A magenta/pink object means the shader is incompatible with the active pipeline.
- `Camera.main` does a `FindGameObjectWithTag` each call — cache it.
- 2D draw order is sorting layer/order first; z-position only breaks ties within the same order.
- Switching pipelines requires assigning a Render Pipeline Asset in Graphics/Quality settings, plus upgrading materials.

## See also
- `unity-patterns` skill, `unity-style` rule, `unity-specialist` agent
- guides/ for cross-engine architecture patterns
