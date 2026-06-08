# Unity 6 — UI Reference

> Pinned to Unity 6 (2023 LTS) / 2023.2+. Verify anything newer against https://docs.unity3d.com/.

## Core types & entry points
- uGUI: every UI element lives under a `Canvas` and uses a `RectTransform` (anchors + pivot + offsets, not a plain Transform).
- Widgets: `Button`, `Image`, `Slider`, `Toggle`, `TMP_Text` / `TMP_InputField` (TextMeshPro, in `TMPro` namespace).
- `EventSystem` GameObject is required for any pointer/keyboard UI interaction — one per scene.
- Canvas render modes: Screen Space – Overlay (default), Screen Space – Camera (sorts with world), World Space (diegetic UI).
- `CanvasGroup` for group alpha/interactable/blocksRaycasts; `LayoutGroup`/`ContentSizeFitter` for auto layout.
- UI Toolkit (runtime alternative): `UIDocument` component + UXML/USS; query with `rootVisualElement.Q<Button>("id")`. Separate system from uGUI — don't mix on the same element.

## Common tasks
Wire a Button's onClick in code:
```csharp
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class Menu : MonoBehaviour
{
    [SerializeField] Button playButton;
    [SerializeField] TMP_Text label;

    void Awake()
    {
        playButton.onClick.AddListener(OnPlay);
    }

    void OnPlay() => label.text = "Loading...";

    void OnDestroy() => playButton.onClick.RemoveListener(OnPlay);
}
```

Anchor a RectTransform to the top-right corner:
```csharp
var rt = GetComponent<RectTransform>();
rt.anchorMin = rt.anchorMax = new Vector2(1f, 1f);
rt.pivot = new Vector2(1f, 1f);
rt.anchoredPosition = new Vector2(-20f, -20f); // 20px in from the corner
```

Fade a panel with CanvasGroup:
```csharp
[SerializeField] CanvasGroup panel;

void Hide()
{
    panel.alpha = 0f;
    panel.interactable = false;
    panel.blocksRaycasts = false;
}
```

UI Toolkit button (different system):
```csharp
var root = GetComponent<UIDocument>().rootVisualElement;
root.Q<UnityEngine.UIElements.Button>("start").clicked += () => Debug.Log("clicked");
```

## Gotchas
- No `EventSystem` in the scene = buttons silently do nothing. Adding any uGUI element via menu usually creates one.
- Always `RemoveListener` (or use `RemoveAllListeners`) when the object is destroyed if you added listeners in code, to avoid stale callbacks.
- Use `TMP_Text` (TextMeshPro), not the legacy `Text` — the old `UnityEngine.UI.Text` is effectively deprecated for new work.
- Anchored UI: if `anchorMin == anchorMax`, `anchoredPosition` is an offset from that point; if they differ, the rect stretches and you size via offsets instead.
- uGUI and UI Toolkit are separate stacks — `Button` from `UnityEngine.UI` is not `Button` from `UnityEngine.UIElements`.
- Many small Canvases beat one giant Canvas: any change dirties and rebuilds the whole Canvas's mesh.

## See also
- `unity-patterns` skill, `unity-style` rule, `unity-specialist` agent
- guides/ for cross-engine architecture patterns
