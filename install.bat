@echo off
setlocal EnableDelayedExpansion

:: gd-skills installer for Windows
:: Usage:
::   install.bat                      Install globally to %USERPROFILE%\.claude
::   install.bat -l                   Install to .\.claude in current project
::   install.bat -t cursor            Install for Cursor
::   install.bat -t all               Install for all detected tools
::   install.bat -f                   Force reinstall
::   install.bat -u                   Uninstall
::   install.bat --list-targets       List supported targets
::   install.bat -h                   Show help

:: --- Defaults ---
set "TARGET=claude"
set "LOCAL=0"
set "FORCE=0"
set "UNINSTALL=0"
set "LIST_TARGETS=0"
set "SHOW_HELP=0"
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

:: --- Parse args ---
:parse_args
if "%~1"=="" goto end_args
if /i "%~1"=="-h"             set "SHOW_HELP=1"    & shift & goto parse_args
if /i "%~1"=="--help"         set "SHOW_HELP=1"    & shift & goto parse_args
if /i "%~1"=="-l"             set "LOCAL=1"        & shift & goto parse_args
if /i "%~1"=="--local"        set "LOCAL=1"        & shift & goto parse_args
if /i "%~1"=="-f"             set "FORCE=1"        & shift & goto parse_args
if /i "%~1"=="--force"        set "FORCE=1"        & shift & goto parse_args
if /i "%~1"=="-u"             set "UNINSTALL=1"    & shift & goto parse_args
if /i "%~1"=="--uninstall"    set "UNINSTALL=1"    & shift & goto parse_args
if /i "%~1"=="--list-targets" set "LIST_TARGETS=1" & shift & goto parse_args
if /i "%~1"=="-t" (
    set "TARGET=%~2"
    shift & shift & goto parse_args
)
if /i "%~1"=="--target" (
    set "TARGET=%~2"
    shift & shift & goto parse_args
)
shift
goto parse_args
:end_args

:: --- Help (no node needed) ---
if "%SHOW_HELP%"=="1" (
    echo.
    echo Usage: install.bat [OPTIONS]
    echo.
    echo Options:
    echo   -l, --local           Install to current project ^(.\\.claude^)
    echo   -t, --target TARGET   Install target ^(default: claude^)
    echo   --list-targets        List supported targets
    echo   -f, --force           Force reinstall / downgrade
    echo   -u, --uninstall       Remove installed files
    echo   -h, --help            Show this help
    echo.
    goto :eof
)

:: --- List targets (no node needed) ---
if "%LIST_TARGETS%"=="1" (
    echo.
    echo   Supported targets:
    echo.
    echo   claude     Claude Code ^(full install: agents, skills, commands, rules^)
    echo   cursor     Cursor ^(rules only, merged into single file^)
    echo   windsurf   Windsurf ^(rules only, merged into single file^)
    echo   copilot    GitHub Copilot ^(rules merged into copilot-instructions.md^)
    echo   all        Install for all targets above
    echo.
    goto :eof
)

:: --- Check node.js ---
where node >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is required but not found in PATH.
    echo Install Node.js from https://nodejs.org/
    exit /b 1
)

:: --- Locate helper scripts ---
set "H=%SCRIPT_DIR%\scripts\helpers"
set "NODE_VERSION_JS=%H%\version.js"
set "NODE_SEMVER_JS=%H%\semver.js"
set "NODE_COMBINED_JS=%H%\combined.js"
set "NODE_COPILOT_MERGE_JS=%H%\copilot_merge.js"
set "NODE_COPILOT_REMOVE_JS=%H%\copilot_remove.js"
set "NODE_INTEGRITY_JS=%H%\integrity.js"

if not exist "%NODE_VERSION_JS%" (
    echo Error: Helper scripts not found at %H%
    echo Run this script from the gd-skills repository root.
    exit /b 1
)

