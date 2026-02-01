#
# gd-skills installer (PowerShell)
# Works on Windows (PowerShell 5.1+) and PowerShell Core (macOS/Linux)
#
# Usage:
#   .\install.ps1                        Install globally to ~/.claude (default)
#   .\install.ps1 -Local                 Install to ./.claude in current project
#   .\install.ps1 -Target cursor         Install for Cursor
#   .\install.ps1 -Target all            Install for all detected tools
#   .\install.ps1 -Force                 Force reinstall (skip prompts)
#   .\install.ps1 -Uninstall             Uninstall
#   .\install.ps1 -ListTargets           List supported targets
#
# Supported targets: claude, cursor, windsurf, copilot

param(
    [string]$Target = "claude",
    [switch]$Local,
    [switch]$Force,
    [switch]$Uninstall,
    [switch]$ListTargets,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

# --- Configuration ---
$MarkerFile = ".gd-skills-version"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PluginJsonPath = Join-Path $ScriptDir ".claude-plugin\plugin.json"
$ChecksumsPath = Join-Path $ScriptDir "CHECKSUMS.sha256"

# --- Help ---
if ($Help) {
    Write-Host ""
    Write-Host "Usage: .\install.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Local            Install to current project (.\.claude)"
    Write-Host "  -Target TARGET    Install target (default: claude)"
    Write-Host "  -ListTargets      List supported targets"
    Write-Host "  -Force            Force reinstall / downgrade"
    Write-Host "  -Uninstall        Remove installed files"
    Write-Host "  -Help             Show this help"
    Write-Host ""
    exit 0
}

# --- Helpers ---
function Compare-SemVer {
    param([string]$Ver1, [string]$Ver2)
    # Returns: 0 if equal, 1 if Ver1 > Ver2, 2 if Ver1 < Ver2
    if ($Ver1 -eq $Ver2) { return 0 }
    $v1 = $Ver1.Split('.') | ForEach-Object { [int]$_ }
    $v2 = $Ver2.Split('.') | ForEach-Object { [int]$_ }
    for ($i = 0; $i -lt 3; $i++) {
        $a = if ($i -lt $v1.Count) { $v1[$i] } else { 0 }
        $b = if ($i -lt $v2.Count) { $v2[$i] } else { 0 }
        if ($a -gt $b) { return 1 }
        if ($a -lt $b) { return 2 }
    }
    return 0
}

function Get-TargetDir {
    param([string]$TargetName)
    if ($Local) {
        $base = Get-Location
    } else {
        $base = if ($env:USERPROFILE) { $env:USERPROFILE } else { $env:HOME }
    }
    switch ($TargetName) {
        "claude"   { return Join-Path $base ".claude" }
        "cursor"   { return Join-Path $base ".cursor" }
        "windsurf" { return Join-Path $base ".windsurf" }
        "copilot"  { return Join-Path $base ".github" }
        default    { return $null }
    }
}

function Get-TargetLabel {
    param([string]$TargetName)
    switch ($TargetName) {
        "claude"   { return "Claude Code" }
        "cursor"   { return "Cursor" }
        "windsurf" { return "Windsurf" }
        "copilot"  { return "GitHub Copilot" }
        default    { return $TargetName }
    }
}

function Get-TargetComponents {
    param([string]$TargetName)
    switch ($TargetName) {
        "claude"   { return @("agents", "skills", "commands", "rules") }
        "cursor"   { return @("rules") }
        "windsurf" { return @("rules") }
        "copilot"  { return @("rules") }
        default    { return @() }
    }
}

# --- Install for a target ---
function Install-Target {
    param([string]$TargetName)

    $destDir = Get-TargetDir $TargetName
    $label = Get-TargetLabel $TargetName
    $components = Get-TargetComponents $TargetName
    $versionFile = Join-Path $destDir $MarkerFile

    if (-not $destDir) {
        Write-Host "  Unknown target: $TargetName"
        return
    }

    # --- Version check ---
    if (Test-Path $versionFile) {
        $installedVersion = (Get-Content $versionFile -Raw).Trim()
        $cmp = Compare-SemVer $installedVersion $Version

        switch ($cmp) {
            1 {
                Write-Host "  [$label] Installed v$installedVersion is newer than source v$Version."
                if (-not $Force) {
                    Write-Host "  Use -Force to downgrade."
                    return
                }
                Write-Host "  Forcing reinstall..."
            }
            0 {
                Write-Host "  [$label] v$Version is already installed."
                if (-not $Force) {
                    $response = Read-Host "  Reinstall? [y/N]"
                    if ($response -ne 'y' -and $response -ne 'Y') { return }
                }
            }
            2 {
                Write-Host "  [$label] Upgrading from v$installedVersion to v$Version..."
            }
        }
    }
    else {
        Write-Host "  [$label] Installing v$Version..."
    }

    # --- Backup existing files ---
    $backupDir = Join-Path $destDir (".gd-skills-backup-" + (Get-Date -Format "yyyyMMddHHmmss"))
    $backedUp = $false

    if (Test-Path $versionFile) {
        foreach ($component in $components) {
            $compDest = Join-Path $destDir $component
            if (Test-Path $compDest) {
                if (-not $backedUp) {
                    New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
                    Write-Host "  Backing up existing files to $backupDir"
                    $backedUp = $true
                }
                Copy-Item -Path $compDest -Destination $backupDir -Recurse -Force
            }
        }
    }

    # --- Create directories and copy ---
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    $total = 0

    if ($TargetName -eq "claude") {
        foreach ($component in $components) {
            $srcDir = Join-Path $ScriptDir $component
            $compDest = Join-Path $destDir $component

            if (-not (Test-Path $srcDir)) {
                Write-Host "    Warning: $srcDir not found, skipping."
                continue
            }

            New-Item -ItemType Directory -Force -Path $compDest | Out-Null
            Copy-Item -Path (Join-Path $srcDir "*") -Destination $compDest -Recurse -Force
            $count = (Get-ChildItem -Path $srcDir -ErrorAction SilentlyContinue).Count
            Write-Host ("    {0,-12} {1} items" -f "${component}:", $count)
            $total += $count
        }
    }
    else {
        # Other targets: copy rules and generate combined file
        $rulesDest = Join-Path $destDir "rules"
        New-Item -ItemType Directory -Force -Path $rulesDest | Out-Null

        $rulesDir = Join-Path $ScriptDir "rules"
        if (Test-Path $rulesDir) {
            Copy-Item -Path (Join-Path $rulesDir "*.md") -Destination $rulesDest -Force
            $count = (Get-ChildItem -Path $rulesDir -Filter "*.md").Count
            Write-Host ("    {0,-12} {1} items" -f "rules:", $count)
            $total += $count
        }

        switch ($TargetName) {
            "cursor" {
                $combined = Join-Path $rulesDest "gd-skills.md"
                $content = "# gd-skills - Game Development Rules`n`n# Imported from gd-skills v$Version`n"
                Get-ChildItem (Join-Path $ScriptDir "rules") -Filter "*.md" | ForEach-Object {
                    $content += "`n---`n`n"
                    $content += Get-Content $_.FullName -Raw
                    $content += "`n"
                }
                $content | Out-File -FilePath $combined -Encoding UTF8
                Write-Host "    + combined:   gd-skills.md"
            }
            "windsurf" {
                $combined = Join-Path $rulesDest "gd-skills.md"
                $content = "# gd-skills - Game Development Rules`n`n# Imported from gd-skills v$Version`n"
                Get-ChildItem (Join-Path $ScriptDir "rules") -Filter "*.md" | ForEach-Object {
                    $content += "`n---`n`n"
                    $content += Get-Content $_.FullName -Raw
                    $content += "`n"
                }
                $content | Out-File -FilePath $combined -Encoding UTF8
                Write-Host "    + combined:   gd-skills.md"
            }
            "copilot" {
                $instructions = Join-Path $destDir "copilot-instructions.md"
                $startMarker = "# --- BEGIN gd-skills ---"
                $endMarker = "# --- END gd-skills ---"

                if (Test-Path $instructions) {
                    $existing = Get-Content $instructions -Raw
                    # Remove existing gd-skills section if present
                    if ($existing -match [regex]::Escape($startMarker)) {
                        $existing = $existing -replace "(?s)$([regex]::Escape($startMarker)).*?$([regex]::Escape($endMarker))\r?\n?", ""
                    }
                    $content = $existing
                }
                else {
                    $content = "# GitHub Copilot Instructions`n`n"
                }

                # Append gd-skills section with markers
                $content += "`n$startMarker`n"
                $content += "# gd-skills v$Version - Game Development Rules`n`n"
                Get-ChildItem (Join-Path $ScriptDir "rules") -Filter "*.md" | ForEach-Object {
                    $raw = Get-Content $_.FullName -Raw
                    # Strip YAML frontmatter
                    if ($raw -match "^---\r?\n[\s\S]*?\r?\n---\r?\n(.*)") {
                        $content += $Matches[1]
                    }
                    else {
                        $content += $raw
                    }
                    $content += "`n"
                }
                $content += "$endMarker`n"
                $content | Out-File -FilePath $instructions -Encoding UTF8
                Write-Host "    + merged:     copilot-instructions.md"
            }
        }
    }

    # --- Write version marker ---
    $Version | Out-File -FilePath $versionFile -NoNewline -Encoding UTF8

    Write-Host ""
    Write-Host "  [$label] Done - $total components installed"
}

# --- Uninstall for a target ---
function Uninstall-Target {
    param([string]$TargetName)

    $destDir = Get-TargetDir $TargetName
    $label = Get-TargetLabel $TargetName
    $components = Get-TargetComponents $TargetName
    $versionFile = Join-Path $destDir $MarkerFile

    if (-not (Test-Path $versionFile)) {
        Write-Host "  [$label] Not installed, nothing to remove."
        return
    }

    Write-Host "  [$label] Uninstalling..."

    if ($TargetName -eq "claude") {
        foreach ($component in $components) {
            $srcDir = Join-Path $ScriptDir $component
            $compDest = Join-Path $destDir $component

            if (-not (Test-Path $srcDir) -or -not (Test-Path $compDest)) { continue }

            if ($component -eq "skills") {
                Get-ChildItem -Path $srcDir -Directory | ForEach-Object {
                    $target = Join-Path $compDest $_.Name
                    if (Test-Path $target) { Remove-Item $target -Recurse -Force }
                }
            }
            else {
                Get-ChildItem -Path $srcDir -Filter "*.md" | ForEach-Object {
                    $target = Join-Path $compDest $_.Name
                    if (Test-Path $target) { Remove-Item $target -Force }
                }
            }
        }
    }
    else {
        $combined = Join-Path $destDir "rules\gd-skills.md"
        if (Test-Path $combined) { Remove-Item $combined -Force }
        $rulesDir = Join-Path $ScriptDir "rules"
        if (Test-Path $rulesDir) {
            Get-ChildItem -Path $rulesDir -Filter "*.md" | ForEach-Object {
                $rmTarget = Join-Path $destDir "rules\$($_.Name)"
                if (Test-Path $rmTarget) { Remove-Item $rmTarget -Force }
            }
        }

        # Clean gd-skills section from copilot-instructions.md
        if ($TargetName -eq "copilot") {
            $instructions = Join-Path $destDir "copilot-instructions.md"
            $startMarker = "# --- BEGIN gd-skills ---"
            $endMarker = "# --- END gd-skills ---"
            if ((Test-Path $instructions) -and ((Get-Content $instructions -Raw) -match [regex]::Escape($startMarker))) {
                $existing = Get-Content $instructions -Raw
                $existing = $existing -replace "(?s)$([regex]::Escape($startMarker)).*?$([regex]::Escape($endMarker))\r?\n?", ""
                $existing | Out-File -FilePath $instructions -Encoding UTF8
                Write-Host "  Cleaned gd-skills content from copilot-instructions.md"
            }
        }
    }

    Remove-Item $versionFile -Force
    Write-Host "  [$label] Uninstalled."
}

# --- Read source version ---
if (-not (Test-Path $PluginJsonPath)) {
    Write-Host "Error: plugin.json not found at $PluginJsonPath"
    Write-Host "Run this script from the gd-skills repository root."
    exit 1
}

$PluginJson = Get-Content $PluginJsonPath -Raw | ConvertFrom-Json
$Version = $PluginJson.version

if (-not $Version) {
    Write-Host "Error: Could not read version from plugin.json"
    exit 1
}

# --- List targets ---
if ($ListTargets) {
    Write-Host ""
    Write-Host "  Supported targets:"
    Write-Host ""
    Write-Host "  claude     Claude Code (full install: agents, skills, commands, rules)"
    Write-Host "  cursor     Cursor (rules only, merged into single file)"
    Write-Host "  windsurf   Windsurf (rules only, merged into single file)"
    Write-Host "  copilot    GitHub Copilot (rules merged into copilot-instructions.md)"
    Write-Host "  all        Install for all targets above"
    Write-Host ""
    exit 0
}

# --- Banner ---
Write-Host ""
Write-Host "  gd-skills v$Version"
if ($Local) {
    Write-Host "  Mode: project-local ($(Get-Location))"
} else {
    Write-Host "  Mode: global (~/.claude)"
}
Write-Host "  ─────────────────────────────"
Write-Host ""

# --- Integrity check ---
if (Test-Path $ChecksumsPath) {
    Write-Host "  Verifying file integrity..."
    $failed = $false
    Get-Content $ChecksumsPath | ForEach-Object {
        if ($_ -match "^([a-f0-9]+)\s+\*?(.+)$") {
            $expectedHash = $Matches[1]
            $relPath = $Matches[2].TrimStart('*')
            $fullPath = Join-Path $ScriptDir $relPath
            if (Test-Path $fullPath) {
                $actualHash = (Get-FileHash -Path $fullPath -Algorithm SHA256).Hash.ToLower()
                if ($actualHash -ne $expectedHash) {
                    Write-Host "    MISMATCH: $relPath"
                    $failed = $true
                }
            } else {
                Write-Host "    MISSING: $relPath"
                $failed = $true
            }
        }
    }
    if ($failed) {
        Write-Host "  WARNING: Integrity check failed - some files may have been modified."
        if (-not $Force) {
            $response = Read-Host "  Continue anyway? [y/N]"
            if ($response -ne 'y' -and $response -ne 'Y') {
                Write-Host "  Aborted."
                exit 1
            }
        }
    } else {
        Write-Host "  Integrity check passed."
    }
    Write-Host ""
} else {
    Write-Host "  Note: No CHECKSUMS.sha256 found, skipping integrity verification."
    Write-Host ""
}

# --- Execute ---
if ($Target -eq "all") {
    $targets = @("claude", "cursor", "windsurf", "copilot")
}
else {
    $targets = @($Target)
}

foreach ($t in $targets) {
    if ($Uninstall) {
        Uninstall-Target $t
    }
    else {
        Install-Target $t
    }
}

Write-Host "  ─────────────────────────────"
Write-Host ""
