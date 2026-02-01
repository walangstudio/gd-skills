#!/usr/bin/env node
// Check for type annotations in Luau files
// Used by hooks.json PostToolUse to validate edited .lua files

const fs = require("fs");

const filePath = process.argv[2];
if (!filePath) {
  process.exit(0);
}

try {
  const content = fs.readFileSync(filePath, "utf8");
  if (!content.match(/local\s+\w+:\s*(number|string|boolean)/)) {
    console.error(
      "[Hook] Luau missing type annotations. Use strict typing: local x: number"
    );
  }
} catch {
  // File may not exist yet or be inaccessible — skip silently
}
