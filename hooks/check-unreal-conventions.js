#!/usr/bin/env node
// Check Unreal C++ conventions
// Used by hooks.json PostToolUse to validate edited .cpp/.h files

const fs = require("fs");

const filePath = process.argv[2];
if (!filePath) {
  process.exit(0);
}

try {
  const content = fs.readFileSync(filePath, "utf8");
  // Check for UPROPERTY/UFUNCTION macros on exposed members
  if (
    content.match(/\bclass\s+\w+\s*:\s*public\s+(?:AActor|UActorComponent|APawn|ACharacter)/) &&
    !content.match(/UPROPERTY|UFUNCTION|GENERATED_BODY/)
  ) {
    console.error(
      "[Hook] Unreal C++ class missing UPROPERTY/UFUNCTION macros or GENERATED_BODY(). Use UE5 reflection macros for exposed members."
    );
  }
} catch {
  // File may not exist yet or be inaccessible — skip silently
}
