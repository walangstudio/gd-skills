#!/usr/bin/env node
// Check JavaScript/TypeScript game development patterns
// Used by hooks.json PostToolUse to validate edited .js/.ts files

const fs = require("fs");

const filePath = process.argv[2];
if (!filePath) {
  process.exit(0);
}

try {
  const content = fs.readFileSync(filePath, "utf8");
  // Check for var usage (should use const/let)
  if (content.match(/\bvar\s+\w+/)) {
    console.error(
      "[Hook] JavaScript: Use 'const' or 'let' instead of 'var' for block scoping."
    );
  }
} catch {
  // File may not exist yet or be inaccessible — skip silently
}
