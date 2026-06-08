#!/bin/bash
# test-samples.sh - Run every sample's headless logic tests (node test.js).
# Fails if any suite fails. Wired into CI so sample logic can't silently regress.

PLUGIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PLUGIN_DIR" || exit 1

fail=0
found=0

for t in samples/*/*/test.js; do
    [ -f "$t" ] || continue
    found=$((found + 1))
    echo "--- $t ---"
    if ! node "$t"; then
        fail=1
    fi
done

echo ""
if [ "$found" -eq 0 ]; then
    echo "No sample tests found (samples/*/*/test.js)."
    exit 0
fi
if [ "$fail" -ne 0 ]; then
    echo "FAIL: one or more sample test suites failed."
    exit 1
fi
echo "All $found sample test suite(s) passed."
