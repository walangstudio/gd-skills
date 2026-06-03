#!/usr/bin/env node
// Advisory checks for Defold .script files
// Used by hooks.json PostToolUse to nudge Defold idioms on edited .script files.
// Defold Lua is dynamically typed, so this is a lightweight, non-fatal advisory.

const fs = require("fs");

const filePath = process.argv[2];
if (!filePath) {
  process.exit(0);
}

try {
  const content = fs.readFileSync(filePath, "utf8");

  // Defold scripts are plain Lua, NOT Luau — flag accidental Luau typing.
  if (content.includes("--!strict")) {
    console.error(
      "[Hook] Defold uses plain Lua, not Luau. Remove '--!strict' and type annotations from .script files."
    );
  }

  // A script with no lifecycle callbacks at all is usually a mistake.
  if (!content.match(/function\s+(init|update|on_message|on_input|final)\s*\(/)) {
    console.error(
      "[Hook] Defold .script has no lifecycle callback (init/update/on_message/on_input/final). Add the ones you need."
    );
  }

  // Comparing message_id to a raw string never matches — must hash().
  if (content.match(/message_id\s*==\s*["']/)) {
    console.error(
      "[Hook] Compare message_id against hash(\"...\"), not a raw string — a string comparison never matches."
    );
  }
} catch {
  // File may not exist yet or be inaccessible — skip silently
}
