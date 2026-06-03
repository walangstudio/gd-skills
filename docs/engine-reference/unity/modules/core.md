# Unity 6 — Core Reference

> Pinned to Unity 6 (2023 LTS) / 2023.2+. Verify anything newer against https://docs.unity3d.com/.

## Core types & entry points
- `GameObject` + `Component` model; `MonoBehaviour` lifecycle (`Awake`/`OnEnable`/`Start`/`Update`/`FixedUpdate`/`LateUpdate`)
- `Transform` hierarchy, `GetComponent<T>()`, `Instantiate`/`Destroy`
- Scenes via `UnityEngine.SceneManagement.SceneManager`
- `Object.FindFirstObjectByType<T>()` (NOT deprecated `FindObjectOfType`)

## See also
- `unity-patterns` skill, `unity-style` rule, `unity-specialist` agent
- guides/ for cross-engine architecture patterns

> TODO: expand verified snippets and gotchas.