:: --- Read version from plugin.json ---
set "PLUGIN_JSON=%SCRIPT_DIR%\.claude-plugin\plugin.json"
if not exist "%PLUGIN_JSON%" (
    echo Error: plugin.json not found at %PLUGIN_JSON%
    echo Run this script from the gd-skills repository root.
    exit /b 1
)

for /f "delims=" %%v in ('node "%NODE_VERSION_JS%" "%PLUGIN_JSON%" 2^>nul') do set "VERSION=%%v"
if "%VERSION%"=="" (
    echo Error: Could not read version from plugin.json
    exit /b 1
)

:: --- Banner ---
echo.
echo   gd-skills v%VERSION%
if "%LOCAL%"=="1" (
    echo   Mode: project-local ^(%CD%^)
) else (
    echo   Mode: global ^(~/.claude^)
)
echo   -----------------------------
echo.

:: --- Integrity check ---
set "CHECKSUMS=%SCRIPT_DIR%\CHECKSUMS.sha256"
where git >nul 2>&1
set "GIT_AVAILABLE=%ERRORLEVEL%"

if exist "%CHECKSUMS%" if "%GIT_AVAILABLE%"=="0" (
    echo   Verifying file integrity...
    node "%NODE_INTEGRITY_JS%" "%CHECKSUMS%" "%SCRIPT_DIR%"
    set "INTEGRITY_RESULT=!ERRORLEVEL!"
    if "!INTEGRITY_RESULT!"=="1" (
        echo   WARNING: Integrity check failed - some files may have been modified.
        if "%FORCE%"=="0" (
            set /p "CONT=  Continue anyway? [y/N]: "
            if /i not "!CONT!"=="y" (
                echo   Aborted.
                goto :eof
            )
        )
    ) else (
        echo   Integrity check passed.
    )
    echo.
) else if not exist "%CHECKSUMS%" (
    echo   Note: No CHECKSUMS.sha256 found, skipping integrity verification.
    echo.
)

:: --- Execute ---
if /i "%TARGET%"=="all" (
    for %%t in (claude cursor windsurf copilot) do (
        if "%UNINSTALL%"=="1" (
            call :uninstall_target %%t
        ) else (
            call :install_target %%t
        )
    )
) else (
    if "%UNINSTALL%"=="1" (
        call :uninstall_target %TARGET%
    ) else (
        call :install_target %TARGET%
    )
)

echo   -----------------------------
echo.
goto :eof

:: ============================================================
:: :install_target <target>
:: ============================================================
:install_target
set "T=%~1"
call :get_target_dir "%T%"
set "DEST_DIR=%TARGET_DIR%"
call :get_target_label "%T%"
set "LABEL=%TARGET_LABEL%"
set "MARKER=%DEST_DIR%\.gd-skills-version"

if "%DEST_DIR%"=="" (
    echo   Unknown target: %T%
    goto :eof
)

:: --- Version check ---
if exist "%MARKER%" (
    set /p "INSTALLED_VER="<"%MARKER%"
    for /f "delims=" %%v in ('node "%NODE_SEMVER_JS%" "!INSTALLED_VER!" "%VERSION%" 2^>nul') do set "SEMVER_CMP=%%v"

    if "!SEMVER_CMP!"=="greater" (
        echo   [%LABEL%] Installed v!INSTALLED_VER! is newer than source v%VERSION%.
        if "%FORCE%"=="0" (
            echo   Use -f to downgrade.
            goto :eof
        )
        echo   Forcing reinstall...
    ) else if "!SEMVER_CMP!"=="equal" (
        echo   [%LABEL%] v%VERSION% is already installed.
        if "%FORCE%"=="0" (
            set /p "RESP=  Reinstall? [y/N]: "
            if /i not "!RESP!"=="y" goto :eof
        )
    ) else (
        echo   [%LABEL%] Upgrading from v!INSTALLED_VER! to v%VERSION%...
    )
) else (
    echo   [%LABEL%] Installing v%VERSION%...
)

