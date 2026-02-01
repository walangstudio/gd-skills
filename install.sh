#!/usr/bin/env bash
#
# gd-skills installer
# Works on macOS, Linux, Git Bash (Windows), and WSL
#
# Usage:
#   ./install.sh                    Install globally to ~/.claude (default)
#   ./install.sh --local            Install to ./.claude in current project
#   ./install.sh --target cursor    Install for Cursor
#   ./install.sh --target all       Install for all detected tools
#   ./install.sh -f                 Force reinstall (skip prompts)
#   ./install.sh -u                 Uninstall
#   ./install.sh --list             List supported targets
#
# Supported targets: claude, cursor, windsurf, copilot

set -euo pipefail

# --- Configuration ---
MARKER_FILE=".gd-skills-version"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_JSON="$SCRIPT_DIR/.claude-plugin/plugin.json"
CHECKSUMS_FILE="$SCRIPT_DIR/CHECKSUMS.sha256"

# --- Parse flags ---
FORCE=false
UNINSTALL=false
TARGET="claude"
LIST_TARGETS=false
LOCAL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--force) FORCE=true; shift ;;
        -u|--uninstall) UNINSTALL=true; shift ;;
        -l|--local) LOCAL=true; shift ;;
        --target) TARGET="$2"; shift 2 ;;
        --list) LIST_TARGETS=true; shift ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -l, --local       Install to current project (./.claude)"
            echo "  --target TARGET   Install target (default: claude)"
            echo "  --list            List supported targets"
            echo "  -f, --force       Force reinstall / downgrade"
            echo "  -u, --uninstall   Remove installed files"
            echo "  -h, --help        Show this help"
            exit 0
            ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

# --- Helpers ---
version_compare() {
    # Returns: 0 if equal, 1 if $1 > $2, 2 if $1 < $2
    if [ "$1" = "$2" ]; then return 0; fi
    local IFS=.
    local i ver1=($1) ver2=($2)
    for ((i = 0; i < 3; i++)); do
        local v1=${ver1[i]:-0}
        local v2=${ver2[i]:-0}
        if [ "$v1" -gt "$v2" ] 2>/dev/null; then return 1; fi
        if [ "$v1" -lt "$v2" ] 2>/dev/null; then return 2; fi
    done
    return 0
}

count_items() {
    local dir="$1"
    if [ -d "$dir" ]; then
        ls -1 "$dir" 2>/dev/null | wc -l | tr -d ' '
    else
        echo "0"
    fi
}

# --- Target definitions ---
# Each target defines: dest_dir, components to install, and how to map them.
# Add new targets here to support more AI coding tools.

get_target_dir() {
    local base="$HOME"
    if [ "$LOCAL" = true ]; then
        base="$(pwd)"
    fi
    case $1 in
        claude)    echo "$base/.claude" ;;
        cursor)    echo "$base/.cursor" ;;
        windsurf)  echo "$base/.windsurf" ;;
        copilot)   echo "$base/.github" ;;
        *) echo ""; return 1 ;;
    esac
}

get_target_label() {
    case $1 in
        claude)    echo "Claude Code" ;;
        cursor)    echo "Cursor" ;;
        windsurf)  echo "Windsurf" ;;
        copilot)   echo "GitHub Copilot" ;;
        *) echo "$1" ;;
    esac
}

# Components that each target supports.
# Claude gets everything; others get rules (as their native format) + skills/commands as rules.
get_target_components() {
    case $1 in
        claude)    echo "agents skills commands rules" ;;
        cursor)    echo "rules" ;;
        windsurf)  echo "rules" ;;
        copilot)   echo "rules" ;;
        *) echo "" ;;
    esac
}

