const fs = require('fs'), path = require('path');
const [,, rulesDir, outFile, version] = process.argv;
const files = fs.readdirSync(rulesDir).filter(f => f.endsWith('.md')).sort();
let out = `# gd-skills - Game Development Rules\n\n# Imported from gd-skills v${version}\n`;
for (const f of files) {
  out += '\n---\n\n';
  out += fs.readFileSync(path.join(rulesDir, f), 'utf8');
  out += '\n';
}
fs.writeFileSync(outFile, out, 'utf8');
