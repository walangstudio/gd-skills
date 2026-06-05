# Unreal Engine 5.4+ — UI Reference

> Pinned to Unreal Engine 5.4+. Verify anything newer against https://dev.epicgames.com/documentation/en-us/unreal-engine.

## Core types & entry points
- UMG is the designer-facing UI: a `UUserWidget` subclass authored as a Widget Blueprint, built from `UWidget`s (`UButton`, `UTextBlock`, `UImage`, `UProgressBar`, panels like `UCanvasPanel`/`UVerticalBox`).
- Slate is the C++ layer underneath UMG; you rarely touch it directly except for editor UI or fully custom widgets.
- `UPROPERTY(meta=(BindWidget))` — binds a C++ pointer to a same-named widget in the Blueprint (compile error if missing, unless `BindWidgetOptional`).
- `CreateWidget<T>(...)` + `AddToViewport()` to instantiate and show; `RemoveFromParent()` to hide.
- Input mode: `FInputModeUIOnly` / `FInputModeGameAndUI` / `FInputModeGameOnly` on the `APlayerController`, plus `SetShowMouseCursor`.
- `UWidgetComponent` for world-space (in-scene) UI.

## Common tasks
C++ user-widget base that binds widgets and wires a button click:
```cpp
UCLASS()
class MYGAME_API UMainMenu : public UUserWidget
{
    GENERATED_BODY()
protected:
    virtual void NativeConstruct() override;

    UPROPERTY(meta = (BindWidget))
    TObjectPtr<UButton> PlayButton;

    UPROPERTY(meta = (BindWidget))
    TObjectPtr<UTextBlock> TitleText;

    UFUNCTION()
    void OnPlayClicked();
};

void UMainMenu::NativeConstruct()
{
    Super::NativeConstruct();
    if (PlayButton)
    {
        PlayButton->OnClicked.AddDynamic(this, &UMainMenu::OnPlayClicked);
    }
}
```

Create and display from the player controller, then switch to UI input:
```cpp
if (UMainMenu* Menu = CreateWidget<UMainMenu>(PlayerController, MenuClass))
{
    Menu->AddToViewport();
    FInputModeUIOnly Mode;
    Mode.SetWidgetToFocus(Menu->TakeWidget());
    PlayerController->SetInputMode(Mode);
    PlayerController->bShowMouseCursor = true;
}
```
Blueprint equivalent: `Create Widget` → `Add to Viewport`, then `Set Input Mode UI Only` + `Set Show Mouse Cursor`. UI is genuinely Blueprint-first in Unreal; most teams author layout/animation in the Widget Blueprint and only bind logic via `BindWidget`.

## Gotchas
- `BindWidget` requires the C++ variable name to EXACTLY match the widget name in the Blueprint, and the widget to be marked "Is Variable" — otherwise the Blueprint won't compile.
- `CreateWidget` needs a valid owning player/world; calling it too early (before a player controller exists) returns null.
- Forgetting `Set Input Mode UI Only` means clicks/keys still reach the game; forgetting to restore `GameOnly` leaves the player unable to control the pawn.
- `AddToViewport` widgets persist across the level until you `RemoveFromParent`; leaking menus stack invisibly.
- Don't subclass `UUserWidget` and expect Slate-style direct construction — drive layout from the Widget Blueprint.

## See also
- `unreal-patterns` skill, `unreal-style` rule, `unreal-specialist` agent
- guides/ for cross-engine architecture patterns
