#!/usr/bin/env node
// Check Unity C# conventions
// Used by hooks.json PostToolUse to validate edited .cs files

const fs = require("fs");

const filePath = process.argv[2];
if (!filePath) {
  process.exit(0);
}

try {
  const content = fs.readFileSync(filePath, "utf8");
  if (
    content.match(/public\s+\w+\s+\w+;/) &&
    !content.match(/\/\/\/|\[SerializeField\]/)
  ) {
    console.error(
      "[Hook] C# public fields should use [SerializeField] for Unity inspector or be properties"
    );
  }
} catch {
  // File may not exist yet or be inaccessible — skip silently
}
