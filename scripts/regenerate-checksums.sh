#!/bin/bash
# regenerate-checksums.sh - Regenerates CHECKSUMS.sha256 from current file state
# Called automatically by the pre-commit hook, or run manually after content changes
#
# Uses git's hash-object (blob hash) instead of sha256sum so that checksums
# are identical on Windows (CRLF) and Linux/macOS (LF) when autocrlf is active.

PLUGIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$PLUGIN_DIR" || exit 1

> CHECKSUMS.sha256

find agents skills commands rules hooks contexts -type f \( -name "*.md" -o -name "*.json" -o -name "*.js" \) \
  | sort \
  | while IFS= read -r file; do
      hash=$(git hash-object "$file")
      echo "$hash  $file" >> CHECKSUMS.sha256
    done

echo "Regenerated CHECKSUMS.sha256 ($(wc -l < CHECKSUMS.sha256) files)"
