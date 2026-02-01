#!/usr/bin/env node
// Check for type hints in GDScript files
// Used by hooks.json PostToolUse to validate edited .gd files

const fs = require("fs");

const filePath = process.argv[2];
if (!filePath) {
  process.exit(0);
}

try {
  const content = fs.readFileSync(filePath, "utf8");
  if (!content.match(/:\s*(int|float|String|bool|Vector2|Vector3|Node)/)) {
    console.error(
      "[Hook] GDScript missing type hints. Add type hints for all variables and functions."
    );
  }
} catch {
  // File may not exist yet or be inaccessible — skip silently
}
