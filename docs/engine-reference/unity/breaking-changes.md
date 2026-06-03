# Unity 6 — Breaking Changes & Version Notes

Pinned baseline: Unity 6 (2023 LTS) / 2023.2+. Notable changes around this baseline that affect generated code.

| Version | Change | Migration |
|---------|--------|-----------|
| Unity 6 | Rebrand from year versions (2023.x) to Unity 6; 2023.2+ API surface, broadly source-compatible with 2022 LTS. | Target 2022 LTS APIs unless using Unity 6-only features. |
| 2023.1 | `Object.FindObjectOfType` deprecated for `FindFirstObjectByType` / `FindAnyObjectByType`. | Replace `FindObjectOfType<T>()` with `FindFirstObjectByType<T>()`. |
| 2022.2 | New Input System package vs legacy `Input` manager. | Check active input handling; prefer the new Input System for new code. |
| 2021.2 | UI Toolkit (UIElements) stabilized for runtime UI alongside uGUI. | Choose uGUI or UI Toolkit; do not mix concepts. |

> Verify against the authoritative docs for versions beyond the pinned baseline.
