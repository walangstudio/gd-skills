# Unity 6 — Scripting Reference

> Pinned to Unity 6 (2023 LTS) / 2023.2+. Verify anything newer against https://docs.unity3d.com/.

## Core types & entry points
- C# scripts derive from `MonoBehaviour`; `[SerializeField]` for inspector fields
- Coroutines via `IEnumerator` + `StartCoroutine`; `yield return null`
- `ScriptableObject` for data assets
- Events via C# `event`/`Action` or `UnityEvent`

## See also
- `unity-patterns` skill, `unity-style` rule, `unity-specialist` agent
- guides/ for cross-engine architecture patterns

> TODO: expand verified snippets and gotchas.
