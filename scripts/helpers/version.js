const fs = require('fs');
const f = process.argv[2];
try {
  const p = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (!p.version) process.exit(1);
  process.stdout.write(p.version);
} catch (e) { process.exit(1); }
