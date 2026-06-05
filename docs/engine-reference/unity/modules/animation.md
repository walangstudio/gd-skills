# Unity 6 — Animation Reference

> Pinned to Unity 6 (2023 LTS) / 2023.2+. Verify anything newer against https://docs.unity3d.com/.

## Core types & entry points
- `Animator` component + an `AnimatorController` asset holding a state machine of `AnimationClip` states and transitions.
- Parameters drive transitions: `SetFloat`, `SetInt`, `SetBool`, `SetTrigger` (one-shot, auto-resets after consumption).
- `Animation` (legacy component) plays clips directly without a state machine — fine for simple, non-character animation; `Animator` is the modern path for everything else.
- Blend Trees — blend multiple clips by a float parameter (e.g. idle↔walk↔run by speed); a node type inside a state.
- Layers + Avatar Masks — overlay animations (e.g. upper-body aim over a locomotion base layer).
- Root motion — when "Apply Root Motion" is on, the clip drives the GameObject's position/rotation instead of staying in place.

## Common tasks
Drive Animator parameters from movement:
```csharp
using UnityEngine;

public class CharacterAnim : MonoBehaviour
{
    [SerializeField] Animator anim;
    static readonly int Speed = Animator.StringToHash("Speed");
    static readonly int Jump = Animator.StringToHash("Jump");

    public void UpdateLocomotion(float planarSpeed) =>
        anim.SetFloat(Speed, planarSpeed); // feeds a blend tree

    public void TriggerJump() => anim.SetTrigger(Jump);
}
```

Wait for a state to finish:
```csharp
IEnumerator PlayAttackThen(System.Action done)
{
    anim.SetTrigger("Attack");
    yield return null; // let the transition start
    while (anim.GetCurrentAnimatorStateInfo(0).IsName("Attack")
           && anim.GetCurrentAnimatorStateInfo(0).normalizedTime < 1f)
        yield return null;
    done?.Invoke();
}
```

Crossfade to a state by name (bypassing trigger params):
```csharp
anim.CrossFade("Death", 0.2f);
```

## Gotchas
- Cache parameter hashes with `Animator.StringToHash` and pass the int overloads — string lookups every frame are wasteful.
- `SetTrigger` is consumed on the next matching transition; if no transition exists it stays "set" and fires later unexpectedly. Use `ResetTrigger` to clear.
- With root motion ON, also setting `transform.position` in script fights the animation — pick one source of motion.
- `normalizedTime` keeps counting past 1.0 for looping states; gate on `< 1f` only for non-looping clips, or mod by 1.
- Blend tree thresholds need a parameter that actually changes; a stuck `SetFloat` value freezes the blend.
- `SetBool`/`SetTrigger` do nothing if the parameter name doesn't exist in the controller — no error, just silence.

## See also
- `unity-patterns` skill, `unity-style` rule, `unity-specialist` agent
- guides/ for cross-engine architecture patterns
