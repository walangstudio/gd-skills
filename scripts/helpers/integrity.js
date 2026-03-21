const fs = require('fs'), path = require('path'), cp = require('child_process');
const [,, checksumFile, scriptDir] = process.argv;
const lines = fs.readFileSync(checksumFile, 'utf8').split('\n');
let failed = false;
for (const line of lines) {
  const m = line.match(/^([a-f0-9]+)\s+(.+)$/);
  if (!m) continue;
  const [, expected, rel] = m;
  const full = path.join(scriptDir, rel);
  if (!fs.existsSync(full)) {
    console.error('  MISSING: ' + rel);
    failed = true;
    continue;
  }
  try {
    const actual = cp.execSync(`git hash-object "${full}"`, { encoding: 'utf8' }).trim();
    if (actual !== expected) { console.error('  MISMATCH: ' + rel); failed = true; }
  } catch (e) { console.error('  ERROR checking: ' + rel); failed = true; }
}
process.exit(failed ? 1 : 0);
