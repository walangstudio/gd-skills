#!/bin/bash
# regenerate-checksums.sh - Regenerates CHECKSUMS.sha256 from current file state
# Called automatically by the pre-commit hook, or run manually after content changes

PLUGIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$PLUGIN_DIR" || exit 1

find agents skills commands rules hooks contexts -type f \( -name "*.md" -o -name "*.json" -o -name "*.js" \) \
  | sort \
  | xargs sha256sum \
  > CHECKSUMS.sha256

echo "Regenerated CHECKSUMS.sha256 ($(wc -l < CHECKSUMS.sha256) files)"
