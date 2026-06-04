#!/usr/bin/env node
// SessionStart hook: surface the user's project checkpoint if present.
// Reads the project cwd from the hook's JSON stdin payload (NOT process.cwd(),
// which is the plugin dir), then reads <cwd>/design/session/active.md.
// Silent no-op when there is no checkpoint. Output is capped so a bloated
// checkpoint can't flood the session context.

const fs = require("fs");
const path = require("path");

const MAX_LINES = 60;

let cwd = process.cwd();
try {
  const payload = JSON.parse(fs.readFileSync(0, "utf8"));
  if (payload && typeof payload.cwd === "string" && payload.cwd) {
    cwd = payload.cwd;
  }
} catch {
  // No/invalid stdin (e.g. run by hand) — fall back to process.cwd().
}

try {
  const file = path.join(cwd, "design", "session", "active.md");
  const content = fs.readFileSync(file, "utf8");
  if (content.trim().length > 0) {
    const lines = content.split(/\r?\n/);
    console.log("[gd-skills] Resuming from session checkpoint (design/session/active.md):\n");
    console.log(lines.slice(0, MAX_LINES).join("\n"));
    if (lines.length > MAX_LINES) {
      console.log(`\n… (${lines.length - MAX_LINES} more lines — open design/session/active.md)`);
    }
  }
} catch {
  // No checkpoint in this project — stay silent.
}