:: --- Backup ---
call :make_timestamp
set "BACKUP_DIR=%DEST_DIR%\.gd-skills-backup-%TIMESTAMP%"
set "BACKED_UP=0"

if exist "%MARKER%" (
    if /i "%T%"=="claude" (
        for %%c in (agents skills commands rules) do (
            if exist "%DEST_DIR%\%%c" (
                if "!BACKED_UP!"=="0" (
                    mkdir "%BACKUP_DIR%" 2>nul
                    echo   Backing up existing files to %BACKUP_DIR%
                    set "BACKED_UP=1"
                )
                xcopy /e /i /y /q "%DEST_DIR%\%%c" "%BACKUP_DIR%\%%c\" >nul
            )
        )
    ) else (
        if exist "%DEST_DIR%\rules" (
            mkdir "%BACKUP_DIR%" 2>nul
            echo   Backing up existing files to %BACKUP_DIR%
            xcopy /e /i /y /q "%DEST_DIR%\rules" "%BACKUP_DIR%\rules\" >nul
            set "BACKED_UP=1"
        )
    )
)

:: --- Create dest dir ---
if not exist "%DEST_DIR%" mkdir "%DEST_DIR%"

set "TOTAL=0"

if /i "%T%"=="claude" (
    for %%c in (agents skills commands rules) do (
        set "SRC=%SCRIPT_DIR%\%%c"
        set "DST=%DEST_DIR%\%%c"
        if not exist "!SRC!" (
            echo     Warning: !SRC! not found, skipping.
        ) else (
            if not exist "!DST!" mkdir "!DST!"
            xcopy /e /i /y /q "!SRC!\*" "!DST!\" >nul
            set /a "COUNT=0"
            for %%f in ("!SRC!\*") do set /a "COUNT+=1"
            for /d %%d in ("!SRC!\*") do set /a "COUNT+=1"
            echo     %%c: !COUNT! items
            set /a "TOTAL+=COUNT"
        )
    )
) else (
    :: rules copy
    set "RULES_DEST=%DEST_DIR%\rules"
    if not exist "!RULES_DEST!" mkdir "!RULES_DEST!"
    set "RULES_SRC=%SCRIPT_DIR%\rules"
    if exist "!RULES_SRC!" (
        xcopy /y /q "!RULES_SRC!\*.md" "!RULES_DEST!\" >nul
        set /a "COUNT=0"
        for %%f in ("!RULES_SRC!\*.md") do set /a "COUNT+=1"
        echo     rules: !COUNT! items
        set /a "TOTAL+=COUNT"
    )

    if /i "%T%"=="cursor" (
        node "%NODE_COMBINED_JS%" "%SCRIPT_DIR%\rules" "!RULES_DEST!\gd-skills.md" "%VERSION%"
        echo     + combined:   gd-skills.md
    )
    if /i "%T%"=="windsurf" (
        node "%NODE_COMBINED_JS%" "%SCRIPT_DIR%\rules" "!RULES_DEST!\gd-skills.md" "%VERSION%"
        echo     + combined:   gd-skills.md
    )
    if /i "%T%"=="copilot" (
        set "COPILOT_FILE=%DEST_DIR%\copilot-instructions.md"
        node "%NODE_COPILOT_MERGE_JS%" "!COPILOT_FILE!" "%SCRIPT_DIR%\rules" "%VERSION%"
        echo     + merged:     copilot-instructions.md
    )
)

:: --- Write version marker ---
>"%MARKER%" echo %VERSION%

echo.
echo   [%LABEL%] Done - %TOTAL% components installed
goto :eof

:: ============================================================
:: :uninstall_target <target>
:: ============================================================
:uninstall_target
set "T=%~1"
call :get_target_dir "%T%"
set "DEST_DIR=%TARGET_DIR%"
call :get_target_label "%T%"
set "LABEL=%TARGET_LABEL%"
set "MARKER=%DEST_DIR%\.gd-skills-version"

