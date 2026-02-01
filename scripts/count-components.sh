#!/bin/bash
# count-components.sh - Counts all gd-skills plugin components

PLUGIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"

AGENTS=$(ls "$PLUGIN_DIR"/agents/*.md 2>/dev/null | wc -l)
SKILLS=$(ls -d "$PLUGIN_DIR"/skills/*/ 2>/dev/null | wc -l)
COMMANDS=$(ls "$PLUGIN_DIR"/commands/*.md 2>/dev/null | wc -l)
RULES=$(ls "$PLUGIN_DIR"/rules/*.md 2>/dev/null | wc -l)
CONTEXTS=$(ls "$PLUGIN_DIR"/contexts/*.md 2>/dev/null | wc -l)
EXAMPLES=$(ls "$PLUGIN_DIR"/examples/*.md 2>/dev/null | wc -l)

echo "=== gd-skills Component Count ==="
echo "Agents:   $AGENTS"
echo "Skills:   $SKILLS"
echo "Commands: $COMMANDS"
echo "Rules:    $RULES"
echo "Contexts: $CONTEXTS"
echo "Examples: $EXAMPLES"
echo "=========================="
echo "Total:    $((AGENTS + SKILLS + COMMANDS + RULES + CONTEXTS + EXAMPLES))"
