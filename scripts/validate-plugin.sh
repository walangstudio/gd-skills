#!/bin/bash
# validate-plugin.sh - Validates gd-skills plugin structure
# Checks that all components exist and have proper frontmatter

PLUGIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ERRORS=0

echo "=== gd-skills Plugin Validator ==="
echo "Checking: $PLUGIN_DIR"
echo ""

# Check agents
echo "--- Agents ---"
for f in "$PLUGIN_DIR"/agents/*.md; do
    name=$(basename "$f")
    if ! head -1 "$f" | grep -q "^---"; then
        echo "  ERROR: $name missing YAML frontmatter"
        ERRORS=$((ERRORS + 1))
    else
        echo "  OK: $name"
    fi
done
echo "  Total: $(ls "$PLUGIN_DIR"/agents/*.md 2>/dev/null | wc -l)"
echo ""

# Check skills
echo "--- Skills ---"
for d in "$PLUGIN_DIR"/skills/*/; do
    name=$(basename "$d")
    skill_file="$d/SKILL.md"
    if [ ! -f "$skill_file" ]; then
        echo "  ERROR: $name missing SKILL.md"
        ERRORS=$((ERRORS + 1))
    elif ! head -1 "$skill_file" | grep -q "^---"; then
        echo "  ERROR: $name/SKILL.md missing YAML frontmatter"
        ERRORS=$((ERRORS + 1))
    else
        echo "  OK: $name"
    fi
done
echo "  Total: $(ls -d "$PLUGIN_DIR"/skills/*/ 2>/dev/null | wc -l)"
echo ""

# Check commands
echo "--- Commands ---"
for f in "$PLUGIN_DIR"/commands/*.md; do
    name=$(basename "$f")
    if ! head -1 "$f" | grep -q "^---"; then
        echo "  ERROR: $name missing YAML frontmatter"
        ERRORS=$((ERRORS + 1))
    else
        echo "  OK: $name"
    fi
done
echo "  Total: $(ls "$PLUGIN_DIR"/commands/*.md 2>/dev/null | wc -l)"
echo ""

# Check rules
echo "--- Rules ---"
for f in "$PLUGIN_DIR"/rules/*.md; do
    name=$(basename "$f")
    echo "  OK: $name"
done
echo "  Total: $(ls "$PLUGIN_DIR"/rules/*.md 2>/dev/null | wc -l)"
echo ""

# Summary
echo "=== Summary ==="
if [ "$ERRORS" -eq 0 ]; then
    echo "All checks passed!"
else
    echo "$ERRORS error(s) found."
fi