if not exist "%MARKER%" (
    echo   [%LABEL%] Not installed, nothing to remove.
    goto :eof
)

echo   [%LABEL%] Uninstalling...

if /i "%T%"=="claude" (
    for %%c in (agents skills commands rules) do (
        set "SRC=%SCRIPT_DIR%\%%c"
        set "DST=%DEST_DIR%\%%c"
        if exist "!SRC!" if exist "!DST!" (
            if /i "%%c"=="skills" (
                for /d %%d in ("!SRC!\*") do (
                    if exist "!DST!\%%~nd" rd /s /q "!DST!\%%~nd"
                )
            ) else (
                for %%f in ("!SRC!\*.md") do (
                    if exist "!DST!\%%~nxf" del /f /q "!DST!\%%~nxf"
                )
            )
        )
    )
) else (
    if exist "%DEST_DIR%\rules\gd-skills.md" del /f /q "%DEST_DIR%\rules\gd-skills.md"
    set "RULES_SRC=%SCRIPT_DIR%\rules"
    if exist "!RULES_SRC!" (
        for %%f in ("!RULES_SRC!\*.md") do (
            if exist "%DEST_DIR%\rules\%%~nxf" del /f /q "%DEST_DIR%\rules\%%~nxf"
        )
    )
    if /i "%T%"=="copilot" (
        set "COPILOT_FILE=%DEST_DIR%\copilot-instructions.md"
        if exist "!COPILOT_FILE!" (
            node "%NODE_COPILOT_REMOVE_JS%" "!COPILOT_FILE!"
            echo   Cleaned gd-skills content from copilot-instructions.md
        )
    )
)

del /f /q "%MARKER%"
echo   [%LABEL%] Uninstalled.
goto :eof

:: ============================================================
:: :get_target_dir <target>  -> sets TARGET_DIR
:: ============================================================
:get_target_dir
set "TARGET_DIR="
set "_T=%~1"
if "%LOCAL%"=="1" (
    set "_BASE=%CD%"
) else (
    set "_BASE=%USERPROFILE%"
)
if /i "%_T%"=="claude"   set "TARGET_DIR=%_BASE%\.claude"
if /i "%_T%"=="cursor"   set "TARGET_DIR=%_BASE%\.cursor"
if /i "%_T%"=="windsurf" set "TARGET_DIR=%_BASE%\.windsurf"
if /i "%_T%"=="copilot"  set "TARGET_DIR=%_BASE%\.github"
goto :eof

:: ============================================================
:: :get_target_label <target>  -> sets TARGET_LABEL
:: ============================================================
:get_target_label
set "TARGET_LABEL=%~1"
if /i "%~1"=="claude"   set "TARGET_LABEL=Claude Code"
if /i "%~1"=="cursor"   set "TARGET_LABEL=Cursor"
if /i "%~1"=="windsurf" set "TARGET_LABEL=Windsurf"
if /i "%~1"=="copilot"  set "TARGET_LABEL=GitHub Copilot"
goto :eof

:: ============================================================
:: :make_timestamp  -> sets TIMESTAMP as yyyyMMddHHmmss
:: ============================================================
:make_timestamp
for /f "tokens=1 delims=." %%d in ('wmic os get LocalDateTime /value 2^>nul ^| find "="') do (
    for /f "tokens=2 delims==" %%v in ("%%d") do (
        set "_DT=%%v"
        set "TIMESTAMP=!_DT:~0,14!"
        goto :eof
    )
)
:: fallback: strip separators from %DATE%%TIME%
set "_D=%DATE:/=%"
set "_D=%_D:-=%"
set "_D=%_D: =%"
set "_T2=%TIME::=%"
set "_T2=%_T2:.=%"
set "_T2=%_T2: =0%"
set "TIMESTAMP=%_D%%_T2%"
goto :eof
