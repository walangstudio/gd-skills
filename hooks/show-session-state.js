#!/usr/bin/env node
// Surface the active session checkpoint at session start.
// Reads design/session/active.md if present and prints it so work can resume.
// Silent no-op when the file is absent (e.g. a fresh project) — never errors.

const fs = require("fs");
const path = require("path");

const candidates = [
  "design/session/active.md",
  path.join(process.cwd(), "design", "session", "active.md"),
];

for (const file of candidates) {
  try {
    const content = fs.readFileSync(file, "utf8");
    if (content.trim().length > 0) {
      console.log("[gd-skills] Resuming from session checkpoint (design/session/active.md):\n");
      console.log(content);
    }
    break;
  } catch {
    // Not found here — try the next candidate, then exit silently.
  }
}