# Install files for a target. Claude uses direct copy; others get rules merged.
install_for_target() {
    local target="$1"
    local dest_dir
    dest_dir=$(get_target_dir "$target")
    local label
    label=$(get_target_label "$target")
    local components
    components=$(get_target_components "$target")

    if [ -z "$dest_dir" ]; then
        echo "  Unknown target: $target"
        return 1
    fi

    local version_file="$dest_dir/$MARKER_FILE"

    # --- Version check ---
    if [ -f "$version_file" ]; then
        local installed_version
        installed_version=$(cat "$version_file" | tr -d '[:space:]')

        set +e
        version_compare "$installed_version" "$VERSION"
        local cmp=$?
        set -e

        case $cmp in
            1)
                echo "  [$label] Installed v$installed_version is newer than source v$VERSION."
                if [ "$FORCE" = false ]; then
                    echo "  Use -f to force downgrade."
                    return 0
                fi
                echo "  Forcing reinstall..."
                ;;
            0)
                echo "  [$label] v$VERSION is already installed."
                if [ "$FORCE" = false ]; then
                    read -p "  Reinstall? [y/N] " -n 1 -r
                    echo ""
                    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                        return 0
                    fi
                fi
                ;;
            2)
                echo "  [$label] Upgrading from v$installed_version to v$VERSION..."
                ;;
        esac
    else
        echo "  [$label] Installing v$VERSION..."
    fi

    # --- Backup existing files ---
    local backup_dir="$dest_dir/.gd-skills-backup-$(date +%Y%m%d%H%M%S)"
    local backed_up=false

    if [ -f "$version_file" ]; then
        for component in $components; do
            local comp_dest="$dest_dir/$component"
            if [ -d "$comp_dest" ]; then
                if [ "$backed_up" = false ]; then
                    mkdir -p "$backup_dir"
                    echo "  Backing up existing files to $backup_dir"
                    backed_up=true
                fi
                cp -r "$comp_dest" "$backup_dir/"
            fi
        done
    fi

    # --- Create directories and copy ---
    mkdir -p "$dest_dir"
    local total=0

    if [ "$target" = "claude" ]; then
        # Claude Code: direct copy of all component directories
        for component in $components; do
            local src_dir="$SCRIPT_DIR/$component"
            local comp_dest="$dest_dir/$component"

            if [ ! -d "$src_dir" ]; then
                echo "    Warning: $src_dir not found, skipping."
                continue
            fi

            mkdir -p "$comp_dest"
            cp -r "$src_dir"/* "$comp_dest"/
            local count
            count=$(count_items "$src_dir")
            printf "    %-12s %s items\n" "$component:" "$count"
            total=$((total + count))
        done
    else
        # Other targets: merge rules into their native format
        local rules_dest="$dest_dir/rules"
        mkdir -p "$rules_dest"

        # Copy rules as individual files
        if [ -d "$SCRIPT_DIR/rules" ]; then
            cp "$SCRIPT_DIR/rules"/*.md "$rules_dest"/
            local count
            count=$(count_items "$SCRIPT_DIR/rules")
            printf "    %-12s %s items\n" "rules:" "$count"
            total=$((total + count))
        fi

        # Generate a combined instructions file for targets that use a single file
        case $target in
            cursor)
                local combined="$dest_dir/rules/gd-skills.md"
                echo "# gd-skills — Game Development Rules" > "$combined"
                echo "" >> "$combined"
                echo "# Imported from gd-skills v$VERSION" >> "$combined"
                echo "" >> "$combined"
                for rule_file in "$SCRIPT_DIR/rules"/*.md; do
                    echo "---" >> "$combined"
                    echo "" >> "$combined"
                    cat "$rule_file" >> "$combined"
                    echo "" >> "$combined"
                done
                echo "    + combined:   gd-skills.md"
                ;;
            windsurf)
                local combined="$dest_dir/rules/gd-skills.md"
                echo "# gd-skills — Game Development Rules" > "$combined"
                echo "" >> "$combined"
                echo "# Imported from gd-skills v$VERSION" >> "$combined"
                echo "" >> "$combined"
                for rule_file in "$SCRIPT_DIR/rules"/*.md; do
                    echo "---" >> "$combined"
                    echo "" >> "$combined"
                    cat "$rule_file" >> "$combined"
                    echo "" >> "$combined"
                done
                echo "    + combined:   gd-skills.md"
                ;;
            copilot)
                local instructions="$dest_dir/copilot-instructions.md"
                local start_marker="# --- BEGIN gd-skills ---"
                local end_marker="# --- END gd-skills ---"

                if [ -f "$instructions" ]; then
                    # Remove existing gd-skills section if present
                    if grep -q "$start_marker" "$instructions"; then
                        sed -i "/$start_marker/,/$end_marker/d" "$instructions"
                    fi
                else
                    echo "# GitHub Copilot Instructions" > "$instructions"
                    echo "" >> "$instructions"
                fi

                # Append gd-skills section with markers
                {
                    echo ""
                    echo "$start_marker"
                    echo "# gd-skills v$VERSION — Game Development Rules"
                    echo ""
                    for rule_file in "$SCRIPT_DIR/rules"/*.md; do
                        # Strip YAML frontmatter
                        sed '1{/^---$/!q;};1,/^---$/d' "$rule_file"
                        echo ""
                    done
                    echo "$end_marker"
                } >> "$instructions"
                echo "    + merged:     copilot-instructions.md"
                ;;
        esac
    fi

    # --- Write version marker ---
    echo "$VERSION" > "$version_file"
    echo ""
    echo "  [$label] Done — $total components installed"
}

# Uninstall files for a target
uninstall_for_target() {
    local target="$1"
    local dest_dir
    dest_dir=$(get_target_dir "$target")
    local label
    label=$(get_target_label "$target")
    local components
    components=$(get_target_components "$target")

    if [ -z "$dest_dir" ]; then
        echo "  Unknown target: $target"
        return 1
    fi

    local version_file="$dest_dir/$MARKER_FILE"
    if [ ! -f "$version_file" ]; then
        echo "  [$label] Not installed, nothing to remove."
        return 0
    fi

    echo "  [$label] Uninstalling..."

    if [ "$target" = "claude" ]; then
        for component in $components; do
            local src_dir="$SCRIPT_DIR/$component"
            local comp_dest="$dest_dir/$component"

            if [ ! -d "$src_dir" ] || [ ! -d "$comp_dest" ]; then
                continue
            fi

            if [ "$component" = "skills" ]; then
                for skill_dir in "$src_dir"/*/; do
                    local skill_name
                    skill_name=$(basename "$skill_dir")
                    rm -rf "$comp_dest/$skill_name" 2>/dev/null || true
                done
            else
                for file in "$src_dir"/*.md; do
                    local fname
                    fname=$(basename "$file")
                    rm -f "$comp_dest/$fname" 2>/dev/null || true
                done
            fi
        done
    else
        rm -f "$dest_dir/rules/gd-skills.md" 2>/dev/null || true
        for rule_file in "$SCRIPT_DIR/rules"/*.md; do
            local fname
            fname=$(basename "$rule_file")
            rm -f "$dest_dir/rules/$fname" 2>/dev/null || true
        done

        # Clean gd-skills section from copilot-instructions.md
        if [ "$target" = "copilot" ]; then
            local instructions="$dest_dir/copilot-instructions.md"
            local start_marker="# --- BEGIN gd-skills ---"
            local end_marker="# --- END gd-skills ---"
            if [ -f "$instructions" ] && grep -q "$start_marker" "$instructions"; then
                sed -i "/$start_marker/,/$end_marker/d" "$instructions"
                echo "  Cleaned gd-skills content from copilot-instructions.md"
            fi
        fi
    fi

    rm -f "$version_file"
    echo "  [$label] Uninstalled."
}

# --- Read source version ---
if [ ! -f "$PLUGIN_JSON" ]; then
    echo "Error: plugin.json not found at $PLUGIN_JSON"
    echo "Run this script from the gd-skills repository root."
    exit 1
fi

VERSION=$(grep '"version"' "$PLUGIN_JSON" | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
if [ -z "$VERSION" ]; then
    echo "Error: Could not read version from plugin.json"
    exit 1
fi

# --- List targets ---
if [ "$LIST_TARGETS" = true ]; then
    echo ""
    echo "  Supported targets:"
    echo ""
    echo "  claude     Claude Code (full install: agents, skills, commands, rules)"
    echo "  cursor     Cursor (rules only, merged into single file)"
    echo "  windsurf   Windsurf (rules only, merged into single file)"
    echo "  copilot    GitHub Copilot (rules merged into copilot-instructions.md)"
    echo "  all        Install for all targets above"
    echo ""
    exit 0
fi

# --- Banner ---
echo ""
echo "  gd-skills v$VERSION"
if [ "$LOCAL" = true ]; then
    echo "  Mode: project-local ($(pwd))"
else
    echo "  Mode: global (~/.claude)"
fi
echo "  ─────────────────────────────"
echo ""

# --- Integrity check ---
if [ -f "$CHECKSUMS_FILE" ] && command -v sha256sum &>/dev/null; then
    echo "  Verifying file integrity..."
    if (cd "$SCRIPT_DIR" && sha256sum --quiet -c "$CHECKSUMS_FILE" 2>/dev/null); then
        echo "  Integrity check passed."
    else
        echo "  WARNING: Integrity check failed — some files may have been modified."
        if [ "$FORCE" = false ]; then
            read -p "  Continue anyway? [y/N] " -n 1 -r
            echo ""
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo "  Aborted."
                exit 1
            fi
        fi
    fi
    echo ""
elif [ ! -f "$CHECKSUMS_FILE" ]; then
    echo "  Note: No CHECKSUMS.sha256 found, skipping integrity verification."
    echo ""
fi

# --- Execute ---
if [ "$TARGET" = "all" ]; then
    TARGETS="claude cursor windsurf copilot"
else
    TARGETS="$TARGET"
fi

for t in $TARGETS; do
    if [ "$UNINSTALL" = true ]; then
        uninstall_for_target "$t"
    else
        install_for_target "$t"
    fi
done

echo "  ─────────────────────────────"
echo ""
