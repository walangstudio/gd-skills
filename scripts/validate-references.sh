#!/bin/bash
# validate-references.sh - Validates cross-references between commands, agents, and skills
# Ensures every referenced agent/skill/command actually exists

PLUGIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ERRORS=0

echo "=== gd-skills Cross-Reference Validator ==="
echo "Checking: $PLUGIN_DIR"
echo ""

# Build lists of existing components
AGENTS=()
for f in "$PLUGIN_DIR"/agents/*.md; do
    [ -f "$f" ] || continue
    name=$(basename "$f" .md)
    AGENTS+=("$name")
done

SKILLS=()
for d in "$PLUGIN_DIR"/skills/*/; do
    [ -d "$d" ] || continue
    name=$(basename "$d")
    SKILLS+=("$name")
done

COMMANDS=()
for f in "$PLUGIN_DIR"/commands/*.md; do
    [ -f "$f" ] || continue
    name=$(basename "$f" .md)
    COMMANDS+=("$name")
done

echo "Found: ${#AGENTS[@]} agents, ${#SKILLS[@]} skills, ${#COMMANDS[@]} commands"
echo ""

# Helper: check if value is in array
contains() {
    local needle="$1"
    shift
    for item in "$@"; do
        [ "$item" = "$needle" ] && return 0
    done
    return 1
}

# Check agent references in commands
echo "--- Checking command → agent references ---"
for f in "$PLUGIN_DIR"/commands/*.md; do
    [ -f "$f" ] || continue
    cmd_name=$(basename "$f" .md)

    # Look for agent name references (e.g., **genre-template-master** or `godot-specialist`)
    while IFS= read -r agent_ref; do
        if ! contains "$agent_ref" "${AGENTS[@]}"; then
            echo "  ERROR: $cmd_name references unknown agent: $agent_ref"
            ERRORS=$((ERRORS + 1))
        fi
    done < <(grep -oP '(?:\*\*|`)([a-z]+-[a-z-]+(?:-specialist|-builder|-master|-debugger|-architect))(?:\*\*|`)' "$f" | sed 's/[*`]//g' | sort -u)
done
echo ""

# Check skill references in commands and agents
echo "--- Checking command/agent → skill references ---"
for f in "$PLUGIN_DIR"/commands/*.md "$PLUGIN_DIR"/agents/*.md; do
    [ -f "$f" ] || continue
    src_name=$(basename "$f" .md)

    # Look for skill name references (e.g., `platformer-template` or `player-controllers`)
    while IFS= read -r skill_ref; do
        if ! contains "$skill_ref" "${SKILLS[@]}"; then
            echo "  ERROR: $src_name references unknown skill: $skill_ref"
            ERRORS=$((ERRORS + 1))
        fi
    done < <(grep -oP '`([a-z]+-[a-z-]+(?:-template|-systems|-patterns|-controllers|-structure))`' "$f" | sed 's/`//g' | sort -u)
done
echo ""

# Check skill cross-references
echo "--- Checking skill → skill references ---"
for d in "$PLUGIN_DIR"/skills/*/; do
    [ -d "$d" ] || continue
    skill_file="$d/SKILL.md"
    [ -f "$skill_file" ] || continue
    skill_name=$(basename "$d")

    while IFS= read -r ref; do
        if [ "$ref" != "$skill_name" ] && ! contains "$ref" "${SKILLS[@]}"; then
            echo "  ERROR: $skill_name references unknown skill: $ref"
            ERRORS=$((ERRORS + 1))
        fi
    done < <(grep -oP '`([a-z]+-[a-z-]+(?:-template|-systems|-patterns|-controllers|-structure))`' "$skill_file" | sed 's/`//g' | sort -u)
done
echo ""

# Summary
echo "=== Summary ==="
if [ "$ERRORS" -eq 0 ]; then
    echo "All cross-references are valid!"
else
    echo "$ERRORS cross-reference error(s) found."
    exit 1
fi
